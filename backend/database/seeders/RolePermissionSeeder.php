<?php

namespace Database\Seeders;

use App\Modules\Administration\Models\Module;
use App\Modules\System\Models\Permission;
use App\Modules\System\Models\Role;
use App\Modules\System\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Registers the modules registry, the permission catalogue, the default
 * roles and the deterministic platform users.
 */
class RolePermissionSeeder extends Seeder
{
    /**
     * Permission slugs grouped by functional module (PermissionModule values).
     *
     * @var array<string, array<int, string>>
     */
    protected array $permissionsByModule = [
        'dashboard' => ['view_dashboard'],
        'students' => ['view_students', 'create_students', 'edit_students', 'delete_students', 'import_students', 'export_students'],
        'surveys' => ['view_surveys', 'create_surveys', 'edit_surveys', 'delete_surveys', 'evaluate_students', 'view_results'],
        'schedules' => ['view_schedules', 'create_schedules', 'edit_schedules', 'delete_schedules'],
        'records' => ['view_records', 'create_records', 'edit_records', 'delete_records'],
        'diagnostics' => ['view_diagnostics', 'create_diagnostics', 'edit_diagnostics', 'delete_diagnostics'],
        'courses' => ['view_courses', 'create_courses', 'edit_courses', 'delete_courses'],
        'subjects' => ['view_subjects', 'create_subjects', 'edit_subjects', 'delete_subjects'],
        'academic_terms' => ['view_terms', 'create_terms', 'edit_terms', 'delete_terms'],
        'enrollments' => ['view_enrollments', 'manage_enrollments'],
        'attendance' => ['view_attendance', 'record_attendance'],
        'grades' => ['view_grades', 'create_grades', 'edit_grades', 'upload_grades'],
        'reports' => ['view_reports', 'export_reports'],
        'users' => ['view_users', 'create_users', 'edit_users', 'delete_users'],
        'roles' => ['manage_roles'],
        'modules' => ['view_modules', 'manage_modules'],
        'audit' => ['view_audit_logs'],
        'settings' => ['manage_settings'],
    ];

    /**
     * Default roles and their permission slugs.
     *
     * @var array<string, array<string, string>>
     */
    protected array $roles = [
        'administrator' => [
            'name' => 'Administrator (Administrador)',
            'permissions' => [], // filled with all below
        ],
        'teacher' => [
            'name' => 'Teacher (Docente)',
            'permissions' => [
                'view_dashboard', 'view_students', 'view_courses', 'view_subjects', 'view_terms',
                'view_enrollments', 'view_attendance', 'record_attendance', 'view_grades',
                'create_grades', 'edit_grades', 'view_reports',
            ],
        ],
        'psychopedagogist' => [
            'name' => 'Psychopedagogist (Psicopedagogo/a)',
            'permissions' => [
                'view_dashboard', 'view_students', 'create_students', 'edit_students', 'delete_students',
                'import_students', 'export_students', 'view_courses', 'view_terms',
                'view_surveys', 'create_surveys', 'edit_surveys',
                'delete_surveys', 'view_schedules', 'create_schedules', 'edit_schedules',
                'delete_schedules', 'view_records', 'create_records', 'edit_records', 'delete_records',
                'view_diagnostics', 'create_diagnostics', 'edit_diagnostics', 'delete_diagnostics',
                'evaluate_students', 'view_results', 'view_reports',
            ],
        ],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->seedModules();

        $permissions = $this->seedPermissions();

        $this->seedRoles($permissions);

        $this->seedUsers();
    }

    /**
     * Creates the active module registry entries.
     */
    protected function seedModules(): void
    {
        $modules = [
            ['system', 'System (Sistema)', 'sys_', '1.0', 1],
            ['administration', 'Administration (Administración)', 'adm_', '1.0', 2],
            ['students', 'Students (Estudiantes)', 'std_', '1.0', 3],
            ['academic', 'Academic (Académico)', 'aca_', '1.0', 4],
            ['psychopedagogic', 'Psychopedagogic (Psicopedagógico)', 'psy_', '1.0', 5],
        ];

        foreach ($modules as [$slug, $name, $prefix, $version, $sortOrder]) {
            Module::query()->updateOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'prefix' => $prefix, 'version' => $version, 'sort_order' => $sortOrder, 'is_active' => true],
            );
        }
    }

    /**
     * Creates the permission catalogue.
     *
     * @return array<string, int> slug -> id
     */
    protected function seedPermissions(): array
    {
        $map = [];

        foreach ($this->permissionsByModule as $module => $slugs) {
            foreach ($slugs as $slug) {
                $permission = Permission::query()->updateOrCreate(
                    ['slug' => $slug],
                    [
                        'name' => Str::title(str_replace('_', ' ', $slug)),
                        'module' => $module,
                    ],
                );

                $map[$slug] = $permission->id;
            }
        }

        return $map;
    }

    /**
     * Creates the default roles and syncs their permissions.
     *
     * @param  array<string, int>  $permissions
     */
    protected function seedRoles(array $permissions): void
    {
        foreach ($this->roles as $slug => $config) {
            $role = Role::query()->updateOrCreate(
                ['slug' => $slug],
                ['name' => $config['name']],
            );

            $assigned = $slug === 'administrator'
                ? array_values($permissions)
                : array_values(array_intersect_key($permissions, array_flip($config['permissions'])));

            $role->permissions()->sync($assigned);
        }
    }

    /**
     * Creates the initial platform users.
     */
    protected function seedUsers(): void
    {
        $users = [
            ['Admin Principal', 'admin@edusense.local', ['administrator']],
            ['Docente Profesor', 'profesor@edusense.local', ['teacher']],
            ['Psicopedagoga Karla', 'psicopedagogo@edusense.local', ['psychopedagogist']],
            ['Docente Evaluador', 'evaluador@edusense.local', ['teacher']],
        ];

        foreach ($users as [$name, $email, $roles]) {
            $user = User::query()->updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'password' => 'edusense-2026',
                    'is_active' => true,
                ],
            );

            $roleIds = Role::query()->whereIn('slug', $roles)->pluck('id')->all();

            $user->roles()->sync($roleIds);
        }
    }
}
