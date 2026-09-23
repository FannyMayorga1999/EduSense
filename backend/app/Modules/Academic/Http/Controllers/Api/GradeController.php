<?php

namespace App\Modules\Academic\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\Academic\Http\Requests\ImportGradesRequest;
use App\Modules\Academic\Http\Requests\StoreGradeRequest;
use App\Modules\Academic\Http\Requests\UpdateGradeRequest;
use App\Modules\Academic\Models\Grade;
use App\Modules\Academic\Services\GradeImportService;
use App\Modules\Administration\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Grade registry and CSV bulk import (Academic module).
 */
class GradeController extends Controller
{
    public function __construct(
        private readonly GradeImportService $importService,
        private readonly AuditService $audit,
    ) {}

    /**
     * Paginated grades with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $grades = Grade::query()
            ->with(['student:id,first_name,last_name', 'subject:id,name,code', 'term:id,name'])
            ->when($request->filled('term_id'), fn ($query) => $query->where('term_id', $request->integer('term_id')))
            ->when($request->filled('subject_id'), fn ($query) => $query->where('subject_id', $request->integer('subject_id')))
            ->when($request->filled('student_id'), fn ($query) => $query->where('student_id', $request->integer('student_id')))
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 25));

        return $this->success($grades);
    }

    /**
     * Records a grade (upsert by unique student/subject/term).
     */
    public function store(StoreGradeRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()->id;

        $grade = Grade::query()->updateOrCreate(
            [
                'student_id' => $data['student_id'],
                'subject_id' => $data['subject_id'],
                'term_id' => $data['term_id'],
            ],
            $data,
        );

        $this->audit->record('grades.create', 'academic', ['grade_id' => $grade->id]);

        return $this->success($grade, $grade->wasRecentlyCreated ? 'Grade recorded.' : 'Grade updated.', $grade->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * Returns a grade.
     */
    public function show(Grade $grade): JsonResponse
    {
        return $this->success($grade->load(['student:id,first_name,last_name', 'subject:id,name,code', 'term:id,name']));
    }

    /**
     * Updates a grade.
     */
    public function update(UpdateGradeRequest $request, Grade $grade): JsonResponse
    {
        $grade->update($request->validated());

        $this->audit->record('grades.update', 'academic', ['grade_id' => $grade->id]);

        return $this->success($grade, 'Grade updated.');
    }

    /**
     * Deletes a grade.
     */
    public function destroy(Grade $grade): JsonResponse
    {
        $grade->delete();

        $this->audit->record('grades.delete', 'academic', ['grade_id' => $grade->id]);

        return $this->success(message: 'Grade deleted.');
    }

    /**
     * Bulk imports grades from a CSV matrix.
     */
    public function import(ImportGradesRequest $request): JsonResponse
    {
        $stream = fopen($request->file('file')->getRealPath(), 'r');

        $result = $this->importService->import($request->string('separator')->toString(), $request->integer('term_id'), $stream);

        fclose($stream);

        $this->audit->record('grades.import', 'academic', $result);

        return $this->success($result, 'Import finished.');
    }

    /**
     * Average score per subject for the selected term (academic report).
     */
    public function averages(Request $request): JsonResponse
    {
        $rows = Grade::query()
            ->selectRaw('subjects.name as subject, subjects.id as subject_id, AVG(grades.score) as average')
            ->join('aca_subjects as subjects', 'subjects.id', '=', 'aca_grades.subject_id')
            ->when($request->filled('term_id'), fn ($query) => $query->where('aca_grades.term_id', $request->integer('term_id')))
            ->groupBy('subjects.id', 'subjects.name')
            ->orderBy('subjects.name')
            ->get();

        return $this->success($rows);
    }
}
