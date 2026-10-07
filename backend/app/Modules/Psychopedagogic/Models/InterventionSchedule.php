<?php

namespace App\Modules\Psychopedagogic\Models;

use App\Modules\Academic\Models\Subject;
use App\Modules\Academic\Submodules\Students\Models\Student;
use App\Modules\Psychopedagogic\Enums\ScheduleStatus;
use Database\Factories\Modules\Psychopedagogic\Models\InterventionScheduleFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A scheduled intervention session for a student.
 *
 * @property int|null $subject_id
 * @property ScheduleStatus $status
 * @property string|null $progress_notes
 */
#[Fillable(['student_id', 'activity_id', 'subject_id', 'scheduled_date', 'status', 'progress_notes'])]
class InterventionSchedule extends Model
{
    /** @use HasFactory<InterventionScheduleFactory> */
    use HasFactory;

    /**
     * Database table of the model (Psychopedagogic module prefix).
     *
     * @var string
     */
    protected $table = 'psy_intervention_schedules';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'scheduled_date' => 'date',
            'status' => ScheduleStatus::class,
        ];
    }

    /**
     * The student of the intervention.
     *
     * @return BelongsTo<Student, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * The activity scheduled.
     *
     * @return BelongsTo<Activity, $this>
     */
    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }

    /**
     * The optional linked subject.
     *
     * @return BelongsTo<Subject, $this>
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }
}
