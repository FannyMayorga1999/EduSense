<?php

namespace Database\Factories\Modules\Psychopedagogic\Models;

use App\Modules\Academic\Submodules\Students\Models\Student;
use App\Modules\Psychopedagogic\Enums\DiagnosticSeverity;
use App\Modules\Psychopedagogic\Models\Diagnostic;
use App\Modules\Psychopedagogic\Models\NeeCategory;
use App\Modules\System\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Diagnostic>
 */
class DiagnosticFactory extends Factory
{
    protected $model = Diagnostic::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'nee_category_id' => NeeCategory::factory(),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'severity' => $this->faker->randomElement([DiagnosticSeverity::Low, DiagnosticSeverity::Moderate, DiagnosticSeverity::High]),
            'detected_by' => User::factory(),
            'detected_at' => now()->toDateString(),
        ];
    }
}
