<?php

namespace App\Modules\Psychopedagogic\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\Administration\Services\AuditService;
use App\Modules\Psychopedagogic\Http\Requests\StoreScheduleRequest;
use App\Modules\Psychopedagogic\Http\Requests\UpdateScheduleRequest;
use App\Modules\Psychopedagogic\Models\InterventionSchedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CRUD of the intervention schedule sessions.
 */
class ScheduleController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    /**
     * Paginated list of sessions (today filter included).
     */
    public function index(Request $request): JsonResponse
    {
        $schedules = InterventionSchedule::query()
            ->with(['student:id,first_name,last_name', 'activity:id,title,duration_minutes', 'subject:id,name'])
            ->when($request->boolean('today'), fn ($query) => $query->whereDate('scheduled_date', now()->toDateString()))
            ->when($request->filled('from'), fn ($query) => $query->whereDate('scheduled_date', '>=', $request->string('from')->toString()))
            ->when($request->filled('to'), fn ($query) => $query->whereDate('scheduled_date', '<=', $request->string('to')->toString()))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->when($request->filled('student_id'), fn ($query) => $query->where('student_id', $request->integer('student_id')))
            ->orderBy('scheduled_date')
            ->paginate($request->integer('per_page', 15));

        return $this->success($schedules);
    }

    /**
     * Schedules a session.
     */
    public function store(StoreScheduleRequest $request): JsonResponse
    {
        $schedule = InterventionSchedule::query()->create($request->validated());

        $this->audit->record('schedules.create', 'psychopedagogic', ['schedule_id' => $schedule->id]);

        return $this->success($schedule->load(['student:id,first_name,last_name', 'activity:id,title']), 'Session scheduled.', 201);
    }

    /**
     * Returns a session.
     */
    public function show(InterventionSchedule $schedule): JsonResponse
    {
        return $this->success($schedule->load(['student:id,first_name,last_name', 'activity:id,title', 'subject:id,name']));
    }

    /**
     * Updates a session (status or rescheduling).
     */
    public function update(UpdateScheduleRequest $request, InterventionSchedule $schedule): JsonResponse
    {
        $schedule->update($request->validated());

        $this->audit->record('schedules.update', 'psychopedagogic', ['schedule_id' => $schedule->id]);

        return $this->success($schedule, 'Session updated.');
    }

    /**
     * Deletes a session.
     */
    public function destroy(InterventionSchedule $schedule): JsonResponse
    {
        $schedule->delete();

        $this->audit->record('schedules.delete', 'psychopedagogic', ['schedule_id' => $schedule->id]);

        return $this->success(message: 'Session deleted.');
    }
}
