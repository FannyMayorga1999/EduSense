<?php

use App\Modules\Academic\Http\Controllers\Api\AcademicTermController;
use App\Modules\Academic\Http\Controllers\Api\AttendanceController;
use App\Modules\Academic\Http\Controllers\Api\CourseController;
use App\Modules\Academic\Http\Controllers\Api\EnrollmentController;
use App\Modules\Academic\Http\Controllers\Api\GradeController;
use App\Modules\Academic\Http\Controllers\Api\SubjectController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Academic module routes (v1)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'active'])->prefix('academic')->group(function () {
    Route::get('courses', [CourseController::class, 'index'])->middleware('permission:view_courses')->name('academic.courses.index');
    Route::post('courses', [CourseController::class, 'store'])->middleware('permission:create_courses')->name('academic.courses.store');
    Route::get('courses/{course}', [CourseController::class, 'show'])->middleware('permission:view_courses')->name('academic.courses.show');
    Route::put('courses/{course}', [CourseController::class, 'update'])->middleware('permission:edit_courses')->name('academic.courses.update');
    Route::delete('courses/{course}', [CourseController::class, 'destroy'])->middleware('permission:delete_courses')->name('academic.courses.destroy');

    Route::get('terms', [AcademicTermController::class, 'index'])->middleware('permission:view_terms')->name('academic.terms.index');
    Route::post('terms', [AcademicTermController::class, 'store'])->middleware('permission:create_terms')->name('academic.terms.store');
    Route::get('terms/{term}', [AcademicTermController::class, 'show'])->middleware('permission:view_terms')->name('academic.terms.show');
    Route::put('terms/{term}', [AcademicTermController::class, 'update'])->middleware('permission:edit_terms')->name('academic.terms.update');
    Route::delete('terms/{term}', [AcademicTermController::class, 'destroy'])->middleware('permission:delete_terms')->name('academic.terms.destroy');

    Route::get('subjects', [SubjectController::class, 'index'])->middleware('permission:view_subjects')->name('academic.subjects.index');
    Route::post('subjects', [SubjectController::class, 'store'])->middleware('permission:create_subjects')->name('academic.subjects.store');
    Route::get('subjects/{subject}', [SubjectController::class, 'show'])->middleware('permission:view_subjects')->name('academic.subjects.show');
    Route::put('subjects/{subject}', [SubjectController::class, 'update'])->middleware('permission:edit_subjects')->name('academic.subjects.update');
    Route::delete('subjects/{subject}', [SubjectController::class, 'destroy'])->middleware('permission:delete_subjects')->name('academic.subjects.destroy');

    Route::get('enrollments', [EnrollmentController::class, 'index'])->middleware('permission:view_enrollments')->name('academic.enrollments.index');
    Route::post('enrollments', [EnrollmentController::class, 'store'])->middleware('permission:manage_enrollments')->name('academic.enrollments.store');
    Route::get('enrollments/{enrollment}', [EnrollmentController::class, 'show'])->middleware('permission:view_enrollments')->name('academic.enrollments.show');
    Route::put('enrollments/{enrollment}', [EnrollmentController::class, 'update'])->middleware('permission:manage_enrollments')->name('academic.enrollments.update');
    Route::delete('enrollments/{enrollment}', [EnrollmentController::class, 'destroy'])->middleware('permission:manage_enrollments')->name('academic.enrollments.destroy');

    Route::get('attendance', [AttendanceController::class, 'index'])->middleware('permission:view_attendance')->name('academic.attendance.index');
    Route::post('attendance', [AttendanceController::class, 'store'])->middleware('permission:record_attendance')->name('academic.attendance.store');
    Route::post('attendance/bulk', [AttendanceController::class, 'storeBulk'])->middleware('permission:record_attendance')->name('academic.attendance.bulk');
    Route::get('attendance/report', [AttendanceController::class, 'report'])->middleware('permission:view_attendance')->name('academic.attendance.report');
    Route::put('attendance/{attendance}', [AttendanceController::class, 'update'])->middleware('permission:record_attendance')->name('academic.attendance.update');
    Route::delete('attendance/{attendance}', [AttendanceController::class, 'destroy'])->middleware('permission:record_attendance')->name('academic.attendance.destroy');

    Route::get('grades', [GradeController::class, 'index'])->middleware('permission:view_grades')->name('academic.grades.index');
    Route::post('grades', [GradeController::class, 'store'])->middleware('permission:create_grades')->name('academic.grades.store');
    Route::post('grades/import', [GradeController::class, 'import'])->middleware('permission:upload_grades')->name('academic.grades.import');
    Route::get('grades/averages', [GradeController::class, 'averages'])->middleware('permission:view_grades')->name('academic.grades.averages');
    Route::get('grades/{grade}', [GradeController::class, 'show'])->middleware('permission:view_grades')->name('academic.grades.show');
    Route::put('grades/{grade}', [GradeController::class, 'update'])->middleware('permission:edit_grades')->name('academic.grades.update');
    Route::delete('grades/{grade}', [GradeController::class, 'destroy'])->middleware('permission:edit_grades')->name('academic.grades.destroy');
});
