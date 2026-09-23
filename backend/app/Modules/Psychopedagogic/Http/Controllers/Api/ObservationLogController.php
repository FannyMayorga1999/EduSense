<?php

namespace App\Modules\Psychopedagogic\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\Administration\Services\AuditService;
use App\Modules\Psychopedagogic\Http\Requests\StoreObservationLogRequest;
use App\Modules\Psychopedagogic\Models\ObservationLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CRUD of the observation history entries (bitácora).
 */
class ObservationLogController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    /**
     * Paginated list of observations.
     */
    public function index(Request $request): JsonResponse
    {
        $logs = ObservationLog::query()
            ->with(['student:id,first_name,last_name', 'observer:id,name'])
            ->when($request->filled('student_id'), fn ($query) => $query->where('student_id', $request->integer('student_id')))
            ->when($request->filled('from'), fn ($query) => $query->whereDate('observed_at', '>=', $request->string('from')->toString()))
            ->orderByDesc('observed_at')
            ->paginate($request->integer('per_page', 25));

        return $this->success($logs);
    }

    /**
     * Creates an observation.
     */
    public function store(StoreObservationLogRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['observed_by'] = $request->user()->id;
        $data['observed_at'] ??= now()->toDateString();

        $log = ObservationLog::query()->create($data);

        $this->audit->record('observation_logs.create', 'psychopedagogic', ['log_id' => $log->id]);

        return $this->success($log, 'Observation recorded.', 201);
    }

    /**
     * Returns an observation.
     */
    public function show(ObservationLog $observationLog): JsonResponse
    {
        return $this->success($observationLog->load(['student:id,first_name,last_name', 'observer:id,name']));
    }

    /**
     * Updates an observation.
     */
    public function update(StoreObservationLogRequest $request, ObservationLog $observationLog): JsonResponse
    {
        $observationLog->update($request->safe()->except(['student_id', 'observed_by']));

        $this->audit->record('observation_logs.update', 'psychopedagogic', ['log_id' => $observationLog->id]);

        return $this->success($observationLog, 'Observation updated.');
    }

    /**
     * Deletes an observation.
     */
    public function destroy(ObservationLog $observationLog): JsonResponse
    {
        $observationLog->delete();

        $this->audit->record('observation_logs.delete', 'psychopedagogic', ['log_id' => $observationLog->id]);

        return $this->success(message: 'Observation deleted.');
    }
}
