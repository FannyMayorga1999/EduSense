<?php

namespace Tests\Feature;

use App\Modules\Academic\Models\AcademicTerm;
use App\Modules\Academic\Models\Course;
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
            'document_type' => 'cedula',
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
            'document_type' => 'cedula',
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
            'document_type' => 'cedula',
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

    public function test_student_can_be_created_with_profile_health_and_contact_fields(): void
    {
        Sanctum::actingAs($this->admin);

        $payload = [
            'first_name' => 'María',
            'last_name' => 'López',
            'birth_date' => '2016-07-22',
            'document_type' => 'dni',
            'document_number' => '1723456789',
            'gender' => 'female',
            'representative_name' => 'Carlos López',
            'representative_relation' => 'Padre',
            'contact_phone' => '0991234567',
            'contact_email' => 'carlos@example.com',
            'home_address' => 'Av. de la Prensa N43-12',
            'laterality' => 'left',
            'medical_conditions' => 'Asma leve, control pediátrico anual.',
        ];

        $this->postJson('/api/v1/students', $payload)
            ->assertCreated()
            ->assertJsonPath('data.document_type', 'dni')
            ->assertJsonPath('data.gender', 'female')
            ->assertJsonPath('data.representative_name', 'Carlos López')
            ->assertJsonPath('data.laterality', 'left')
            ->assertJsonPath('data.medical_conditions', 'Asma leve, control pediátrico anual.')
            ->assertJsonPath('data.academic_status', 'active');

        $this->assertDatabaseHas('std_students', [
            'document_number' => '1723456789',
            'contact_email' => 'carlos@example.com',
            'laterality' => 'left',
        ]);
    }

    public function test_document_type_and_gender_must_be_valid(): void
    {
        Sanctum::actingAs($this->admin);

        $invalid = [
            'first_name' => 'Rosa',
            'last_name' => 'Mora',
            'birth_date' => '2015-01-01',
            'document_type' => 'libreta',
            'document_number' => '1712345693',
            'gender' => 'otro',
        ];

        $this->postJson('/api/v1/students', $invalid)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['document_type', 'gender']);
    }

    public function test_academic_section_creates_an_enrollment_with_parallel(): void
    {
        Sanctum::actingAs($this->admin);

        $course = Course::factory()->create();
        $term = AcademicTerm::factory()->create();

        $this->postJson('/api/v1/students', [
            'first_name' => 'Pedro',
            'last_name' => 'Salas',
            'birth_date' => '2013-11-11',
            'document_type' => 'cedula',
            'document_number' => '1712345694',
            'course_id' => $course->id,
            'term_id' => $term->id,
            'parallel' => 'A',
            'academic_status' => 'active',
        ])->assertCreated();

        $this->assertDatabaseHas('aca_enrollments', [
            'course_id' => $course->id,
            'term_id' => $term->id,
            'parallel' => 'A',
            'status' => 'active',
        ]);
    }

    public function test_retired_academic_status_updates_the_enrollment(): void
    {
        Sanctum::actingAs($this->admin);

        $student = Student::factory()->create();
        $course = Course::factory()->create();
        $term = AcademicTerm::factory()->create();

        $this->putJson("/api/v1/students/{$student->id}", [
            'course_id' => $course->id,
            'term_id' => $term->id,
            'academic_status' => 'retired',
        ])->assertOk()
            ->assertJsonPath('data.academic_status', 'retired');

        $this->assertDatabaseHas('aca_enrollments', [
            'student_id' => $student->id,
            'term_id' => $term->id,
            'status' => 'retired',
        ]);
    }

    public function test_inactive_academic_status_marks_the_student_logically_deleted(): void
    {
        Sanctum::actingAs($this->admin);

        $student = Student::factory()->create();

        $this->putJson("/api/v1/students/{$student->id}", ['academic_status' => 'inactive'])
            ->assertOk()
            ->assertJsonPath('data.academic_status', 'inactive');

        $this->assertFalse($student->refresh()->is_active);
    }

    public function test_gender_survives_show_and_update(): void
    {
        Sanctum::actingAs($this->admin);

        $student = $this->postJson('/api/v1/students', [
            'first_name' => 'Camila',
            'last_name' => 'Ríos',
            'birth_date' => '2014-07-20',
            'document_type' => 'cedula',
            'document_number' => '1712345699',
            'gender' => 'female',
        ])->assertCreated()->json('data');

        $id = $student['id'];

        $this->getJson("/api/v1/students/{$id}")
            ->assertOk()
            ->assertJsonPath('data.gender', 'female');

        $this->putJson("/api/v1/students/{$id}", [
            'first_name' => 'Camila',
            'last_name' => 'Ríos',
            'document_number' => '1712345699',
            'gender' => 'female',
        ])->assertOk()->assertJsonPath('data.gender', 'female');

        $this->getJson("/api/v1/students/{$id}")
            ->assertOk()
            ->assertJsonPath('data.gender', 'female');
    }
}
