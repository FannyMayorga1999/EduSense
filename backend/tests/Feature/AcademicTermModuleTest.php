<?php

namespace Tests\Feature;

use App\Modules\Academic\Models\AcademicTerm;
use App\Modules\Academic\Models\Course;
use App\Modules\System\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * CRUD of the academic terms catalog.
 */
class AcademicTermModuleTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $teacher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);

        $this->admin = User::query()->where('email', 'admin@edusense.local')->firstOrFail();
        $this->teacher = User::query()->where('email', 'profesor@edusense.local')->firstOrFail();
    }

    public function test_admin_can_create_and_list_terms(): void
    {
        Sanctum::actingAs($this->admin);

        $this->postJson('/api/v1/academic/terms', [
            'name' => '2026-2027',
            'start_date' => '2026-09-01',
            'end_date' => '2027-08-31',
            'is_current' => true,
        ])->assertCreated()->assertJsonPath('data.name', '2026-2027');

        $this->getJson('/api/v1/academic/terms')
            ->assertOk()
            ->assertJsonPath('data.data.0.name', '2026-2027')
            ->assertJsonPath('data.data.0.is_current', true);
    }

    public function test_terms_list_can_filter_to_current_only(): void
    {
        Sanctum::actingAs($this->admin);

        AcademicTerm::factory()->create(['name' => '2025-2026']);
        AcademicTerm::factory()->current()->create(['name' => '2026-2027']);

        $this->getJson('/api/v1/academic/terms?current_only=1')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.name', '2026-2027');
    }

    public function test_end_date_must_not_precede_start_date(): void
    {
        Sanctum::actingAs($this->admin);

        $this->postJson('/api/v1/academic/terms', [
            'name' => '2026-2027',
            'start_date' => '2027-09-01',
            'end_date' => '2026-08-31',
        ])->assertUnprocessable()->assertJsonValidationErrors('end_date');
    }

    public function test_marking_a_term_current_clears_previous_one(): void
    {
        Sanctum::actingAs($this->admin);

        $old = AcademicTerm::factory()->current()->create(['name' => '2025-2026']);
        $next = AcademicTerm::factory()->create(['name' => '2026-2027']);

        $this->putJson("/api/v1/academic/terms/{$next->id}", ['is_current' => true])
            ->assertOk();

        $this->assertFalse($old->fresh()->is_current);
        $this->assertTrue($next->fresh()->is_current);
    }

    public function test_teacher_can_view_terms_but_not_manage_them(): void
    {
        Sanctum::actingAs($this->teacher);

        AcademicTerm::factory()->create(['name' => '2026-2027']);

        $this->getJson('/api/v1/academic/terms')->assertOk();

        $this->postJson('/api/v1/academic/terms', [
            'name' => '2027-2028',
            'start_date' => '2027-09-01',
            'end_date' => '2028-08-31',
        ])->assertForbidden();

        $term = AcademicTerm::query()->where('name', '2026-2027')->firstOrFail();

        $this->putJson("/api/v1/academic/terms/{$term->id}", ['name' => 'Rename'])->assertForbidden();
        $this->deleteJson("/api/v1/academic/terms/{$term->id}")->assertForbidden();
    }

    public function test_term_with_enrollments_cannot_be_deleted(): void
    {
        Sanctum::actingAs($this->admin);

        $term = AcademicTerm::factory()->create(['name' => '2026-2027']);
        $course = Course::factory()->create();

        $this->postJson('/api/v1/students', [
            'first_name' => 'Pedro',
            'last_name' => 'Salas',
            'birth_date' => '2013-11-11',
            'document_type' => 'cedula',
            'document_number' => '1712345678',
            'course_id' => $course->id,
            'term_id' => $term->id,
            'academic_status' => 'active',
        ])->assertCreated();

        $this->deleteJson("/api/v1/academic/terms/{$term->id}")
            ->assertUnprocessable();

        $this->assertDatabaseHas('aca_academic_terms', ['id' => $term->id]);
    }

    public function test_admin_can_delete_an_empty_term(): void
    {
        Sanctum::actingAs($this->admin);

        $term = AcademicTerm::factory()->create(['name' => '2026-2027']);

        $this->deleteJson("/api/v1/academic/terms/{$term->id}")
            ->assertOk();

        $this->assertDatabaseMissing('aca_academic_terms', ['id' => $term->id]);
    }
}
