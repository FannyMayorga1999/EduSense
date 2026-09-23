<?php

namespace Database\Factories\Modules\Academic\Models;

use App\Modules\Academic\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Course>
 */
class CourseFactory extends Factory
{
    protected $model = Course::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $levels = ['Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto', 'Sexto', 'Séptimo', 'Octavo', 'Noveno', 'Décimo'];

        return [
            'code' => strtoupper(fake()->unique()->regexify('[A-Z]{1}[0-9]{3}')),
            'name' => fake()->randomElement($levels).' de '.fake()->randomElement(['Básica', 'Media']),
            'description' => fake()->sentence(),
            'is_active' => true,
        ];
    }
}
