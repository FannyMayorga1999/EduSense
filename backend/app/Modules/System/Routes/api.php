<?php

use App\Modules\System\Http\Controllers\Api\AuthController;
use App\Modules\System\Http\Controllers\Api\PermissionController;
use App\Modules\System\Http\Controllers\Api\RoleController;
use App\Modules\System\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| System module routes (v1)
|--------------------------------------------------------------------------
*/

Route::post('login', [AuthController::class, 'login'])
    ->middleware(['throttle:5,1', 'guest'])
    ->name('system.login');

Route::get('csrf-cookie', fn () => response()->json(['success' => true, 'message' => 'CSRF cookie ready.', 'data' => null]))
    ->middleware('web')
    ->name('system.csrf');

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::post('logout', [AuthController::class, 'logout'])->name('system.logout');
    Route::get('me', [AuthController::class, 'me'])->name('system.me');

    Route::get('permissions', [PermissionController::class, 'index'])
        ->middleware('permission:manage_roles|view_users')
        ->name('system.permissions.index');

    Route::get('users', [UserController::class, 'index'])->middleware('permission:view_users')->name('system.users.index');
    Route::post('users', [UserController::class, 'store'])->middleware('permission:create_users')->name('system.users.store');
    Route::get('users/{user}', [UserController::class, 'show'])->middleware('permission:view_users')->name('system.users.show');
    Route::put('users/{user}', [UserController::class, 'update'])->middleware('permission:edit_users')->name('system.users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->middleware('permission:delete_users')->name('system.users.destroy');

    Route::get('roles', [RoleController::class, 'index'])->middleware('permission:manage_roles')->name('system.roles.index');
    Route::post('roles', [RoleController::class, 'store'])->middleware('permission:manage_roles')->name('system.roles.store');
    Route::get('roles/{role}', [RoleController::class, 'show'])->middleware('permission:manage_roles')->name('system.roles.show');
    Route::put('roles/{role}', [RoleController::class, 'update'])->middleware('permission:manage_roles')->name('system.roles.update');
    Route::delete('roles/{role}', [RoleController::class, 'destroy'])->middleware('permission:manage_roles')->name('system.roles.destroy');
});
