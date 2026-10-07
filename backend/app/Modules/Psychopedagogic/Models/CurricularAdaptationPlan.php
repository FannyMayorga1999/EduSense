<?php

namespace App\Modules\Psychopedagogic\Models;

use App\Modules\Academic\Submodules\Students\Models\Student;
use App\Modules\Psychopedagogic\Enums\PlanStatus;
use App\Modules\System\Models\User;
use Database\Factories\Modules\Psychopedagogic\Models\CurricularAdaptationPlanFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A curricular adaptation plan (PAC) of a student.
 *
 * @property string $title
 * @property string|null $objective
 * @property PlanStatus $status
 */
#[Fillable(['student_id', 'title', 'objective', 'start_date', 'end_date', 'status', 'observations', 'created_by'])]
class CurricularAdaptationPlan extends Model
{
    /** @use HasFactory<CurricularAdaptationPlanFactory> */
    use HasFactory;

    /**
     * Database table of the model (Psychopedagogic module prefix).
     *
     * @var string
     */
    protected $table = 'psy_curricular_adaptation_plans';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'status' => PlanStatus::class,
        ];
    }

    /**
     * The student of the plan.
     *
     * @return BelongsTo<Student, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * The user that created the plan.
     *
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
