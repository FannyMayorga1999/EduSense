<?php

namespace App\Modules\System\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\Administration\Services\AuditService;
use App\Modules\System\Http\Requests\LoginRequest;
use App\Modules\System\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Session-based (Sanctum SPA) authentication endpoints.
 */
class AuthController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    /**
     * Authenticates the user through a sanctum cookie session.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only('email', 'password');

        if (! Auth::attempt($credentials, (bool) $request->boolean('remember'))) {
            $this->audit->loginFailed($request->string('email')->toString(), $request->ip());

            return $this->error('Invalid credentials.', 401);
        }

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        $user = $request->user();

        $user->forceFill([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ])->save();

        $this->audit->record('auth.login', 'system');

        return $this->success($this->payload($user), 'Authenticated.');
    }

    /**
     * Returns the authenticated user with the granted permissions.
     */
    public function me(Request $request): JsonResponse
    {
        return $this->success($this->payload($request->user()));
    }

    /**
     * Destroys the sanctum cookie session.
     */
    public function logout(Request $request): JsonResponse
    {
        $this->audit->record('auth.logout', 'system');

        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return $this->success(message: 'Logged out.');
    }

    /**
     * User payload consumed by the frontend security context.
     *
     * @return array<string, mixed>
     */
    protected function payload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'roles' => $user->roles()->pluck('slug')->toArray(),
            'permissions' => $user->grantedPermissions()->pluck('slug')->toArray(),
        ];
    }
}
