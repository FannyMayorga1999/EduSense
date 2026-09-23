<?php

namespace App\Modules\Psychopedagogic\Enums;

/**
 * Difficulty levels of the psychopedagogic activities.
 */
enum DifficultyLevel: string
{
    case Low = 'low';
    case Medium = 'medium';
    case High = 'high';

    /**
     * Human readable label of the level.
     */
    public function label(): string
    {
        return match ($this) {
            self::Low => 'Low (Bajo)',
            self::Medium => 'Medium (Medio)',
            self::High => 'High (Alto)',
        };
    }
}
