<?php

namespace App\Modules\Psychopedagogic\Enums;

/**
 * Severity levels of a psychopedagogic diagnostic.
 */
enum DiagnosticSeverity: string
{
    case Low = 'low';
    case Moderate = 'moderate';
    case High = 'high';

    /**
     * Human readable label of the severity.
     */
    public function label(): string
    {
        return match ($this) {
            self::Low => 'Low (Leve)',
            self::Moderate => 'Moderate (Moderada)',
            self::High => 'High (Alta)',
        };
    }
}
