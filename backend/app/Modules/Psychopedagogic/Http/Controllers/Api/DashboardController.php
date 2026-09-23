<?php

namespace App\Modules\Psychopedagogic\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\Psychopedagogic\Services\PsychopedagogicEvaluationService;
use Illuminate\Http\JsonResponse;

/**
 * Role-aware KPI summary for the dashboard.
 */
class DashboardController extends Controller
{
    public function __construct(private readonly PsychopedagogicEvaluationService $service) {}

    /**
     * Returns the psychopedagogic KPIs for the logged-in user.
     */
    public function summary(): JsonResponse
    {
        return $this->success($this->service->dashboardSummary());
    }
}
