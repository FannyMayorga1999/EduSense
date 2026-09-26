<?php

namespace App\Modules\System\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\Administration\Services\AuditService;
use App\Modules\System\Http\Requests\StoreRoleRequest;
use App\Modules\System\Http\Requests\UpdateRoleRequest;
use App\Modules\System\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CRUD of RBAC roles.
 */
class RoleController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    /**
     * Paginated list of roles.
     */
    public function index(Request $request): JsonResponse
    {
        $roles = $this->paginateQuery(
            $request,
            Role::query()
                ->withCount('users')
                ->when($request->string('search')->toString(), fn ($query, $search) => $query
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%"))
        );

        return $this->success($roles);
    }

    /**
     * Creates a role and attaches the permissions.
     */
    public function store(StoreRoleRequest $request): JsonResponse
    {
        $role = Role::query()->create($request->safe()->only(['name', 'slug', 'description']));
        $role->permissions()->sync($request->input('permissions'));

        $this->audit->record('roles.create', 'system', ['role_id' => $role->id]);

        return $this->success($role->load('permissions:id,name,slug,module'), 'Role created.', 201);
    }

    /**
     * Returns a role with its permissions.
     */
    public function show(Role $role): JsonResponse
    {
        return $this->success($role->load('permissions:id,name,slug,module'));
    }

    /**
     * Updates a role and its permissions.
     */
    public function update(UpdateRoleRequest $request, Role $role): JsonResponse
    {
        $role->update($request->safe()->only(['name', 'slug', 'description']));

        if ($request->filled('permissions')) {
            $role->permissions()->sync($request->input('permissions'));
            $role->refresh();
        }

        $this->audit->record('roles.update', 'system', ['role_id' => $role->id]);

        return $this->success($role->load('permissions:id,name,slug,module'), 'Role updated.');
    }

    /**
     * Deletes a role.
     */
    public function destroy(Role $role): JsonResponse
    {
        if ($role->slug === 'administrator') {
            return $this->error('The administrator role cannot be deleted.', 422);
        }

        $role->permissions()->detach();
        $role->users()->detach();
        $role->delete();

        $this->audit->record('roles.delete', 'system', ['role_id' => $role->id]);

        return $this->success(message: 'Role deleted.');
    }
}
