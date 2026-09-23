<?php

namespace App\Modules\Psychopedagogic\Models;

use Database\Factories\Modules\Psychopedagogic\Models\QuestionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A question of a psychopedagogic survey.
 *
 * @property string $statement
 * @property int $alert_weight
 */
#[Fillable(['survey_id', 'statement', 'alert_weight'])]
class Question extends Model
{
    /** @use HasFactory<QuestionFactory> */
    use HasFactory;

    /**
     * Database table of the model (Psychopedagogic module prefix).
     *
     * @var string
     */
    protected $table = 'psy_questions';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'alert_weight' => 'integer',
        ];
    }

    /**
     * The survey that owns the question.
     *
     * @return BelongsTo<Survey, $this>
     */
    public function survey(): BelongsTo
    {
        return $this->belongsTo(Survey::class);
    }

    /**
     * The evaluation responses of the question.
     *
     * @return HasMany<EvaluationResponse, $this>
     */
    public function responses(): HasMany
    {
        return $this->hasMany(EvaluationResponse::class);
    }
}
