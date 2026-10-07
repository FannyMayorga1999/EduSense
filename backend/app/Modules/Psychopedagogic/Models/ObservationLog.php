<?php

namespace App\Modules\Psychopedagogic\Models;

use App\Modules\Academic\Submodules\Students\Models\Student;
use App\Modules\System\Models\User;
use Database\Factories\Modules\Psychopedagogic\Models\ObservationLogFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Observation history entry of a student.
 *
 * @property string $observation
 */
#[Fillable(['student_id', 'observation', 'observed_by', 'observed_at'])]
class ObservationLog extends Model
{
    /** @use HasFactory<ObservationLogFactory> */
    use HasFactory;

    /**
     * Database table of the model (Psychopedagogic module prefix).
     *
     * @var string
     */
    protected $table = 'psy_observation_logs';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'observed_at' => 'date',
        ];
    }

    /**
     * The observed student.
     *
     * @return BelongsTo<Student, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * The user that recorded the observation.
     *
     * @return BelongsTo<User, $this>
     */
    public function observer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'observed_by');
    }
}
