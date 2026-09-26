<?php

namespace App\Modules\System\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\Administration\Services\AuditService;
use App\Modules\System\Http\Requests\StoreUserRequest;
use App\Modules\System\Http\Requests\UpdateUserRequest;
use App\Modules\System\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CRUD of platform users (admin registered only).
 */
class UserController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    /**
     * Paginated list of users with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $users = $this->paginateQuery(
            $request,
            User::query()
                ->with('roles:id,name,slug')
                ->when($request->string('search')->toString(), fn ($query, $search) => $query
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%"))
                ->when($request->filled('is_active'), fn ($query) => $query->where('is_active', $request->boolean('is_active')))
                ->orderByDesc('id')
        );

        return $this->success($users);
    }

    /**
     * Creates a user and assigns the requested roles.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $request->safe()->except(['roles', 'password_confirmation']);

        $user = User::query()->create($data);
        $user->roles()->sync($request->input('roles'));

        $this->audit->record('users.create', 'system', ['user_id' => $user->id]);

        return $this->success($user->load('roles:id,name,slug'), 'User created.', 201);
    }

    /**
     * Returns a single user with role and permission context.
     */
    public function show(User $user): JsonResponse
    {
        $user->load('roles:id,name,slug');
        $user->setAttribute('permissions', $user->grantedPermissions());

        return $this->success($user);
    }

    /**
     * Updates the user and its role assignments.
     */
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $data = $request->safe()->except(['roles', 'password_confirmation']);

        $user->update($data);

        if ($request->filled('roles')) {
            $user->roles()->sync($request->input('roles'));
            $user->refresh();
        }

        $this->audit->record('users.update', 'system', ['user_id' => $user->id]);

        return $this->success($user->load('roles:id,name,slug'), 'User updated.');
    }

    /**
     * Deactivates a user (soft alternative to delete).
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()?->id) {
            return $this->error('You cannot deactivate your own account.', 422);
        }

        $user->update(['is_active' => false]);

        $this->audit->record('users.deactivate', 'system', ['user_id' => $user->id]);

        return $this->success(message: 'User deactivated.');
    }
}
