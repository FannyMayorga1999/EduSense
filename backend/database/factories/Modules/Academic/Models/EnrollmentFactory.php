<?php

namespace Database\Factories\Modules\Academic\Models;

use App\Modules\Academic\Enums\EnrollmentStatus;
use App\Modules\Academic\Models\AcademicTerm;
use App\Modules\Academic\Models\Course;
use App\Modules\Academic\Models\Enrollment;
use App\Modules\Academic\Submodules\Students\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Enrollment>
 */
class EnrollmentFactory extends Factory
{
    protected $model = Enrollment::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'course_id' => Course::factory(),
            'term_id' => AcademicTerm::factory(),
            'status' => EnrollmentStatus::Active,
            'enrolled_at' => now()->toDateString(),
        ];
    }
}
