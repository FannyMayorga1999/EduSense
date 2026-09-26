<?php

namespace App\Modules\Psychopedagogic\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\Administration\Services\AuditService;
use App\Modules\Psychopedagogic\Http\Requests\StorePlanRequest;
use App\Modules\Psychopedagogic\Models\CurricularAdaptationPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CRUD of the curricular adaptation plans (PAC).
 */
class CurricularAdaptationPlanController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    /**
     * Paginated list of plans.
     */
    public function index(Request $request): JsonResponse
    {
        $plans = $this->paginateQuery(
            $request,
            CurricularAdaptationPlan::query()
                ->with(['student:id,first_name,last_name', 'creator:id,name'])
                ->when($request->filled('student_id'), fn ($query) => $query->where('student_id', $request->integer('student_id')))
                ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
                ->orderByDesc('start_date')
        );

        return $this->success($plans);
    }

    /**
     * Creates a plan.
     */
    public function store(StorePlanRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()->id;
        $data['status'] ??= 'active';

        $plan = CurricularAdaptationPlan::query()->create($data);

        $this->audit->record('plans.create', 'psychopedagogic', ['plan_id' => $plan->id]);

        return $this->success($plan, 'Plan created.', 201);
    }

    /**
     * Returns a plan.
     */
    public function show(CurricularAdaptationPlan $plan): JsonResponse
    {
        return $this->success($plan->load(['student:id,first_name,last_name', 'creator:id,name']));
    }

    /**
     * Updates a plan.
     */
    public function update(StorePlanRequest $request, CurricularAdaptationPlan $plan): JsonResponse
    {
        $plan->update($request->safe()->except(['student_id', 'created_by']));

        $this->audit->record('plans.update', 'psychopedagogic', ['plan_id' => $plan->id]);

        return $this->success($plan, 'Plan updated.');
    }

    /**
     * Deletes a plan.
     */
    public function destroy(CurricularAdaptationPlan $plan): JsonResponse
    {
        $plan->delete();

        $this->audit->record('plans.delete', 'psychopedagogic', ['plan_id' => $plan->id]);

        return $this->success(message: 'Plan deleted.');
    }
}
