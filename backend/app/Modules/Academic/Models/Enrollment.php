<?php

namespace App\Modules\Academic\Models;

use App\Modules\Students\Models\Student;
use Database\Factories\Modules\Academic\Models\EnrollmentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Enrollment of a student in a course for a term.
 *
 * @property string $status
 * @property string|null $parallel
 * @property string|null $enrolled_at
 */
#[Fillable(['student_id', 'course_id', 'term_id', 'status', 'parallel', 'enrolled_at'])]
class Enrollment extends Model
{
    /** @use HasFactory<EnrollmentFactory> */
    use HasFactory;

    /**
     * Database table of the model (Academic module prefix).
     *
     * @var string
     */
    protected $table = 'aca_enrollments';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'enrolled_at' => 'date',
        ];
    }

    /**
     * The enrolled student.
     *
     * @return BelongsTo<Student, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * The course in which the student is enrolled.
     *
     * @return BelongsTo<Course, $this>
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * The academic term of the enrollment.
     *
     * @return BelongsTo<AcademicTerm, $this>
     */
    public function term(): BelongsTo
    {
        return $this->belongsTo(AcademicTerm::class);
    }
}
