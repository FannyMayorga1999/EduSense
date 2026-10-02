<?php

namespace Database\Seeders;

use App\Modules\System\Models\MenuItem;
use Illuminate\Database\Seeder;

/**
 * Registers the navigation tree served by the GET /menus endpoint.
 *
 * The nested array mirrors the sidebar sections; each node keeps a stable
 * unique `key` so the seed stays idempotent across runs.
 */
class MenuSeeder extends Seeder
{
    /**
     * The navigation tree: every node has a key, an i18n label key, an icon
     * from the frontend catalogue, an optional SPA route and permission slug.
     *
     * @var array<int, array<string, mixed>>
     */
    protected array $menu = [
        [
            'key' => 'section_general',
            'label_key' => 'menu.section_general',
            'icon' => null,
            'route' => null,
            'permission_slug' => null,
            'sort_order' => 1,
            'children' => [
                [
                    'key' => 'dashboard',
                    'label_key' => 'menu.dashboard',
                    'icon' => 'layout_dashboard',
                    'route' => '/',
                    'permission_slug' => null,
                    'sort_order' => 1,
                    'children' => [],
                ],
            ],
        ],
        [
            'key' => 'section_academic',
            'label_key' => 'menu.section_academic',
            'icon' => null,
            'route' => null,
            'permission_slug' => null,
            'sort_order' => 2,
            'children' => [
                [
                    'key' => 'students',
                    'label_key' => 'menu.students',
                    'icon' => 'users',
                    'route' => '/students',
                    'permission_slug' => 'view_students',
                    'sort_order' => 1,
                    'children' => [],
                ],
                [
                    'key' => 'terms',
                    'label_key' => 'menu.terms',
                    'icon' => 'calendar_days',
                    'route' => '/terms',
                    'permission_slug' => 'view_terms',
                    'sort_order' => 2,
                    'children' => [],
                ],
                [
                    'key' => 'schedule',
                    'label_key' => 'menu.schedule',
                    'icon' => 'calendar_check_2',
                    'route' => '/schedule',
                    'permission_slug' => 'view_schedules',
                    'sort_order' => 3,
                    'children' => [],
                ],
            ],
        ],
        [
            'key' => 'section_evaluation',
            'label_key' => 'menu.section_evaluation',
            'icon' => null,
            'route' => null,
            'permission_slug' => null,
            'sort_order' => 3,
            'children' => [
                [
                    'key' => 'surveys',
                    'label_key' => 'menu.surveys',
                    'icon' => 'clipboard_list',
                    'route' => '/surveys',
                    'permission_slug' => 'view_surveys',
                    'sort_order' => 1,
                    'children' => [],
                ],
            ],
        ],
        [
            'key' => 'section_system',
            'label_key' => 'menu.section_system',
            'icon' => null,
            'route' => null,
            'permission_slug' => null,
            'sort_order' => 4,
            'children' => [
                [
                    'key' => 'settings',
                    'label_key' => 'menu.settings',
                    'icon' => 'settings',
                    'route' => null,
                    'permission_slug' => null,
                    'sort_order' => 1,
                    'children' => [
                        [
                            'key' => 'users',
                            'label_key' => 'menu.users',
                            'icon' => 'users',
                            'route' => '/settings/users',
                            'permission_slug' => 'view_users',
                            'sort_order' => 1,
                            'children' => [],
                        ],
                        [
                            'key' => 'roles',
                            'label_key' => 'menu.roles',
                            'icon' => 'shield_check',
                            'route' => '/settings/roles',
                            'permission_slug' => 'manage_roles',
                            'sort_order' => 2,
                            'children' => [],
                        ],
                        [
                            'key' => 'ajustes',
                            'label_key' => 'menu.ajustes',
                            'icon' => 'sliders_horizontal',
                            'route' => '/settings/ajustes',
                            'permission_slug' => 'manage_settings',
                            'sort_order' => 3,
                            'children' => [],
                        ],
                    ],
                ],
            ],
        ],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach ($this->menu as $section) {
            $this->upsertBranch($section);
        }
    }

    /**
     * Upserts one node and recursively its children.
     *
     * @param  array<string, mixed>  $node
     */
    protected function upsertBranch(array $node, ?int $parentId = null): void
    {
        $item = MenuItem::query()->updateOrCreate(
            ['key' => $node['key']],
            [
                'parent_id' => $parentId,
                'label_key' => $node['label_key'],
                'icon' => $node['icon'],
                'route' => $node['route'],
                'permission_slug' => $node['permission_slug'],
                'sort_order' => $node['sort_order'],
                'is_active' => true,
            ],
        );

        foreach ($node['children'] ?? [] as $child) {
            $this->upsertBranch($child, $item->id);
        }
    }
}
