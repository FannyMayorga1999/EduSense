<?php

namespace Database\Factories\Modules\Academic\Models;

use App\Modules\Academic\Models\Course;
use App\Modules\Academic\Models\Subject;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Subject>
 */
class SubjectFactory extends Factory
{
    protected $model = Subject::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $subjects = ['Matemática', 'Lengua y Literatura', 'Ciencias Naturales', 'Estudios Sociales', 'Artes', 'Inglés', 'Música', 'Educación Física'];

        return [
            'course_id' => Course::factory(),
            'code' => strtoupper(fake()->unique()->regexify('[A-Z]{2}[0-9]{2}')),
            'name' => fake()->randomElement($subjects),
            'description' => fake()->sentence(),
        ];
    }
}
