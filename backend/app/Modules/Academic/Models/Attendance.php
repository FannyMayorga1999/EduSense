<?php

namespace App\Modules\Academic\Models;

use App\Modules\Students\Models\Student;
use Database\Factories\Modules\Academic\Models\AttendanceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Attendance (asistencia) record of a student.
 *
 * @property string $status
 * @property string $attendance_date
 */
#[Fillable(['student_id', 'subject_id', 'attendance_date', 'status', 'notes'])]
class Attendance extends Model
{
    /** @use HasFactory<AttendanceFactory> */
    use HasFactory;

    /**
     * Database table of the model (Academic module prefix).
     *
     * @var string
     */
    protected $table = 'aca_attendance';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'attendance_date' => 'date',
        ];
    }

    /**
     * The student the attendance belongs to.
     *
     * @return BelongsTo<Student, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * The subject of the attendance (optional, course level otherwise).
     *
     * @return BelongsTo<Subject, $this>
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }
}
