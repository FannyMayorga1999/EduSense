<?php

namespace App\Modules\System\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\System\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Read-only catalogue of the RBAC permissions grouped by module.
 */
class PermissionController extends Controller
{
    /**
     * Lists all permissions (optionally grouped by module).
     */
    public function index(Request $request): JsonResponse
    {
        $permissions = $request->boolean('grouped')
            ? Permission::query()->orderBy('module')->orderBy('name')->get()->groupBy('module')
            : $this->paginateQuery(
                $request,
                Permission::query()->orderBy('module')->orderBy('name'),
                100
            );

        return $this->success($permissions);
    }
}
