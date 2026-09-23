<?php

namespace App\Modules\Psychopedagogic\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\Administration\Services\AuditService;
use App\Modules\Psychopedagogic\Http\Requests\StoreActivityRequest;
use App\Modules\Psychopedagogic\Http\Requests\UpdateActivityRequest;
use App\Modules\Psychopedagogic\Models\Activity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CRUD of the intervention activity catalogue.
 */
class ActivityController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    /**
     * Paginated list of activities with category filter.
     */
    public function index(Request $request): JsonResponse
    {
        $activities = Activity::query()
            ->when($request->filled('category'), fn ($query) => $query->where('category', $request->string('category')->toString()))
            ->when($request->filled('difficulty_level'), fn ($query) => $query->where('difficulty_level', $request->string('difficulty_level')->toString()))
            ->when($request->filled('is_active'), fn ($query) => $query->where('is_active', $request->boolean('is_active')))
            ->orderBy('title')
            ->paginate($request->integer('per_page', 15));

        return $this->success($activities);
    }

    /**
     * Creates an activity.
     */
    public function store(StoreActivityRequest $request): JsonResponse
    {
        $activity = Activity::query()->create($request->validated());

        $this->audit->record('activities.create', 'psychopedagogic', ['activity_id' => $activity->id]);

        return $this->success($activity, 'Activity created.', 201);
    }

    /**
     * Returns an activity.
     */
    public function show(Activity $activity): JsonResponse
    {
        return $this->success($activity);
    }

    /**
     * Updates an activity.
     */
    public function update(UpdateActivityRequest $request, Activity $activity): JsonResponse
    {
        $activity->update($request->validated());

        $this->audit->record('activities.update', 'psychopedagogic', ['activity_id' => $activity->id]);

        return $this->success($activity, 'Activity updated.');
    }

    /**
     * Deletes an activity.
     */
    public function destroy(Activity $activity): JsonResponse
    {
        $activity->delete();

        $this->audit->record('activities.delete', 'psychopedagogic', ['activity_id' => $activity->id]);

        return $this->success(message: 'Activity deleted.');
    }
}
