<?php

namespace Tests\Feature;

use App\Modules\System\Models\MenuItem;
use App\Modules\System\Models\User;
use Database\Seeders\MenuSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MenuIndexTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        $this->seed(MenuSeeder::class);
    }

    public function test_administrator_sees_the_full_tree(): void
    {
        Sanctum::actingAs($this->user('admin@edusense.local'));

        $response = $this->getJson('/api/v1/menus')->assertOk();

        $keys = $this->topKeys($response->json('data'));

        $this->assertSame(['section_general', 'section_academic', 'section_evaluation', 'section_system'], $keys);

        $system = collect($response->json('data'))->firstWhere('key', 'section_system');
        $settings = collect($system['children'])->firstWhere('key', 'settings');

        $this->assertSame(['users', 'roles', 'ajustes'], $this->collectKeys($settings['children']));
    }

    public function test_teacher_gets_only_the_permitted_sections(): void
    {
        Sanctum::actingAs($this->user('profesor@edusense.local'));

        $response = $this->getJson('/api/v1/menus')->assertOk();

        $keys = $this->topKeys($response->json('data'));

        $this->assertSame(['section_general', 'section_academic'], $keys);
    }

    public function test_inactive_nodes_are_filtered_out(): void
    {
        Sanctum::actingAs($this->user('admin@edusense.local'));

        MenuItem::query()->where('key', 'surveys')->update(['is_active' => false]);

        $response = $this->getJson('/api/v1/menus')->assertOk();

        $keys = $this->collectKeys($response->json('data'));

        $this->assertContains('section_system', $keys);
        $this->assertNotContains('section_evaluation', $keys);
        $this->assertNotContains('surveys', $keys);
    }

    public function test_branch_without_visible_children_is_pruned(): void
    {
        Sanctum::actingAs($this->user('admin@edusense.local'));

        MenuItem::query()->whereIn('key', ['users', 'roles', 'ajustes'])->update(['is_active' => false]);

        $response = $this->getJson('/api/v1/menus')->assertOk();

        $keys = $this->collectKeys($response->json('data'));

        $this->assertNotContains('section_system', $keys);
        $this->assertNotContains('settings', $keys);
    }

    public function test_guest_is_rejected(): void
    {
        $this->getJson('/api/v1/menus')->assertStatus(401);
    }

    /**
     * Fetches the seeded user by email.
     */
    protected function user(string $email): User
    {
        return User::query()->where('email', $email)->firstOrFail();
    }

    /**
     * Collects the keys of the tree (recursively).
     *
     * @param  array<int, array<string, mixed>>|null  $nodes
     * @return list<string>
     */
    protected function collectKeys(?array $nodes): array
    {
        $keys = [];

        foreach ($nodes ?? [] as $node) {
            $keys[] = $node['key'];
            $keys = [...$keys, ...$this->collectKeys($node['children'] ?? [])];
        }

        return $keys;
    }

    /**
     * Collects the keys of the top-level nodes only.
     *
     * @param  array<int, array<string, mixed>>|null  $nodes
     * @return list<string>
     */
    protected function topKeys(?array $nodes): array
    {
        return array_map(fn (array $node) => $node['key'], $nodes ?? []);
    }
}
