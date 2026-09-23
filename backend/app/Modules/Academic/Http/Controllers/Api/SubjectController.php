<?php

namespace App\Modules\Academic\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\Academic\Http\Requests\StoreSubjectRequest;
use App\Modules\Academic\Http\Requests\UpdateSubjectRequest;
use App\Modules\Academic\Models\Subject;
use App\Modules\Administration\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CRUD of subjects within a course.
 */
class SubjectController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    /**
     * Paginated list of subjects (optionally filtered by course).
     */
    public function index(Request $request): JsonResponse
    {
        $subjects = Subject::query()
            ->with('course:id,name')
            ->when($request->filled('course_id'), fn ($query) => $query->where('course_id', $request->integer('course_id')))
            ->when($request->string('search')->toString(), fn ($query, $search) => $query
                ->where('name', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%"))
            ->orderBy('name')
            ->paginate($request->integer('per_page', 15));

        return $this->success($subjects);
    }

    /**
     * Creates a subject.
     */
    public function store(StoreSubjectRequest $request): JsonResponse
    {
        $data = $request->validated();

        $exists = Subject::query()->where('course_id', $data['course_id'])->where('code', $data['code'])->exists();

        if ($exists) {
            return $this->error('The code already exists for that course.', 422);
        }

        $subject = Subject::query()->create($data);

        $this->audit->record('subjects.create', 'academic', ['subject_id' => $subject->id]);

        return $this->success($subject, 'Subject created.', 201);
    }

    /**
     * Returns a subject.
     */
    public function show(Subject $subject): JsonResponse
    {
        return $this->success($subject->load('course:id,name'));
    }

    /**
     * Updates a subject.
     */
    public function update(UpdateSubjectRequest $request, Subject $subject): JsonResponse
    {
        $subject->update($request->validated());

        $this->audit->record('subjects.update', 'academic', ['subject_id' => $subject->id]);

        return $this->success($subject, 'Subject updated.');
    }

    /**
     * Deletes a subject.
     */
    public function destroy(Subject $subject): JsonResponse
    {
        $subject->delete();

        $this->audit->record('subjects.delete', 'academic', ['subject_id' => $subject->id]);

        return $this->success(message: 'Subject deleted.');
    }
}
