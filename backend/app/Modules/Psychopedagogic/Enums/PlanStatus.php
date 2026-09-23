<?php

namespace App\Modules\Psychopedagogic\Enums;

/**
 * Statuses of a curricular adaptation plan.
 */
enum PlanStatus: string
{
    case Active = 'active';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    /**
     * Human readable label of the status.
     */
    public function label(): string
    {
        return match ($this) {
            self::Active => 'Active (Activo)',
            self::Completed => 'Completed (Completado)',
            self::Cancelled => 'Cancelled (Cancelado)',
        };
    }
}
