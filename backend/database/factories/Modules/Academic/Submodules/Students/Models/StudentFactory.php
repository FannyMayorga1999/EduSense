<?php

namespace Database\Factories\Modules\Academic\Submodules\Students\Models;

use App\Modules\Academic\Submodules\Students\Models\Student;
use App\Modules\System\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Student>
 */
class StudentFactory extends Factory
{
    protected $model = Student::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'birth_date' => fake()->dateTimeBetween('-14 years', '-6 years')->format('Y-m-d'),
            'document_number' => (string) fake()->unique()->numberBetween(1000000, 99999999),
            'tutor_id' => null,
            'is_active' => true,
        ];
    }

    /**
     * Attach a tutor user to the student.
     */
    public function withTutor(): static
    {
        return $this->state(fn (array $attributes) => [
            'tutor_id' => User::factory(),
        ]);
    }
}
