<?php

namespace App\Modules\System\Enums;

/**
 * Built-in roles of the platform.
 */
enum UserRole: string
{
    case Administrator = 'administrator';
    case Teacher = 'teacher';
    case Psychopedagogist = 'psychopedagogist';

    /**
     * Human readable label of the role.
     */
    public function label(): string
    {
        return match ($this) {
            self::Administrator => 'Administrator',
            self::Teacher => 'Teacher (Profesor)',
            self::Psychopedagogist => 'Psychopedagogist (Psicopedagogo)',
        };
    }
}
