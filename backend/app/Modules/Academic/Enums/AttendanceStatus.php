<?php

namespace App\Modules\Academic\Enums;

/**
 * Statuses of an attendance record.
 */
enum AttendanceStatus: string
{
    case Present = 'present';
    case Absent = 'absent';
    case Late = 'late';
    case Excused = 'excused';

    /**
     * Human readable label of the status.
     */
    public function label(): string
    {
        return match ($this) {
            self::Present => 'Present (Presente)',
            self::Absent => 'Absent (Ausente)',
            self::Late => 'Late (Atraso)',
            self::Excused => 'Excused (Justificado)',
        };
    }
}
