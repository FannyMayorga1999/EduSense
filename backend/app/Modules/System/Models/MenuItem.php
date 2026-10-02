<?php

namespace App\Modules\System\Models;

use Database\Factories\Modules\System\Models\MenuItemFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A single node of the navigation tree (System module).
 *
 * @property int $id
 * @property int|null $parent_id
 * @property string $key
 * @property string $label_key
 * @property string|null $icon
 * @property string|null $route
 * @property string|null $permission_slug
 * @property int $sort_order
 * @property bool $is_active
 *
 * @method static MenuItemFactory factory($count = null, $state = [])
 */
class MenuItem extends Model
{
    /** @use HasFactory<MenuItemFactory> */
    use HasFactory;

    /**
     * Database table of the model (System module prefix).
     *
     * @var string
     */
    protected $table = 'sys_menu_items';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * The parent menu node that owns this node.
     *
     * @return BelongsTo<MenuItem, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /**
     * The child menu nodes nested below this node.
     *
     * @return HasMany<MenuItem, $this>
     */
    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('sort_order');
    }
}
