<?php

namespace App\Modules\Students\Models;

use App\Modules\Academic\Models\Enrollment;
use App\Modules\Psychopedagogic\Models\CurricularAdaptationPlan;
use App\Modules\Psychopedagogic\Models\Diagnostic;
use App\Modules\Psychopedagogic\Models\EvaluationResponse;
use App\Modules\Psychopedagogic\Models\InterventionSchedule;
use App\Modules\Psychopedagogic\Models\ObservationLog;
use App\Modules\Psychopedagogic\Models\PsychopedagogicRecord;
use App\Modules\System\Models\User;
use Database\Factories\Modules\Students\Models\StudentFactory;
use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Master record of a student (Students module).
 *
 * @property string $first_name
 * @property string $last_name
 * @property string|null $document_number
 * @property string|null $document_type
 * @property string|null $gender
 * @property string|null $laterality
 * @property string|null $medical_conditions
 */
#[Fillable(['first_name', 'last_name', 'birth_date', 'document_number', 'document_type', 'gender', 'representative_name', 'representative_relation', 'contact_phone', 'contact_email', 'home_address', 'laterality', 'medical_conditions', 'tutor_id', 'is_active'])]
#[Appends(['full_name', 'academic_status'])]
class Student extends Model
{
    /** @use HasFactory<StudentFactory> */
    use HasFactory;

    /**
     * Database table of the model (Students module prefix).
     *
     * @var string
     */
    protected $table = 'std_students';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    /**
     * The legal or academic tutor of the student.
     *
     * @return BelongsTo<User, $this>
     */
    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }

    /**
     * The enrollments (matriculations) of the student.
     *
     * @return HasMany<Enrollment, $this>
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    /**
     * The psychopedagogic records (fichas) of the student.
     *
     * @return HasMany<PsychopedagogicRecord, $this>
     */
    public function psychopedagogicRecords(): HasMany
    {
        return $this->hasMany(PsychopedagogicRecord::class);
    }

    /**
     * The diagnostics and NEE categorizations of the student.
     *
     * @return HasMany<Diagnostic, $this>
     */
    public function diagnostics(): HasMany
    {
        return $this->hasMany(Diagnostic::class);
    }

    /**
     * The evaluation responses of the student.
     *
     * @return HasMany<EvaluationResponse, $this>
     */
    public function evaluationResponses(): HasMany
    {
        return $this->hasMany(EvaluationResponse::class);
    }

    /**
     * The intervention schedules of the student.
     *
     * @return HasMany<InterventionSchedule, $this>
     */
    public function interventionSchedules(): HasMany
    {
        return $this->hasMany(InterventionSchedule::class);
    }

    /**
     * The observation logs of the student.
     *
     * @return HasMany<ObservationLog, $this>
     */
    public function observationLogs(): HasMany
    {
        return $this->hasMany(ObservationLog::class);
    }

    /**
     * The curricular adaptation plans (PAC) of the student.
     *
     * @return HasMany<CurricularAdaptationPlan, $this>
     */
    public function curricularPlans(): HasMany
    {
        return $this->hasMany(CurricularAdaptationPlan::class);
    }

    /**
     * Full name of the student (first + last).
     *
     * @return Attribute<string, never>
     */
    protected function fullName(): Attribute
    {
        return Attribute::get(fn (): string => trim("{$this->first_name} {$this->last_name}"));
    }

    /**
     * Derived academic status of the student.
     *
     * @return Attribute<string, never>
     */
    protected function academicStatus(): Attribute
    {
        return Attribute::get(function (): string {
            if (! $this->is_active) {
                return 'inactive';
            }

            return match ($this->enrollments->first()?->status) {
                'completed' => 'graduated',
                'retired' => 'retired',
                default => 'active',
            };
        });
    }
}
