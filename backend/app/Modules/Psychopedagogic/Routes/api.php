<?php

use App\Modules\Psychopedagogic\Http\Controllers\Api\ActivityController;
use App\Modules\Psychopedagogic\Http\Controllers\Api\CurricularAdaptationPlanController;
use App\Modules\Psychopedagogic\Http\Controllers\Api\DashboardController;
use App\Modules\Psychopedagogic\Http\Controllers\Api\DiagnosticController;
use App\Modules\Psychopedagogic\Http\Controllers\Api\EvaluationController;
use App\Modules\Psychopedagogic\Http\Controllers\Api\NeeCategoryController;
use App\Modules\Psychopedagogic\Http\Controllers\Api\ObservationLogController;
use App\Modules\Psychopedagogic\Http\Controllers\Api\PsychopedagogicRecordController;
use App\Modules\Psychopedagogic\Http\Controllers\Api\ScheduleController;
use App\Modules\Psychopedagogic\Http\Controllers\Api\SurveyController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Psychopedagogic module routes (v1)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'active'])->get('dashboard/summary', [DashboardController::class, 'summary'])
    ->middleware('permission:view_dashboard')
    ->name('dashboard.summary');

Route::middleware(['auth:sanctum', 'active'])->prefix('psychopedagogic')->group(function () {
    Route::get('dashboard', [DashboardController::class, 'summary'])->middleware('permission:view_dashboard')->name('psychopedagogic.dashboard');

    Route::get('surveys', [SurveyController::class, 'index'])->middleware('permission:view_surveys')->name('psychopedagogic.surveys.index');
    Route::post('surveys', [SurveyController::class, 'store'])->middleware('permission:create_surveys')->name('psychopedagogic.surveys.store');
    Route::get('surveys/{survey}', [SurveyController::class, 'show'])->middleware('permission:view_surveys')->name('psychopedagogic.surveys.show');
    Route::put('surveys/{survey}', [SurveyController::class, 'update'])->middleware('permission:edit_surveys')->name('psychopedagogic.surveys.update');
    Route::delete('surveys/{survey}', [SurveyController::class, 'destroy'])->middleware('permission:delete_surveys')->name('psychopedagogic.surveys.destroy');

    Route::get('activities', [ActivityController::class, 'index'])->middleware('permission:view_schedules')->name('psychopedagogic.activities.index');
    Route::post('activities', [ActivityController::class, 'store'])->middleware('permission:create_schedules')->name('psychopedagogic.activities.store');
    Route::get('activities/{activity}', [ActivityController::class, 'show'])->middleware('permission:view_schedules')->name('psychopedagogic.activities.show');
    Route::put('activities/{activity}', [ActivityController::class, 'update'])->middleware('permission:edit_schedules')->name('psychopedagogic.activities.update');
    Route::delete('activities/{activity}', [ActivityController::class, 'destroy'])->middleware('permission:delete_schedules')->name('psychopedagogic.activities.destroy');

    Route::get('schedules', [ScheduleController::class, 'index'])->middleware('permission:view_schedules')->name('psychopedagogic.schedules.index');
    Route::post('schedules', [ScheduleController::class, 'store'])->middleware('permission:create_schedules')->name('psychopedagogic.schedules.store');
    Route::get('schedules/{schedule}', [ScheduleController::class, 'show'])->middleware('permission:view_schedules')->name('psychopedagogic.schedules.show');
    Route::put('schedules/{schedule}', [ScheduleController::class, 'update'])->middleware('permission:edit_schedules')->name('psychopedagogic.schedules.update');
    Route::delete('schedules/{schedule}', [ScheduleController::class, 'destroy'])->middleware('permission:delete_schedules')->name('psychopedagogic.schedules.destroy');

    Route::post('evaluations', [EvaluationController::class, 'evaluate'])->middleware('permission:evaluate_students')->name('psychopedagogic.evaluations.evaluate');
    Route::get('evaluations/{student}/summary', [EvaluationController::class, 'studentSummary'])->middleware('permission:view_results')->name('psychopedagogic.evaluations.summary');
    Route::get('evaluations/{student}/history', [EvaluationController::class, 'history'])->middleware('permission:view_results')->name('psychopedagogic.evaluations.history');

    Route::get('records', [PsychopedagogicRecordController::class, 'index'])->middleware('permission:view_records')->name('psychopedagogic.records.index');
    Route::post('records', [PsychopedagogicRecordController::class, 'store'])->middleware('permission:create_records')->name('psychopedagogic.records.store');
    Route::get('records/{record}', [PsychopedagogicRecordController::class, 'show'])->middleware('permission:view_records')->name('psychopedagogic.records.show');
    Route::put('records/{record}', [PsychopedagogicRecordController::class, 'update'])->middleware('permission:edit_records')->name('psychopedagogic.records.update');
    Route::delete('records/{record}', [PsychopedagogicRecordController::class, 'destroy'])->middleware('permission:delete_records')->name('psychopedagogic.records.destroy');

    Route::get('nee-categories', [NeeCategoryController::class, 'index'])->middleware('permission:view_diagnostics')->name('psychopedagogic.nee-categories.index');
    Route::post('nee-categories', [NeeCategoryController::class, 'store'])->middleware('permission:create_diagnostics')->name('psychopedagogic.nee-categories.store');
    Route::get('nee-categories/{category}', [NeeCategoryController::class, 'show'])->middleware('permission:view_diagnostics')->name('psychopedagogic.nee-categories.show');
    Route::put('nee-categories/{category}', [NeeCategoryController::class, 'update'])->middleware('permission:edit_diagnostics')->name('psychopedagogic.nee-categories.update');
    Route::delete('nee-categories/{category}', [NeeCategoryController::class, 'destroy'])->middleware('permission:delete_diagnostics')->name('psychopedagogic.nee-categories.destroy');

    Route::get('diagnostics', [DiagnosticController::class, 'index'])->middleware('permission:view_diagnostics')->name('psychopedagogic.diagnostics.index');
    Route::post('diagnostics', [DiagnosticController::class, 'store'])->middleware('permission:create_diagnostics')->name('psychopedagogic.diagnostics.store');
    Route::get('diagnostics/{diagnostic}', [DiagnosticController::class, 'show'])->middleware('permission:view_diagnostics')->name('psychopedagogic.diagnostics.show');
    Route::put('diagnostics/{diagnostic}', [DiagnosticController::class, 'update'])->middleware('permission:edit_diagnostics')->name('psychopedagogic.diagnostics.update');
    Route::delete('diagnostics/{diagnostic}', [DiagnosticController::class, 'destroy'])->middleware('permission:delete_diagnostics')->name('psychopedagogic.diagnostics.destroy');

    Route::get('plans', [CurricularAdaptationPlanController::class, 'index'])->middleware('permission:view_diagnostics')->name('psychopedagogic.plans.index');
    Route::post('plans', [CurricularAdaptationPlanController::class, 'store'])->middleware('permission:create_diagnostics')->name('psychopedagogic.plans.store');
    Route::get('plans/{plan}', [CurricularAdaptationPlanController::class, 'show'])->middleware('permission:view_diagnostics')->name('psychopedagogic.plans.show');
    Route::put('plans/{plan}', [CurricularAdaptationPlanController::class, 'update'])->middleware('permission:edit_diagnostics')->name('psychopedagogic.plans.update');
    Route::delete('plans/{plan}', [CurricularAdaptationPlanController::class, 'destroy'])->middleware('permission:delete_diagnostics')->name('psychopedagogic.plans.destroy');

    Route::get('observation-logs', [ObservationLogController::class, 'index'])->middleware('permission:view_records')->name('psychopedagogic.observation-logs.index');
    Route::post('observation-logs', [ObservationLogController::class, 'store'])->middleware('permission:create_records')->name('psychopedagogic.observation-logs.store');
    Route::get('observation-logs/{observationLog}', [ObservationLogController::class, 'show'])->middleware('permission:view_records')->name('psychopedagogic.observation-logs.show');
    Route::put('observation-logs/{observationLog}', [ObservationLogController::class, 'update'])->middleware('permission:edit_records')->name('psychopedagogic.observation-logs.update');
    Route::delete('observation-logs/{observationLog}', [ObservationLogController::class, 'destroy'])->middleware('permission:delete_records')->name('psychopedagogic.observation-logs.destroy');
});
