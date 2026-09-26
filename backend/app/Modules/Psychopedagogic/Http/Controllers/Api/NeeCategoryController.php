<?php

namespace App\Modules\Psychopedagogic\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\Administration\Services\AuditService;
use App\Modules\Psychopedagogic\Http\Requests\StoreNeeCategoryRequest;
use App\Modules\Psychopedagogic\Models\NeeCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CRUD of the NEE categories catalogue.
 */
class NeeCategoryController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    /**
     * Paginated list of categories.
     */
    public function index(Request $request): JsonResponse
    {
        $categories = $this->paginateQuery(
            $request,
            NeeCategory::query()
                ->withCount('diagnostics')
                ->when($request->filled('is_active'), fn ($query) => $query->where('is_active', $request->boolean('is_active')))
                ->orderBy('name')
        );

        return $this->success($categories);
    }

    /**
     * Creates a category.
     */
    public function store(StoreNeeCategoryRequest $request): JsonResponse
    {
        $category = NeeCategory::query()->create($request->validated());

        $this->audit->record('nee_categories.create', 'psychopedagogic', ['category_id' => $category->id]);

        return $this->success($category, 'Category created.', 201);
    }

    /**
     * Returns a category.
     */
    public function show(NeeCategory $category): JsonResponse
    {
        return $this->success($category);
    }

    /**
     * Updates a category.
     */
    public function update(StoreNeeCategoryRequest $request, NeeCategory $category): JsonResponse
    {
        $category->update($request->validated());

        $this->audit->record('nee_categories.update', 'psychopedagogic', ['category_id' => $category->id]);

        return $this->success($category, 'Category updated.');
    }

    /**
     * Deletes a category.
     */
    public function destroy(NeeCategory $category): JsonResponse
    {
        if ($category->diagnostics()->exists()) {
            return $this->error('Cannot delete a category in use by diagnostics.', 422);
        }

        $category->delete();

        $this->audit->record('nee_categories.delete', 'psychopedagogic', ['category_id' => $category->id]);

        return $this->success(message: 'Category deleted.');
    }
}
