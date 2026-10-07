<?php

use Illuminate\Support\Facades\Route;

/**
 * API entrypoint (EduSense).
 *
 * Each application module (app/Modules/<module>) exposes its own route file
 * at Routes/api.php, and every nested submodule (app/Modules/<module>/
 * Submodules/<submodule>) may do the same. The files below are automatically
 * discovered and mounted under the `/api/v1` prefix so new modules can be
 * added without touching this file.
 *
 * @author Fanny Mayorga
 *
 * @date   20-09-2026
 */
Route::prefix('v1')->group(function () {
    $patterns = [
        app_path('Modules/*/Routes/api.php'),
        app_path('Modules/*/Submodules/*/Routes/api.php'),
    ];

    $routeFiles = [];

    foreach ($patterns as $pattern) {
        foreach (glob($pattern) ?: [] as $moduleRoutes) {
            $routeFiles[] = $moduleRoutes;
        }
    }

    // Stable order keeps the generated route list deterministic.
    sort($routeFiles);

    foreach ($routeFiles as $moduleRoutes) {
        require $moduleRoutes;
    }
});
