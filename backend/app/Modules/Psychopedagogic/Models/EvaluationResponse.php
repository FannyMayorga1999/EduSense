<?php

namespace App\Modules\Psychopedagogic\Models;

use App\Modules\Students\Models\Student;
use App\Modules\System\Models\User;
use Database\Factories\Modules\Psychopedagogic\Models\EvaluationResponseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An individual answer of an evaluation (value 1-5).
 *
 * @property int $option_value
 * @property string|null $observation
 */
#[Fillable(['student_id', 'question_id', 'evaluator_id', 'option_value', 'observation', 'application_date'])]
class EvaluationResponse extends Model
{
    /** @use HasFactory<EvaluationResponseFactory> */
    use HasFactory;

    /**
     * Database table of the model (Psychopedagogic module prefix).
     *
     * @var string
     */
    protected $table = 'psy_evaluation_responses';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'option_value' => 'integer',
            'application_date' => 'date',
        ];
    }

    /**
     * The student the response belongs to.
     *
     * @return BelongsTo<Student, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * The answered question.
     *
     * @return BelongsTo<Question, $this>
     */
    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    /**
     * The evaluator user that recorded the response.
     *
     * @return BelongsTo<User, $this>
     */
    public function evaluator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'evaluator_id');
    }
}
