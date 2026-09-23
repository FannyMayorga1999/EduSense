<?php

namespace Database\Factories\Modules\Academic\Models;

use App\Modules\Academic\Models\AcademicTerm;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AcademicTerm>
 */
class AcademicTermFactory extends Factory
{
    protected $model = AcademicTerm::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $order = fake()->randomElement(range(1, 3));

        return [
            'name' => 'Periodo '.$order,
            'start_date' => fake()->dateTimeBetween('-3 months', '-1 month')->format('Y-m-d'),
            'end_date' => fake()->dateTimeBetween('+1 month', '+3 months')->format('Y-m-d'),
            'is_current' => false,
        ];
    }

    /**
     * Mark the term as the current one.
     */
    public function current(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_current' => true,
        ]);
    }
}
