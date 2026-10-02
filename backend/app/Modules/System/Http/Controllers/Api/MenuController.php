<?php

namespace App\Modules\System\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\System\Models\MenuItem;
use App\Modules\System\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * Navigation tree consumed by the frontend sidebar.
 *
 * Only the nodes the authenticated user may see are returned: nodes without
 * a permission slug are always visible, and branches whose children were all
 * filtered out are pruned. The administrator bypass is handled by
 * User::hasPermission().
 */
class MenuController extends Controller
{
    /**
     * Returns the permission-filtered navigation tree.
     */
    public function index(Request $request): JsonResponse
    {
        $items = MenuItem::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        $tree = $this->buildChildren($items->groupBy('parent_id'), null, $request->user());

        return $this->success($tree);
    }

    /**
     * Builds the visible children for the given parent node.
     *
     * @param  Collection<int, Collection<int, MenuItem>>  $grouped  all items keyed by parent_id
     * @return list<array{key: string, label_key: string, icon: ?string, route: ?string, children: list<mixed>}>
     */
    protected function buildChildren(Collection $grouped, ?int $parentId, User $user): array
    {
        $nodes = [];

        foreach ($grouped->get($parentId) ?? [] as $item) {
            if ($item->permission_slug !== null && ! $user->hasPermission($item->permission_slug)) {
                continue;
            }

            $children = $this->buildChildren($grouped, $item->id, $user);

            if ($item->route === null && $children === []) {
                continue;
            }

            $nodes[] = [
                'key' => $item->key,
                'label_key' => $item->label_key,
                'icon' => $item->icon,
                'route' => $item->route,
                'children' => $children,
            ];
        }

        return $nodes;
    }
}
