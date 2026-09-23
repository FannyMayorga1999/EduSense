<?php

namespace App\Modules\Psychopedagogic\Models;

use App\Modules\Psychopedagogic\Enums\EvaluationArea;
use Database\Factories\Modules\Psychopedagogic\Models\SurveyFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A psychopedagogic evaluation survey.
 *
 * @property string $title
 * @property EvaluationArea $evaluation_area
 */
#[Fillable(['title', 'description', 'evaluation_area', 'is_active'])]
class Survey extends Model
{
    /** @use HasFactory<SurveyFactory> */
    use HasFactory;

    /**
     * Database table of the model (Psychopedagogic module prefix).
     *
     * @var string
     */
    protected $table = 'psy_surveys';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'evaluation_area' => EvaluationArea::class,
            'is_active' => 'boolean',
        ];
    }

    /**
     * The questions of the survey.
     *
     * @return HasMany<Question, $this>
     */
    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }
}
