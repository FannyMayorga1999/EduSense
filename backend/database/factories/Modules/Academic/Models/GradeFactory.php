<?php

namespace Database\Factories\Modules\Academic\Models;

use App\Modules\Academic\Models\AcademicTerm;
use App\Modules\Academic\Models\Grade;
use App\Modules\Academic\Models\Subject;
use App\Modules\Academic\Submodules\Students\Models\Student;
use App\Modules\System\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Grade>
 */
class GradeFactory extends Factory
{
    protected $model = Grade::class;

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
            'term_id' => AcademicTerm::factory(),
            'score' => fake()->randomFloat(2, 5, 10),
            'observation' => fake()->optional()->sentence(),
            'created_by' => User::factory(),
        ];
    }
}
