<?php

namespace Database\Factories\Modules\Psychopedagogic\Models;

use App\Modules\Academic\Submodules\Students\Models\Student;
use App\Modules\Psychopedagogic\Enums\PlanStatus;
use App\Modules\Psychopedagogic\Models\CurricularAdaptationPlan;
use App\Modules\System\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CurricularAdaptationPlan>
 */
class CurricularAdaptationPlanFactory extends Factory
{
    protected $model = CurricularAdaptationPlan::class;

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
            'objective' => fake()->sentence(),
            'start_date' => now()->toDateString(),
            'end_date' => null,
            'status' => PlanStatus::Active,
            'observations' => null,
            'created_by' => User::factory(),
        ];
    }
}
