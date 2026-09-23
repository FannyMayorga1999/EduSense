<?php

use Illuminate\Support\Facades\Route;

/**
 * API entrypoint (EduSense).
 *
 * Each application module (app/Modules/*) exposes its own route file at
 * Routes/api.php. The routes below are automatically discovered and mounted
 * under the `/api/v1` prefix so new modules can be added without touching
 * this file.
 *
 * @author Fanny Mayorga
 *
 * @date   20-09-2026
 */
Route::prefix('v1')->group(function () {
    foreach (glob(app_path('Modules/*/Routes/api.php')) ?: [] as $moduleRoutes) {
        require $moduleRoutes;
    }
});
