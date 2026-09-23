<?php

namespace Tests\Feature;

use App\Modules\Students\Models\Student;
use App\Modules\System\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StudentModuleTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);

        $this->admin = User::query()->where('email', 'admin@edusense.local')->firstOrFail();
    }

    public function test_admin_can_create_and_list_students(): void
    {
        Sanctum::actingAs($this->admin);

        $payload = [
            'first_name' => 'Ana',
            'last_name' => 'Torres',
            'birth_date' => '2015-05-10',
            'document_number' => '1712345690',
        ];

        $this->postJson('/api/v1/students', $payload)
            ->assertCreated()
            ->assertJsonPath('data.first_name', 'Ana');

        $this->getJson('/api/v1/students?search=Torres')
            ->assertOk()
            ->assertSee('Ana');
    }

    public function test_student_document_must_be_unique(): void
    {
        Sanctum::actingAs($this->admin);

        Student::factory()->create(['document_number' => '1712345691']);

        $this->postJson('/api/v1/students', [
            'first_name' => 'Luis',
            'last_name' => 'Paz',
            'birth_date' => '2014-03-03',
            'document_number' => '1712345691',
        ])->assertStatus(422);
    }

    public function test_teacher_can_view_but_not_create_students(): void
    {
        $teacher = User::query()->where('email', 'profesor@edusense.local')->firstOrFail();

        Sanctum::actingAs($teacher);

        $this->getJson('/api/v1/students')->assertOk();

        $this->postJson('/api/v1/students', [
            'first_name' => 'Luis',
            'last_name' => 'Paz',
            'birth_date' => '2014-03-03',
            'document_number' => '1712345692',
        ])->assertStatus(403);
    }

    public function test_student_can_be_updated_and_deactivated(): void
    {
        Sanctum::actingAs($this->admin);

        $student = Student::factory()->create();

        $this->putJson("/api/v1/students/{$student->id}", ['first_name' => 'Camila'])
            ->assertOk()
            ->assertJsonPath('data.first_name', 'Camila');

        $this->deleteJson("/api/v1/students/{$student->id}")->assertOk();

        $this->assertFalse($student->refresh()->is_active);
    }
}
