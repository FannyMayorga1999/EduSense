<?php

namespace App\Modules\Psychopedagogic\Models;

use App\Modules\Academic\Submodules\Students\Models\Student;
use App\Modules\System\Models\User;
use Database\Factories\Modules\Psychopedagogic\Models\PsychopedagogicRecordFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Psychopedagogic record (ficha) of a student.
 *
 * @property string $title
 * @property string|null $diagnosis
 */
#[Fillable(['student_id', 'title', 'description', 'diagnosis', 'interventions_summary', 'registered_by', 'recorded_at'])]
class PsychopedagogicRecord extends Model
{
    /** @use HasFactory<PsychopedagogicRecordFactory> */
    use HasFactory;

    /**
     * Database table of the model (Psychopedagogic module prefix).
     *
     * @var string
     */
    protected $table = 'psy_psychopedagogic_records';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'recorded_at' => 'date',
        ];
    }

    /**
     * The student of the record.
     *
     * @return BelongsTo<Student, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * The user that registered the record.
     *
     * @return BelongsTo<User, $this>
     */
    public function registrar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by');
    }
}
