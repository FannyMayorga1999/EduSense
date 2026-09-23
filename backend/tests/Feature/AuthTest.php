<?php

namespace Tests\Feature;

use App\Modules\System\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $response = $this->postJson('/api/v1/login', [
            'email' => 'admin@edusense.local',
            'password' => 'edusense-2026',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.email', 'admin@edusense.local');
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/v1/login', [
            'email' => 'admin@edusense.local',
            'password' => 'wrong-password',
        ]);

        $response->assertUnauthorized()
            ->assertJsonPath('success', false);
    }

    public function test_login_is_throttled_after_five_failed_attempts(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/login', [
                'email' => 'admin@edusense.local',
                'password' => 'wrong-password',
            ]);
        }

        $this->postJson('/api/v1/login', [
            'email' => 'admin@edusense.local',
            'password' => 'wrong-password',
        ])->assertStatus(429);
    }

    public function test_authenticated_user_can_fetch_their_profile(): void
    {
        $admin = User::query()->where('email', 'admin@edusense.local')->firstOrFail();

        Sanctum::actingAs($admin);

        $this->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('data.email', 'admin@edusense.local')
            ->assertJsonPath('data.roles', fn ($roles) => in_array('administrator', $roles, true));
    }

    public function test_deactivated_user_is_rejected(): void
    {
        $user = User::factory()->inactive()->create();

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/me')->assertStatus(403);
    }

    public function test_guest_is_unauthenticated(): void
    {
        $this->getJson('/api/v1/me')->assertStatus(401);
    }
}
