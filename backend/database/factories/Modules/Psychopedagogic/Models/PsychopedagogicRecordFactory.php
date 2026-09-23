<?php

namespace Database\Factories\Modules\Psychopedagogic\Models;

use App\Modules\Psychopedagogic\Models\PsychopedagogicRecord;
use App\Modules\Students\Models\Student;
use App\Modules\System\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PsychopedagogicRecord>
 */
class PsychopedagogicRecordFactory extends Factory
{
    protected $model = PsychopedagogicRecord::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'diagnosis' => null,
            'interventions_summary' => null,
            'registered_by' => User::factory(),
            'recorded_at' => now()->toDateString(),
        ];
    }
}
