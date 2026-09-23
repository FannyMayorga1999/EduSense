<?php

namespace App\Modules\Psychopedagogic\Enums;

/**
 * Statuses of the intervention schedule sessions.
 */
enum ScheduleStatus: string
{
    case Pending = 'pending';
    case Completed = 'completed';
    case Rescheduled = 'rescheduled';
    case Cancelled = 'cancelled';

    /**
     * Human readable label of the status.
     */
    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending (Pendiente)',
            self::Completed => 'Completed (Completado)',
            self::Rescheduled => 'Rescheduled (Reprogramado)',
            self::Cancelled => 'Cancelled (Cancelado)',
        };
    }
}
