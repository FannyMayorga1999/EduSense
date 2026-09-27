<?php

namespace App\Modules\Students\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\Academic\Models\Enrollment;
use App\Modules\Administration\Services\AuditService;
use App\Modules\Psychopedagogic\Services\PsychopedagogicEvaluationService;
use App\Modules\Students\Http\Requests\ImportStudentsRequest;
use App\Modules\Students\Http\Requests\StoreStudentRequest;
use App\Modules\Students\Http\Requests\UpdateStudentRequest;
use App\Modules\Students\Models\Student;
use App\Modules\Students\Services\StudentImportService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx as XlsxWriter;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * CRUD of the student master records (Students module), plus bulk CSV
 * import and filtered CSV/XLSX export.
 */
class StudentController extends Controller
{
    public function __construct(
        private readonly AuditService $audit,
        private readonly StudentImportService $studentImport,
    ) {}

    /**
     * Shared query builder for the filters used by the list and the export.
     *
     * `is_active` and `grade` accept one or several values (repeated query
     * parameters such as `grade[]=...`); multiple values are combined with OR
     * through `whereIn`.
     */
    protected function studentsQuery(Request $request): Builder
    {
        $activeStates = $this->multiValue($request->input('is_active'));
        $grades = $this->multiValue($request->input('grade'));

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
                fn ($query) => $query->whereIn('name', $grades)
            ));
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
     * Paginated list of students.
     */
    public function index(Request $request): JsonResponse
    {
        $students = $this->paginateQuery(
            $request,
            $this->studentsQuery($request)
                ->with('enrollments.course:id,name')
                ->orderBy('last_name')
                ->orderBy('first_name')
        );

        return $this->success($students);
    }

    /**
     * Creates a student.
     */
    public function store(StoreStudentRequest $request): JsonResponse
    {
        $payload = collect($request->safe()->except(['course_id', 'term_id', 'parallel', 'academic_status']))
            ->map(fn (mixed $value) => $this->nullableString($value))
            ->all();

        $student = Student::query()->create($payload);

        $this->syncAcademicData($student, $request->validated());

        $student->refresh()->load('enrollments.course:id,name');

        $this->audit->record('students.create', 'students', ['student_id' => $student->id]);

        return $this->success($student, 'Student created.', 201);
    }

    /**
     * Returns a student with its academic and psychopedagogic context.
     */
    public function show(Student $student): JsonResponse
    {
        $student->load([
            'tutor:id,name,email',
            'enrollments',
            'enrollments.course:id,name',
            'enrollments.term:id,name',
            'psychopedagogicRecords',
            'diagnostics',
            'diagnostics.neeCategory:id,name',
        ]);

        $student->setAttribute('evaluation_summary', app(PsychopedagogicEvaluationService::class)->studentSummary($student->id));

        return $this->success($student);
    }

    /**
     * Updates a student.
     */
    public function update(UpdateStudentRequest $request, Student $student): JsonResponse
    {
        $payload = collect($request->safe()->except(['course_id', 'term_id', 'parallel', 'academic_status']))
            ->map(fn (mixed $value) => $this->nullableString($value))
            ->all();

        $student->update($payload);

        $this->syncAcademicData($student, $request->validated());

        $this->audit->record('students.update', 'students', ['student_id' => $student->id]);

        return $this->success($student->load('enrollments.course:id,name'), 'Student updated.');
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
     */
    protected function syncAcademicData(Student $student, array $data): void
    {
        $termId = $this->nullableInt(data_get($data, 'term_id'));
        $status = data_get($data, 'academic_status');

        if ($termId !== null) {
            $current = $student->enrollments()->where('term_id', $termId)->first();

            Enrollment::query()->updateOrCreate(
                ['student_id' => $student->id, 'term_id' => $termId],
                [
                    'course_id' => $this->nullableInt(data_get($data, 'course_id')) ?? $current?->course_id,
                    'parallel' => $this->nullableString(data_get($data, 'parallel')),
                    'status' => match ($status) {
                        'graduated', 'retired' => $status === 'graduated' ? 'completed' : 'retired',
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

    /**
     * Deactivates a student.
     */
    public function destroy(Request $request, Student $student): JsonResponse
    {
        $student->update(['is_active' => false]);

        $this->audit->record('students.deactivate', 'students', ['student_id' => $student->id]);

        return $this->success(message: 'Student deactivated.');
    }

    /**
     * Bulk imports students from a CSV file.
     */
    public function import(ImportStudentsRequest $request): JsonResponse
    {
        $stream = fopen($request->file('file')->getRealPath(), 'r');

        $result = $this->studentImport->import(
            separator: $request->string('separator')->toString(),
            stream: $stream,
            courseId: $request->filled('course_id') ? $request->integer('course_id') : null,
            termId: $request->filled('term_id') ? $request->integer('term_id') : null,
        );

        fclose($stream);

        $this->audit->record('students.import', 'students', $result);

        return $this->success($result, 'Import finished.');
    }

    /**
     * Downloads the filtered students as CSV or XLSX.
     */
    public function export(Request $request): StreamedResponse
    {
        $students = $this->studentsQuery($request)
            ->with('enrollments.course:id,name')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        $format = $request->string('format')->toString() === 'xlsx' ? 'xlsx' : 'csv';

        $this->audit->record('students.export', 'students', ['format' => $format, 'rows' => $students->count()]);

        return $format === 'xlsx' ? $this->exportXlsx($students) : $this->exportCsv($students);
    }

    /**
     * Streams a UTF-8 CSV (with BOM) of the given students.
     */
    protected function exportCsv(Collection $students): StreamedResponse
    {
        return response()->streamDownload(function () use ($students) {
            $stream = fopen('php://output', 'w');

            fwrite($stream, "\xEF\xBB\xBF");
            fputcsv($stream, $this->exportColumns(), ';');

            foreach ($students as $student) {
                fputcsv($stream, array_values($this->exportRow($student)), ';');
            }

            fclose($stream);
        }, 'estudiantes_'.date('Ymd_His').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /**
     * Streams an XLSX workbook of the given students.
     */
    protected function exportXlsx(Collection $students): StreamedResponse
    {
        return response()->streamDownload(function () use ($students) {
            $spreadsheet = new Spreadsheet;
            $sheet = $spreadsheet->getActiveSheet();

            $sheet->fromArray($this->exportColumns(), null, 'A1');

            $row = 2;

            foreach ($students as $student) {
                $sheet->fromArray(array_values($this->exportRow($student)), null, "A{$row}");
                $row++;
            }

            foreach (range('A', 'F') as $columnLabel) {
                $sheet->getColumnDimension($columnLabel)->setAutoSize(true);
            }

            $writer = new XlsxWriter($spreadsheet);
            $writer->save('php://output');
        }, 'estudiantes_'.date('Ymd_His').'.xlsx', ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
    }

    /**
     * Column labels of the exported files.
     *
     * @return array<int, string>
     */
    protected function exportColumns(): array
    {
        return ['document_number', 'first_name', 'last_name', 'birth_date', 'grade', 'is_active'];
    }

    /**
     * Flattened values of a student row for the exported files.
     *
     * @return array{document_number: mixed, first_name: mixed, last_name: mixed, birth_date: mixed, grade: mixed, is_active: mixed}
     */
    protected function exportRow(Student $student): array
    {
        return [
            'document_number' => $student->document_number,
            'first_name' => $student->first_name,
            'last_name' => $student->last_name,
            'birth_date' => $student->birth_date?->format('Y-m-d'),
            'grade' => $student->enrollments->first()?->course?->name,
            'is_active' => $student->is_active ? '1' : '0',
        ];
    }
}
