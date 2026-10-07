<?php

namespace Database\Factories\Modules\Psychopedagogic\Models;

use App\Modules\Academic\Submodules\Students\Models\Student;
use App\Modules\Psychopedagogic\Models\EvaluationResponse;
use App\Modules\Psychopedagogic\Models\Question;
use App\Modules\System\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EvaluationResponse>
 */
class EvaluationResponseFactory extends Factory
{
    protected $model = EvaluationResponse::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'question_id' => Question::factory(),
            'evaluator_id' => User::factory(),
            'option_value' => fake()->numberBetween(1, 5),
            'observation' => null,
            'application_date' => now()->toDateString(),
        ];
    }
}
