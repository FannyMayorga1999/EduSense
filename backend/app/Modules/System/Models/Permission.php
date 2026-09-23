<?php

namespace App\Modules\System\Models;

use Database\Factories\Modules\System\Models\PermissionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Fine-grained action granted to a role (RBAC).
 *
 * @property string $name
 * @property string $slug
 * @property string $module
 * @property string|null $description
 */
#[Fillable(['name', 'slug', 'module', 'description'])]
class Permission extends Model
{
    /** @use HasFactory<PermissionFactory> */
    use HasFactory;

    /**
     * Database table of the model (System module prefix).
     *
     * @var string
     */
    protected $table = 'sys_permissions';

    /**
     * Roles that receive this permission.
     *
     * @return BelongsToMany<Role, $this>
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'sys_permission_role');
    }

    /**
     * Filter permissions by functional module.
     */
    public function scopeByModule(Builder $query, string $module): Builder
    {
        return $query->where('module', $module);
    }
}
