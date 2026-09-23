<?php

namespace App\Modules\Academic\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\Academic\Http\Requests\StoreCourseRequest;
use App\Modules\Academic\Http\Requests\UpdateCourseRequest;
use App\Modules\Academic\Models\Course;
use App\Modules\Administration\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CRUD of courses (Academic module).
 */
class CourseController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    /**
     * Paginated list of courses.
     */
    public function index(Request $request): JsonResponse
    {
        $courses = Course::query()
            ->withCount('subjects')
            ->when($request->string('search')->toString(), fn ($query, $search) => $query
                ->where('name', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%"))
            ->when($request->filled('is_active'), fn ($query) => $query->where('is_active', $request->boolean('is_active')))
            ->orderBy('name')
            ->paginate($request->integer('per_page', 15));

        return $this->success($courses);
    }

    /**
     * Creates a course.
     */
    public function store(StoreCourseRequest $request): JsonResponse
    {
        $course = Course::query()->create($request->validated());

        $this->audit->record('courses.create', 'academic', ['course_id' => $course->id]);

        return $this->success($course, 'Course created.', 201);
    }

    /**
     * Returns a course with its subjects.
     */
    public function show(Course $course): JsonResponse
    {
        return $this->success($course->load('subjects'));
    }

    /**
     * Updates a course.
     */
    public function update(UpdateCourseRequest $request, Course $course): JsonResponse
    {
        $course->update($request->validated());

        $this->audit->record('courses.update', 'academic', ['course_id' => $course->id]);

        return $this->success($course, 'Course updated.');
    }

    /**
     * Deletes a course (guarded while it has subjects).
     */
    public function destroy(Course $course): JsonResponse
    {
        if ($course->subjects()->exists()) {
            return $this->error('Cannot delete a course that still has subjects.', 422);
        }

        $course->delete();

        $this->audit->record('courses.delete', 'academic', ['course_id' => $course->id]);

        return $this->success(message: 'Course deleted.');
    }
}
