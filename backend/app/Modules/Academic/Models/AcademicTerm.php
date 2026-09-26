<?php

namespace App\Modules\Academic\Models;

use Database\Factories\Modules\Academic\Models\AcademicTermFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Academic term/period (e.g. a quarter or trimester).
 *
 * @property string $name
 * @property bool $is_current
 */
#[Fillable(['name', 'start_date', 'end_date', 'is_current'])]
class AcademicTerm extends Model
{
    /** @use HasFactory<AcademicTermFactory> */
    use HasFactory;

    /**
     * Database table of the model (Academic module prefix).
     *
     * @var string
     */
    protected $table = 'aca_academic_terms';

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
            'is_current' => 'boolean',
        ];
    }

    /**
     * The enrollments performed for this term.
     *
     * @return HasMany<Enrollment, $this>
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class, 'term_id');
    }

    /**
     * The grades recorded for this term.
     *
     * @return HasMany<Grade, $this>
     */
    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class, 'term_id');
    }
}
