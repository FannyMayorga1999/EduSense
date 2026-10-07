<?php

namespace App\Modules\Psychopedagogic\Models;

use App\Modules\Academic\Submodules\Students\Models\Student;
use App\Modules\Psychopedagogic\Enums\DiagnosticSeverity;
use App\Modules\System\Models\User;
use Database\Factories\Modules\Psychopedagogic\Models\DiagnosticFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A diagnostic and NEE categorization of a student.
 *
 * @property string $title
 * @property DiagnosticSeverity $severity
 */
#[Fillable(['student_id', 'nee_category_id', 'title', 'description', 'severity', 'detected_by', 'detected_at'])]
class Diagnostic extends Model
{
    /** @use HasFactory<DiagnosticFactory> */
    use HasFactory;

    /**
     * Database table of the model (Psychopedagogic module prefix).
     *
     * @var string
     */
    protected $table = 'psy_diagnostics';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'severity' => DiagnosticSeverity::class,
            'detected_at' => 'date',
        ];
    }

    /**
     * The diagnosed student.
     *
     * @return BelongsTo<Student, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * The NEE category of the diagnostic.
     *
     * @return BelongsTo<NeeCategory, $this>
     */
    public function neeCategory(): BelongsTo
    {
        return $this->belongsTo(NeeCategory::class);
    }

    /**
     * The user that detected the diagnostic.
     *
     * @return BelongsTo<User, $this>
     */
    public function detector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'detected_by');
    }
}
