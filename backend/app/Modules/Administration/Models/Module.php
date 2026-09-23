<?php

namespace App\Modules\Administration\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * Registry entry of an installed application module.
 *
 * @property string $slug
 * @property string $name
 * @property string $prefix
 * @property string $version
 * @property bool $is_active
 */
#[Fillable(['slug', 'name', 'prefix', 'version', 'sort_order', 'description', 'is_active'])]
class Module extends Model
{
    /**
     * Database table of the model (Administration module prefix).
     *
     * @var string
     */
    protected $table = 'adm_modules';

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
}
