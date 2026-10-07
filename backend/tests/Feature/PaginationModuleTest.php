<?php

namespace Tests\Feature;

use App\Modules\Academic\Submodules\Students\Models\Student;
use App\Modules\System\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Pagination contract shared by every indexed list (page + per_page).
 */
class PaginationModuleTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        $this->admin = User::query()->where('email', 'admin@edusense.local')->firstOrFail();
    }

    public function test_per_page_respects_the_requested_limit(): void
    {
        Sanctum::actingAs($this->admin);
        Student::factory()->count(35)->create();

        $this->getJson('/api/v1/students?per_page=10')
            ->assertOk()
            ->assertJsonPath('data.per_page', 10)
            ->assertJsonPath('data.total', 35)
            ->assertJsonPath('data.last_page', 4)
            ->assertJsonCount(10, 'data.data');
    }

    public function test_page_index_navigates_the_result_set(): void
    {
        Sanctum::actingAs($this->admin);
        Student::factory()->count(35)->create();

        $this->getJson('/api/v1/students?per_page=10&page=2')
            ->assertOk()
            ->assertJsonPath('data.current_page', 2)
            ->assertJsonPath('data.from', 11)
            ->assertJsonPath('data.to', 20);
    }

    public function test_zero_per_page_returns_every_row(): void
    {
        Sanctum::actingAs($this->admin);
        Student::factory()->count(35)->create();

        $this->getJson('/api/v1/students?per_page=0')
            ->assertOk()
            ->assertJsonPath('data.per_page', 35)
            ->assertJsonPath('data.total', 35)
            ->assertJsonPath('data.last_page', 1)
            ->assertJsonPath('data.from', 1)
            ->assertJsonPath('data.to', 35)
            ->assertJsonCount(35, 'data.data');
    }

    public function test_per_page_is_capped_to_five_hundred(): void
    {
        Sanctum::actingAs($this->admin);
        Student::factory()->count(20)->create();

        $this->getJson('/api/v1/students?per_page=999')
            ->assertOk()
            ->assertJsonPath('data.per_page', 500)
            ->assertJsonCount(20, 'data.data');
    }
}
