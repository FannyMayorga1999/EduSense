<?php

use App\Modules\Students\Http\Controllers\Api\StudentController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Students module routes (v1)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::get('students', [StudentController::class, 'index'])->middleware('permission:view_students')->name('students.index');
    Route::post('students', [StudentController::class, 'store'])->middleware('permission:create_students')->name('students.store');
    Route::get('students/export', [StudentController::class, 'export'])->middleware('permission:export_students')->name('students.export');
    Route::post('students/import', [StudentController::class, 'import'])->middleware('permission:import_students')->name('students.import');
    Route::get('students/{student}', [StudentController::class, 'show'])->middleware('permission:view_students')->name('students.show');
    Route::put('students/{student}', [StudentController::class, 'update'])->middleware('permission:edit_students')->name('students.update');
    Route::delete('students/{student}', [StudentController::class, 'destroy'])->middleware('permission:delete_students')->name('students.destroy');
});
