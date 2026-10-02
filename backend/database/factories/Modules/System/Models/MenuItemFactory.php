<?php

namespace Database\Factories\Modules\System\Models;

use App\Modules\System\Models\MenuItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MenuItem>
 */
class MenuItemFactory extends Factory
{
    protected $model = MenuItem::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'key' => fake()->unique()->slug(2),
            'label_key' => 'menu.'.fake()->unique()->slug(1),
            'icon' => null,
            'route' => null,
            'permission_slug' => null,
            'sort_order' => fake()->numberBetween(0, 100),
            'is_active' => true,
        ];
    }

    /**
     * The node acts as a navigable leaf with the given route.
     */
    public function link(string $route, ?string $permission = null): static
    {
        return $this->state(fn (array $attributes) => [
            'route' => $route,
            'permission_slug' => $permission,
        ]);
    }
}
