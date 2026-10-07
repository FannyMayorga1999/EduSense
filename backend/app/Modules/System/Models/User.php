<?php

namespace App\Modules\System\Models;

use App\Modules\Academic\Submodules\Students\Models\Student;
use App\Modules\Psychopedagogic\Models\EvaluationResponse;
use Database\Factories\Modules\System\Models\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Collection;
use Laravel\Sanctum\HasApiTokens;

/**
 * Authenticated user of the system (System module).
 *
 * @property string $name
 * @property string $email
 * @property bool $is_active
 */
#[Fillable(['name', 'email', 'password', 'is_active', 'last_login_at', 'last_login_ip'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Database table of the model (System module prefix).
     *
     * @var string
     */
    protected $table = 'sys_users';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    /**
     * The roles assigned to the user.
     *
     * @return BelongsToMany<Role, $this>
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'sys_role_user');
    }

    /**
     * All unique permissions granted through the assigned roles.
     *
     * @return Collection<int, Permission>
     */
    public function grantedPermissions(): Collection
    {
        $roleIds = $this->roles()->pluck('sys_roles.id');

        return Permission::query()
            ->whereHas('roles', fn (Builder $query) => $query->whereKey($roleIds))
            ->get();
    }

    /**
     * Students for which the user acts as a tutor.
     *
     * @return HasMany<Student, $this>
     */
    public function tutoredStudents(): HasMany
    {
        return $this->hasMany(Student::class, 'tutor_id');
    }

    /**
     * The evaluation responses recorded by the user as evaluator.
     *
     * @return HasMany<EvaluationResponse, $this>
     */
    public function recordedEvaluations(): HasMany
    {
        return $this->hasMany(EvaluationResponse::class, 'evaluator_id');
    }

    /**
     * Whether the user has any of the given role slugs.
     *
     * @param  string|array<int, string>  $slugs
     */
    public function hasRole(string|array $slugs): bool
    {
        return $this->roles()->whereIn('slug', (array) $slugs)->exists();
    }

    /**
     * Whether the user belongs to the administrator role.
     */
    public function isAdministrator(): bool
    {
        return $this->hasRole('administrator');
    }

    /**
     * Whether the user has the given permission by slug.
     */
    public function hasPermission(string $slug): bool
    {
        if ($this->isAdministrator()) {
            return true;
        }

        return $this->roles()
            ->whereHas('permissions', fn (Builder $query) => $query->where('slug', $slug))
            ->exists();
    }

    /**
     * Whether the user has any of the given permission slugs.
     *
     * @param  array<int, string>  $slugs
     */
    public function hasAnyPermission(array $slugs): bool
    {
        if ($this->isAdministrator()) {
            return true;
        }

        return $this->roles()
            ->whereHas('permissions', fn (Builder $query) => $query->whereIn('slug', $slugs))
            ->exists();
    }
}
