<?php

namespace App\Modules\Administration\Services;

use App\Modules\Administration\Models\AuditLog;
use App\Modules\System\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Records security and resource audit events (Administration module).
 */
class AuditService
{
    /**
     * Persists an audit log entry.
     *
     * @param  array<string, mixed>|null  $context
     */
    public function record(string $action, ?string $module = null, ?array $context = null, ?User $user = null, ?Request $request = null): void
    {
        $user ??= Auth::user() !== null ? Auth::user() : null;
        $request ??= request();

        AuditLog::query()->create([
            'user_id' => $user?->id,
            'action' => $action,
            'module' => $module,
            'context' => $context !== null ? json_encode($context) : null,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }

    /**
     * Records a failed authentication attempt.
     */
    public function loginFailed(?string $email, ?string $ip = null): void
    {
        AuditLog::query()->create([
            'user_id' => null,
            'action' => 'auth.login.failed',
            'module' => 'system',
            'context' => json_encode(['email' => $email]),
            'ip_address' => $ip,
            'user_agent' => request()->userAgent(),
        ]);
    }
}
