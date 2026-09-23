<?php

namespace Database\Factories\Modules\Psychopedagogic\Models;

use App\Modules\Psychopedagogic\Models\ObservationLog;
use App\Modules\Students\Models\Student;
use App\Modules\System\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ObservationLog>
 */
class ObservationLogFactory extends Factory
{
    protected $model = ObservationLog::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'observation' => fake()->paragraph(),
            'observed_by' => User::factory(),
            'observed_at' => now()->toDateString(),
        ];
    }
}
