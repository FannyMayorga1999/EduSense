<?php

namespace Database\Factories\Modules\Psychopedagogic\Models;

use App\Modules\Academic\Submodules\Students\Models\Student;
use App\Modules\Psychopedagogic\Enums\ScheduleStatus;
use App\Modules\Psychopedagogic\Models\Activity;
use App\Modules\Psychopedagogic\Models\InterventionSchedule;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InterventionSchedule>
 */
class InterventionScheduleFactory extends Factory
{
    protected $model = InterventionSchedule::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'activity_id' => Activity::factory(),
            'subject_id' => null,
            'scheduled_date' => fake()->dateTimeBetween('+1 day', '+2 weeks')->format('Y-m-d'),
            'status' => ScheduleStatus::Pending,
            'progress_notes' => null,
        ];
    }
}
