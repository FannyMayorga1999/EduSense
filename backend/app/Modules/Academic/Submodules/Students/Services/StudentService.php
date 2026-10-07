<?php

namespace App\Modules\Academic\Submodules\Students\Services;

use App\Modules\Academic\Models\AcademicTerm;
use App\Modules\Academic\Models\Course;
use App\Modules\Academic\Models\Enrollment;
use App\Modules\Academic\Submodules\Students\Models\Student;
use App\Modules\Psychopedagogic\Services\PsychopedagogicEvaluationService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Business rules of the Students submodule (academic).
 *
 * Owns the filtered query, the write lifecycle (including the enrollment of
 * the student in the selected term) and the flattening used by the export, so
 * the controller only orchestrates the HTTP layer and the audit trail.
 */
class StudentService
{
    /**
     * Relations loaded for the listing and the export.
     */
    private const LIST_RELATIONS = 'enrollments.course:id,name';

    /**
     * Relations loaded for the detail view.
     *
     * @var array<int, string>
     */
    private const DETAIL_RELATIONS = [
        'tutor:id,name,email',
        'enrollments',
        'enrollments.course:id,name',
        'enrollments.term:id,name',
        'psychopedagogicRecords',
        'diagnostics',
        'diagnostics.neeCategory:id,name',
    ];

    /**
     * Eager loads that `index` and `export` share.
     */
    public function query(Request $request): Builder
    {
        $activeStates = $this->multiValue($request->input('is_active'));
        $grades = $this->multiValue($request->input('grade'));
        $parallels = $this->multiValue($request->input('parallel'));
        $includeUndefined = $request->boolean('parallel_undefined');

        return Student::query()
            ->withCount([
                'psychopedagogicRecords',
                'diagnostics',
                'interventionSchedules',
            ])
            ->when(
                $request->string('search')->toString(),
                fn ($query, $search) => $query->where(function ($query) use ($search) {
                    $query->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('document_number', 'like', "%{$search}%");
                })
            )
            ->when($activeStates !== [], fn ($query) => $query->whereIn('is_active', $activeStates))
            ->when($grades !== [], fn ($query) => $query->whereHas(
                'enrollments.course',
                fn ($query) => $query->whereIn('id', array_map('intval', $grades))
            ))
            ->when($parallels !== [], fn ($query) => $query->whereHas(
                'enrollments',
                fn ($query) => $query->whereIn('parallel', $parallels)
            ))
            ->when($includeUndefined, fn ($query) => $query->where(function ($query) {
                $query->whereDoesntHave('enrollments')
                    ->orWhereHas('enrollments', fn ($q) => $q->whereNull('parallel')->orWhere('parallel', ''));
            }));
    }

    /**
     * Listing query: relations and ordering ready to be paginated.
     */
    public function listQuery(Request $request): Builder
    {
        return $this->query($request)
            ->with(self::LIST_RELATIONS)
            ->orderBy('last_name')
            ->orderBy('first_name');
    }

    /**
     * Full result set of the current filters, used by the export.
     *
     * @return Collection<int, Student>
     */
    public function filtered(Request $request): Collection
    {
        $query = $this->listQuery($request);

        $ids = $this->multiValue($request->input('ids'));

        if ($ids !== []) {
            $query->whereIn('id', array_map('intval', $ids));
        }

        return $query->get();
    }

    /**
     * Creates a student together with the enrollment of the selected term.
     *
     * Both writes run in a single transaction so a failure never leaves a
     * student row without the academic data the form asked for.
     *
     * @param  array<string, mixed>  $validated
     */
    public function create(array $validated): Student
    {
        $student = DB::transaction(function () use ($validated): Student {
            $student = Student::query()->create($this->studentAttributes($validated));

            $this->syncAcademicData($student, $validated);

            return $student;
        });

        return $student->refresh()->load(self::LIST_RELATIONS);
    }

    /**
     * Updates a student and re-synchronizes the current enrollment.
     *
     * @param  array<string, mixed>  $validated
     */
    public function update(Student $student, array $validated): Student
    {
        DB::transaction(function () use ($student, $validated): void {
            $student->update($this->studentAttributes($validated));

            $this->syncAcademicData($student, $validated);
        });

        return $student->load(self::LIST_RELATIONS);
    }

    /**
     * Returns a student with its academic and psychopedagogic context.
     */
    public function detail(Student $student): Student
    {
        $student->load(self::DETAIL_RELATIONS);

        $student->setAttribute(
            'evaluation_summary',
            app(PsychopedagogicEvaluationService::class)->studentSummary($student->id),
        );

        return $student;
    }

    /**
     * Marks a student as logically deleted.
     */
    public function deactivate(Student $student): void
    {
        $student->update(['is_active' => false]);
    }

    /**
     * Bulk updates the parallel of multiple students' enrollments.
     *
     * @param  array<int>  $studentIds
     */
    public function bulkUpdateParallel(array $studentIds, ?string $parallel): int
    {
        return Enrollment::query()
            ->whereIn('student_id', $studentIds)
            ->where('term_id', AcademicTerm::query()->where('is_current', true)->value('id'))
            ->update(['parallel' => $parallel]);
    }

