<?php

namespace App\Modules\Psychopedagogic\Models;

use Database\Factories\Modules\Psychopedagogic\Models\NeeCategoryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * NEE (special educational needs) category catalogue.
 *
 * @property string $code
 * @property string $name
 */
#[Fillable(['code', 'name', 'description', 'is_active'])]
class NeeCategory extends Model
{
    /** @use HasFactory<NeeCategoryFactory> */
    use HasFactory;

    /**
     * Database table of the model (Psychopedagogic module prefix).
     *
     * @var string
     */
    protected $table = 'psy_nee_categories';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * The diagnostics categorized under this NEE category.
     *
     * @return HasMany<Diagnostic, $this>
     */
    public function diagnostics(): HasMany
    {
        return $this->hasMany(Diagnostic::class);
    }
}
