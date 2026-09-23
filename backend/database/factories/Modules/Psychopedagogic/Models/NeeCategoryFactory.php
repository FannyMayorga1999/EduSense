<?php

namespace Database\Factories\Modules\Psychopedagogic\Models;

use App\Modules\Psychopedagogic\Models\NeeCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<NeeCategory>
 */
class NeeCategoryFactory extends Factory
{
    protected $model = NeeCategory::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => 'NEE-'.strtoupper(fake()->unique()->lexify('????')),
            'name' => fake()->unique()->words(3, true),
            'description' => fake()->sentence(),
            'is_active' => true,
        ];
    }
}
