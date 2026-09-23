<?php

namespace App\Modules\Academic\Enums;

/**
 * Statuses of a student enrollment.
 */
enum EnrollmentStatus: string
{
    case Active = 'active';
    case Completed = 'completed';
    case Retired = 'retired';

    /**
     * Human readable label of the status.
     */
    public function label(): string
    {
        return match ($this) {
            self::Active => 'Active (Activo)',
            self::Completed => 'Completed (Completado)',
            self::Retired => 'Retired (Retirado)',
        };
    }
}
