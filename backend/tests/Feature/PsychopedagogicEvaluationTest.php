<?php

namespace Tests\Feature;

use App\Modules\Psychopedagogic\Models\Activity;
use App\Modules\Psychopedagogic\Models\Question;
use App\Modules\Psychopedagogic\Models\Survey;
use App\Modules\Students\Models\Student;
use App\Modules\System\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PsychopedagogicEvaluationTest extends TestCase
{
    use RefreshDatabase;

    private User $psychopedagogist;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);

        $this->psychopedagogist = User::query()->where('email', 'psicopedagogo@edusense.local')->firstOrFail();
    }

    public function test_evaluation_with_alert_state_creates_record_diagnostic_and_plan(): void
    {
        Sanctum::actingAs($this->psychopedagogist);

        $student = Student::factory()->create();
        $survey = Survey::factory()->create();
        $questions = Question::factory()->count(2)->create(['survey_id' => $survey->id]);

        $answers = $questions->mapWithKeys(fn ($q) => [$q->id => 5])->toArray();

        $this->postJson('/api/v1/psychopedagogic/evaluations', [
            'student_id' => $student->id,
            'survey_id' => $survey->id,
            'answers' => $answers,
        ])
            ->assertCreated()
            ->assertJsonPath('data.alerted', true);

        $this->assertEquals(2, $student->evaluationResponses()->count());
        $this->assertEquals(1, $student->psychopedagogicRecords()->count());
        $this->assertEquals(1, $student->diagnostics()->count());
        $this->assertEquals(1, $student->curricularPlans()->count());
    }

    public function test_evaluation_without_alert_only_records_responses(): void
    {
        Sanctum::actingAs($this->psychopedagogist);

        $student = Student::factory()->create();
        $survey = Survey::factory()->create();
        $questions = Question::factory()->count(2)->create(['survey_id' => $survey->id]);

        $answers = $questions->mapWithKeys(fn ($q) => [$q->id => 1])->toArray();

        $this->postJson('/api/v1/psychopedagogic/evaluations', [
            'student_id' => $student->id,
            'survey_id' => $survey->id,
            'answers' => $answers,
        ])
            ->assertCreated()
            ->assertJsonPath('data.alerted', false);

        $this->assertEquals(0, $student->diagnostics()->count());
        $this->assertEquals(0, $student->curricularPlans()->count());
    }

    public function test_survey_management_requires_create_permission(): void
    {
        Sanctum::actingAs($this->psychopedagogist);

        $this->postJson('/api/v1/psychopedagogic/surveys', [
            'title' => 'Atención inicial',
            'evaluation_area' => 'attention',
            'questions' => [
                ['statement' => 'Mantiene la atención en clase.', 'alert_weight' => 1],
            ],
        ])
            ->assertCreated();

        $teacher = User::query()->where('email', 'profesor@edusense.local')->firstOrFail();

        Sanctum::actingAs($teacher);

        $this->postJson('/api/v1/psychopedagogic/surveys', [
            'title' => 'Prohibido',
            'evaluation_area' => 'attention',
            'questions' => [['statement' => 'X', 'alert_weight' => 1]],
        ])->assertStatus(403);
    }

    public function test_schedule_can_be_created_and_completed(): void
    {
        Sanctum::actingAs($this->psychopedagogist);

        $student = Student::factory()->create();
        $activity = Activity::factory()->create();

        $response = $this->postJson('/api/v1/psychopedagogic/schedules', [
            'student_id' => $student->id,
            'activity_id' => $activity->id,
            'scheduled_date' => now()->addDay()->toDateString(),
        ])->assertCreated();

        $scheduleId = $response->json('data.id');

        $this->putJson("/api/v1/psychopedagogic/schedules/{$scheduleId}", [
            'status' => 'completed',
            'progress_notes' => 'Good progress.',
        ])->assertOk();

        $this->assertDatabaseHas('psy_intervention_schedules', [
            'id' => $scheduleId,
            'status' => 'completed',
        ]);
    }
}
