<?php

use App\Modules\Administration\Http\Controllers\Api\AuditLogController;
use App\Modules\Administration\Http\Controllers\Api\ModuleController;
use App\Modules\Administration\Http\Controllers\Api\SettingController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Administration module routes (v1)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::get('modules', [ModuleController::class, 'index'])->middleware('permission:view_modules')->name('admin.modules.index');

    Route::get('audit-logs', [AuditLogController::class, 'index'])->middleware('permission:view_audit_logs')->name('admin.audit-logs.index');
    Route::get('audit-logs/{auditLog}', [AuditLogController::class, 'show'])->middleware('permission:view_audit_logs')->name('admin.audit-logs.show');

    Route::get('settings', [SettingController::class, 'index'])->middleware('permission:manage_settings')->name('admin.settings.index');
    Route::put('settings/{key}', [SettingController::class, 'update'])->middleware('permission:manage_settings')->name('admin.settings.update');
});
