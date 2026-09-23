<?php

namespace App\Modules\Psychopedagogic\Models;

use App\Modules\Psychopedagogic\Enums\DifficultyLevel;
use App\Modules\Psychopedagogic\Enums\EvaluationArea;
use Database\Factories\Modules\Psychopedagogic\Models\ActivityFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * An intervention activity (catalogue).
 *
 * @property string $title
 * @property EvaluationArea $category
 * @property DifficultyLevel $difficulty_level
 * @property int $duration_minutes
 */
#[Fillable(['title', 'description', 'category', 'difficulty_level', 'duration_minutes', 'is_active'])]
class Activity extends Model
{
    /** @use HasFactory<ActivityFactory> */
    use HasFactory;

    /**
     * Database table of the model (Psychopedagogic module prefix).
     *
     * @var string
     */
    protected $table = 'psy_activities';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'category' => EvaluationArea::class,
            'difficulty_level' => DifficultyLevel::class,
            'duration_minutes' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * The schedule sessions that use this activity.
     *
     * @return HasMany<InterventionSchedule, $this>
     */
    public function schedules(): HasMany
    {
        return $this->hasMany(InterventionSchedule::class);
    }
}
