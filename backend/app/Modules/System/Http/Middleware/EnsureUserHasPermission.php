<?php

namespace App\Modules\System\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Server-side authorization guard (deny by default).
 *
 * Usage on a route:
 *     ->middleware('permission:view_students')
 *     ->middleware('permission:view_students|create_students')  // any
 *
 * The administrator role bypasses the check (super user).
 */
class EnsureUserHasPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if ($user === null) {
            abort(401);
        }

        if ($user->isAdministrator()) {
            return $next($request);
        }

        $allowed = $user->hasAnyPermission($permissions);

        if (! $allowed) {
            abort(403, 'You do not have permission to perform this action.');
        }

        return $next($request);
    }
}
