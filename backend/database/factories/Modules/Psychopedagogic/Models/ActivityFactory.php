<?php

namespace Database\Factories\Modules\Psychopedagogic\Models;

use App\Modules\Psychopedagogic\Enums\DifficultyLevel;
use App\Modules\Psychopedagogic\Enums\EvaluationArea;
use App\Modules\Psychopedagogic\Models\Activity;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Activity>
 */
class ActivityFactory extends Factory
{
    protected $model = Activity::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->unique()->sentence(3),
            'description' => fake()->paragraph(),
            'category' => fake()->randomElement(EvaluationArea::cases()),
            'difficulty_level' => $this->faker->randomElement([DifficultyLevel::Low, DifficultyLevel::Medium, DifficultyLevel::High]),
            'duration_minutes' => fake()->randomElement([15, 20, 30, 45]),
            'is_active' => true,
        ];
    }
}
