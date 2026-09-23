<?php

namespace App\Modules\Administration\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * Key/value configuration setting.
 *
 * @property string $key
 * @property string|null $value
 * @property string $group
 */
#[Fillable(['key', 'value', 'group'])]
class Setting extends Model
{
    /**
     * Database table of the model (Administration module prefix).
     *
     * @var string
     */
    protected $table = 'adm_settings';

    /**
     * The primary key of the model.
     *
     * @var string
     */
    protected $primaryKey = 'key';

    /**
     * The primary key type.
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * Indicates the model should have a timestamp field.
     */
    public $incrementing = false;

    /**
     * Reads a setting value with a fallback default.
     */
    public static function valueOf(string $key, ?string $default = null): ?string
    {
        $setting = static::query()->find($key);

        return $setting?->value ?? $default;
    }
}
