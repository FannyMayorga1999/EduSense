<?php

namespace Database\Factories\Modules\Psychopedagogic\Models;

use App\Modules\Psychopedagogic\Models\Question;
use App\Modules\Psychopedagogic\Models\Survey;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Question>
 */
class QuestionFactory extends Factory
{
    protected $model = Question::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'survey_id' => Survey::factory(),
            'statement' => fake()->sentence(),
            'alert_weight' => fake()->randomElement([1, 2, 3]),
        ];
    }
}