    /**
     * Bulk toggles the active status of multiple students.
     *
     * @param  array<int>  $studentIds
     */
    public function bulkToggleStatus(array $studentIds, bool $isActive): int
    {
        return Student::query()
            ->whereIn('id', $studentIds)
            ->update(['is_active' => $isActive]);
    }

    /**
     * Column labels of the exported files.
     *
     * @return array<int, string>
     */
    public function exportColumns(): array
    {
        return ['Número de documento', 'Nombres', 'Apellidos', 'Fecha de nacimiento', 'Grado', 'Estado'];
    }

    /**
     * Flattened values of a student row for the exported files.
     *
     * @return array{document_number: mixed, first_name: mixed, last_name: mixed, birth_date: mixed, grade: mixed, is_active: mixed}
     */
    public function exportRow(Student $student): array
    {
        return [
            'document_number' => $student->document_number,
            'first_name' => $student->first_name,
            'last_name' => $student->last_name,
            'birth_date' => $student->birth_date?->format('Y-m-d'),
            'grade' => $student->enrollments->first()?->course?->name,
            'is_active' => $student->is_active ? 'Activo' : 'Inactivo',
        ];
    }

    /**
     * Human-readable description of the filters applied to an export request.
     *
     * Mirrors the parameters accepted by {@see self::query()} so the exported
     * file states exactly which slice of the list it contains. Returns an
     * empty string when no filter was sent.
     */
    public function exportFilterDescription(Request $request): string
    {
        $filters = [];

        $search = $request->string('search')->toString();
        if ($search !== '') {
            $filters[] = 'Búsqueda: '.$search;
        }

        $states = $this->multiValue($request->input('is_active'));
        if ($states !== []) {
            $labels = collect($states)
                ->map(fn (string $state) => $state === '1' ? 'Activo' : 'Inactivo')
                ->implode(', ');
            $filters[] = 'Estado: '.$labels;
        }

        $grades = $this->multiValue($request->input('grade'));
        if ($grades !== []) {
            $names = Course::whereIn('id', array_map('intval', $grades))->pluck('name');
            $filters[] = 'Grado: '.($names->isEmpty() ? implode(', ', $grades) : $names->implode(', '));
        }

        $parallels = $this->multiValue($request->input('parallel'));
        if ($request->boolean('parallel_undefined')) {
            $parallels[] = 'sin definir';
        }
        if ($parallels !== []) {
            $filters[] = 'Paralelo: '.implode(', ', $parallels);
        }

        return implode(' · ', $filters);
    }

    /**
     * Builds the mass-assignable attributes of the student master record.
     *
     * The academic fields are excluded because they describe the enrollment,
     * which is synchronized separately. Values are passed through untouched:
     * the global `TrimStrings` and `ConvertEmptyStringsToNull` middleware
     * already normalize the input, and coercing booleans or dates to strings
     * here would only bypass the model casts.
     *
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    protected function studentAttributes(array $validated): array
    {
        return collect($validated)
            ->except(['course_id', 'term_id', 'parallel', 'academic_status'])
            ->all();
    }

    /**
     * Syncs the current enrollment from the academic section of the request.
     *
     * When a term is provided the enrollment of that term is created/updated.
     * The academic status maps to the enrollment status and the logical state
     * of the student as follows: active -> enrollment active; inactive ->
     * logical delete (is_active=false); graduated -> enrollment completed;
     * retired -> enrollment retired. The "active|graduated|retired" mappings
     * never override the system state (is_active) sent by the form.
     *
     * @param  array<string, mixed>  $data
     *
     * @throws ValidationException
     */
    protected function syncAcademicData(Student $student, array $data): void
    {
        $termId = $this->nullableInt(data_get($data, 'term_id'));
        $courseId = $this->nullableInt(data_get($data, 'course_id'));
        $status = data_get($data, 'academic_status');

        if ($termId !== null) {
            $current = $student->enrollments()->where('term_id', $termId)->first();
            $resolvedCourseId = $courseId ?? $current?->course_id;

            // aca_enrollments.course_id is NOT NULL: refuse the write instead
            // of failing deep in the database with a constraint violation.
            if ($resolvedCourseId === null) {
                throw ValidationException::withMessages([
                    'course_id' => 'A course is required to enroll the student in a term.',
                ]);
            }

            Enrollment::query()->updateOrCreate(
                ['student_id' => $student->id, 'term_id' => $termId],
                [
                    'course_id' => $resolvedCourseId,
                    'parallel' => $this->nullableString(data_get($data, 'parallel')),
                    'status' => match ($status) {
                        'graduated' => 'completed',
                        'retired' => 'retired',
                        default => 'active',
                    },
                ],
            );
        }

        if ($status === 'inactive') {
            $student->forceFill(['is_active' => false])->save();
        }
    }

    /**
     * Normalizes a filter param that arrives as a single value or as an array
     * (repeated query params) into a list of trimmed, non-empty strings.
     *
     * @return array<int, string>
     */
    protected function multiValue(mixed $value): array
    {
        $values = is_array($value) ? $value : [$value];

        return collect($values)
            ->map(fn ($item) => trim((string) $item))
            ->filter(fn (string $item) => $item !== '')
            ->values()
            ->all();
    }

    /**
     * Normalizes an optional integer field of the request.
     */
    protected function nullableInt(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (int) $value;
    }

    /**
     * Normalizes an optional string field of the request.
     */
    protected function nullableString(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (string) $value;
    }
}
