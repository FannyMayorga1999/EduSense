<?php

namespace App\Modules\Academic\Models;

use Database\Factories\Modules\Academic\Models\SubjectFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A subject (materia) offered within a course.
 *
 * @property string $code
 * @property string $name
 */
#[Fillable(['course_id', 'code', 'name', 'description'])]
class Subject extends Model
{
    /** @use HasFactory<SubjectFactory> */
    use HasFactory;

    /**
     * Database table of the model (Academic module prefix).
     *
     * @var string
     */
    protected $table = 'aca_subjects';

    /**
     * The course that offers this subject.
     *
     * @return BelongsTo<Course, $this>
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
