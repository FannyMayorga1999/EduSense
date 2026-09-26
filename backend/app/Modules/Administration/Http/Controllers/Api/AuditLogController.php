<?php

namespace App\Modules\Administration\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\Administration\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Read-mostly audit trail browsing.
 */
class AuditLogController extends Controller
{
    /**
     * Paginated audit trail with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $logs = $this->paginateQuery(
            $request,
            AuditLog::query()
                ->with('user:id,name,email')
                ->when($request->string('action')->toString(), fn ($query, $action) => $query->where('action', 'like', "%{$action}%"))
                ->when($request->string('module')->toString(), fn ($query, $module) => $query->where('module', $module))
                ->when($request->filled('user_id'), fn ($query) => $query->where('user_id', $request->integer('user_id')))
                ->orderByDesc('created_at'),
            25
        );

        return $this->success($logs);
    }

    /**
     * Returns one audit entry (plus its stored context).
     */
    public function show(AuditLog $auditLog): JsonResponse
    {
        return $this->success($auditLog->load('user:id,name,email'));
    }
}
