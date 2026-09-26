<?php

namespace App\Modules\Academic\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\Academic\Http\Requests\StoreEnrollmentRequest;
use App\Modules\Academic\Http\Requests\UpdateEnrollmentRequest;
use App\Modules\Academic\Models\Enrollment;
use App\Modules\Administration\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CRUD of enrollments.
 */
class EnrollmentController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    /**
     * Paginated list of enrollments for a term.
     */
    public function index(Request $request): JsonResponse
    {
        $enrollments = $this->paginateQuery(
            $request,
            Enrollment::query()
                ->with(['student:id,first_name,last_name,document_number', 'course:id,name', 'term:id,name'])
                ->when($request->filled('term_id'), fn ($query) => $query->where('term_id', $request->integer('term_id')))
                ->when($request->filled('course_id'), fn ($query) => $query->where('course_id', $request->integer('course_id')))
                ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
                ->orderByDesc('created_at')
        );

        return $this->success($enrollments);
    }

    /**
     * Enrolls a student.
     */
    public function store(StoreEnrollmentRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['enrolled_at'] ??= now()->toDateString();

        $exists = Enrollment::query()
            ->where('student_id', $data['student_id'])
            ->where('term_id', $data['term_id'])
            ->exists();

        if ($exists) {
            return $this->error('The student is already enrolled in that term.', 422);
        }

        $enrollment = Enrollment::query()->create($data);

        $this->audit->record('enrollments.create', 'academic', ['enrollment_id' => $enrollment->id]);

        return $this->success($enrollment->load(['student:id,first_name,last_name', 'course:id,name', 'term:id,name']), 'Enrollment created.', 201);
    }

    /**
     * Returns an enrollment.
     */
    public function show(Enrollment $enrollment): JsonResponse
    {
        return $this->success($enrollment->load(['student:id,first_name,last_name,document_number', 'course:id,name', 'term:id,name']));
    }

    /**
     * Updates an enrollment (e.g. retire or complete it).
     */
    public function update(UpdateEnrollmentRequest $request, Enrollment $enrollment): JsonResponse
    {
        $enrollment->update($request->validated());

        $this->audit->record('enrollments.update', 'academic', ['enrollment_id' => $enrollment->id]);

        return $this->success($enrollment, 'Enrollment updated.');
    }

    /**
     * Deletes an enrollment.
     */
    public function destroy(Enrollment $enrollment): JsonResponse
    {
        $enrollment->delete();

        $this->audit->record('enrollments.delete', 'academic', ['enrollment_id' => $enrollment->id]);

        return $this->success(message: 'Enrollment deleted.');
    }
}
