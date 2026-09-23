<?php

namespace Database\Factories\Modules\Academic\Models;

use App\Modules\Academic\Enums\AttendanceStatus;
use App\Modules\Academic\Models\Attendance;
use App\Modules\Academic\Models\Subject;
use App\Modules\Students\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Attendance>
 */
class AttendanceFactory extends Factory
{
    protected $model = Attendance::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'subject_id' => Subject::factory(),
            'attendance_date' => now()->toDateString(),
            'status' => fake()->randomElement(AttendanceStatus::cases()),
            'notes' => null,
        ];
    }
}
