<?php

namespace Database\Factories\Modules\System\Models;

use App\Modules\System\Enums\PermissionModule;
use App\Modules\System\Models\Permission;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Permission>
 */
class PermissionFactory extends Factory
{
    protected $model = Permission::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $module = fake()->randomElement(PermissionModule::cases());

        return [
            'name' => fake()->unique()->words(3, true),
            'module' => $module,
            'description' => null,
        ];
    }
}
