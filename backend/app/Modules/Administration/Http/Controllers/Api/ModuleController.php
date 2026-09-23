<?php

namespace App\Modules\Administration\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\Administration\Models\Module;
use Illuminate\Http\JsonResponse;

/**
 * Active module registry (drives the frontend menu and permissions areas).
 */
class ModuleController extends Controller
{
    /**
     * Lists the active modules visible in the sidebar.
     */
    public function index(): JsonResponse
    {
        $modules = Module::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['slug', 'name', 'prefix', 'version']);

        return $this->success($modules);
    }
}
