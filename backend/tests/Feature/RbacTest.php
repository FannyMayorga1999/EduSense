<?php

namespace Tests\Feature;

use App\Modules\Psychopedagogic\Models\Question;
use App\Modules\Psychopedagogic\Models\Survey;
use App\Modules\Students\Models\Student;
use App\Modules\System\Models\Role;
use App\Modules\System\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RbacTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_administrator_can_manage_users(): void
    {
        $admin = User::query()->where('email', 'admin@edusense.local')->firstOrFail();

        Sanctum::actingAs($admin);

        $this->getJson('/api/v1/users')->assertOk();
        $this->getJson('/api/v1/roles')->assertOk();
    }

    public function test_teacher_cannot_access_user_management(): void
    {
        $teacher = User::query()->where('email', 'profesor@edusense.local')->firstOrFail();

        Sanctum::actingAs($teacher);

        $this->getJson('/api/v1/users')->assertStatus(403);
        $this->getJson('/api/v1/roles')->assertStatus(403);
    }

    public function test_teacher_can_record_grades_but_not_import_them(): void
    {
        $teacher = User::query()->where('email', 'profesor@edusense.local')->firstOrFail();

        Sanctum::actingAs($teacher);

        $this->getJson('/api/v1/academic/grades')->assertOk();

        $csv = UploadedFile::fake()->createWithContent('grades.csv', "document_number,MAT1\n");

        $this->postJson('/api/v1/academic/grades/import', [
            'term_id' => 1,
            'separator' => ',',
            'file' => $csv,
        ])->assertStatus(403);
    }

    public function test_psychopedagogist_can_evaluate_students(): void
    {
        $psychopedagogist = User::query()->where('email', 'psicopedagogo@edusense.local')->firstOrFail();

        Sanctum::actingAs($psychopedagogist);

        $student = Student::factory()->create();
        $survey = Survey::factory()->create();
        $questions = Question::factory()->count(2)->create(['survey_id' => $survey->id]);

        $answers = $questions->mapWithKeys(fn ($q) => [$q->id => 5])->toArray();

        $this->postJson('/api/v1/psychopedagogic/evaluations', [
            'student_id' => $student->id,
            'survey_id' => $survey->id,
            'answers' => $answers,
        ])->assertCreated();
    }

    public function test_psychopedagogist_cannot_manage_users(): void
    {
        $psychopedagogist = User::query()->where('email', 'psicopedagogo@edusense.local')->firstOrFail();

        Sanctum::actingAs($psychopedagogist);

        $this->getJson('/api/v1/users')->assertStatus(403);
    }

    public function test_administrator_role_cannot_be_deleted(): void
    {
        $admin = User::query()->where('email', 'admin@edusense.local')->firstOrFail();

        Sanctum::actingAs($admin);

        $role = Role::query()->where('slug', 'administrator')->firstOrFail();

        $this->deleteJson("/api/v1/roles/{$role->id}")->assertStatus(422);
    }
}
