<?php

namespace App\Modules\Psychopedagogic\Enums;

/**
 * Evaluation areas of the psychopedagogic surveys.
 */
enum EvaluationArea: string
{
    case ReadingWriting = 'reading_writing';
    case Math = 'math';
    case Attention = 'attention';
    case Motor = 'motor';

    /**
     * Human readable label of the area.
     */
    public function label(): string
    {
        return match ($this) {
            self::ReadingWriting => 'Reading & Writing (Lectoescritura)',
            self::Math => 'Math (Cálculo)',
            self::Attention => 'Attention (Atención)',
            self::Motor => 'Motor skills (Habilidades motrices)',
        };
    }

    /**
     * The alert threshold score of the area.
     */
    public function alertThreshold(): int
    {
        return match ($this) {
            self::ReadingWriting, self::Attention => 15,
            self::Math, self::Motor => 12,
        };
    }
}
