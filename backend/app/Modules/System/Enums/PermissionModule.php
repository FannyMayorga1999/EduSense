<?php

namespace App\Modules\System\Enums;

/**
 * Functional areas used to group permissions in the UI and RBAC.
 */
enum PermissionModule: string
{
    case Dashboard = 'dashboard';
    case Students = 'students';
    case Surveys = 'surveys';
    case Schedules = 'schedules';
    case Records = 'records';
    case Diagnostics = 'diagnostics';
    case Courses = 'courses';
    case Subjects = 'subjects';
    case Terms = 'academic_terms';
    case Enrollments = 'enrollments';
    case Attendance = 'attendance';
    case Grades = 'grades';
    case Reports = 'reports';
    case Users = 'users';
    case Roles = 'roles';
    case Modules = 'modules';
    case Audit = 'audit';
    case Settings = 'settings';

    /**
     * Human readable label of the functional area.
     */
    public function label(): string
    {
        return match ($this) {
            self::Dashboard => 'Dashboard (Panel)',
            self::Students => 'Students (Estudiantes)',
            self::Surveys => 'Surveys & Evaluations (Encuestas)',
            self::Schedules => 'Intervention Schedules (Cronogramas)',
            self::Records => 'Psychopedagogic Records (Fichas)',
            self::Diagnostics => 'Diagnostics & NEE (Diagnósticos)',
            self::Courses => 'Courses (Cursos)',
            self::Subjects => 'Subjects (Materias)',
            self::Terms => 'Academic Terms (Periodos)',
            self::Enrollments => 'Enrollments (Matrículas)',
            self::Attendance => 'Attendance (Asistencias)',
            self::Grades => 'Grades (Notas)',
            self::Reports => 'Academic Reports (Reportes)',
            self::Users => 'Users (Usuarios)',
            self::Roles => 'Roles y Permisos',
            self::Modules => 'Modules (Módulos)',
            self::Audit => 'Audit (Auditoría)',
            self::Settings => 'Settings (Configuración)',
        };
    }
}
