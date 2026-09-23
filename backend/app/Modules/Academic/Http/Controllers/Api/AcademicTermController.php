<?php

namespace App\Modules\Academic\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\Academic\Http\Requests\StoreAcademicTermRequest;
use App\Modules\Academic\Http\Requests\UpdateAcademicTermRequest;
use App\Modules\Academic\Models\AcademicTerm;
use App\Modules\Administration\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CRUD of academic terms (periods).
 */
class AcademicTermController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    /**
     * Paginated list of terms (marks the current one).
     */
    public function index(Request $request): JsonResponse
    {
        $terms = AcademicTerm::query()
            ->withCount('enrollments')
            ->when($request->boolean('current_only'), fn ($query) => $query->where('is_current', true))
            ->orderByDesc('start_date')
            ->paginate($request->integer('per_page', 15));

        return $this->success($terms);
    }

    /**
     * Creates a term, optionally switching the current marker.
     */
    public function store(StoreAcademicTermRequest $request): JsonResponse
    {
        $term = AcademicTerm::query()->create($request->validated());

        if ($request->boolean('is_current')) {
            $this->markCurrent($term);
        }

        $this->audit->record('terms.create', 'academic', ['term_id' => $term->id]);

        return $this->success($term, 'Term created.', 201);
    }

    /**
     * Returns a term.
     */
    public function show(AcademicTerm $term): JsonResponse
    {
        return $this->success($term);
    }

    /**
     * Updates a term.
     */
    public function update(UpdateAcademicTermRequest $request, AcademicTerm $term): JsonResponse
    {
        $term->update($request->validated());

        if ($request->boolean('is_current')) {
            $this->markCurrent($term);
        }

        $this->audit->record('terms.update', 'academic', ['term_id' => $term->id]);

        return $this->success($term, 'Term updated.');
    }

    /**
     * Deletes a term.
     */
    public function destroy(AcademicTerm $term): JsonResponse
    {
        if ($term->enrollments()->exists() || $term->grades()->exists()) {
            return $this->error('Cannot delete a term with enrollments or grades.', 422);
        }

        $term->delete();

        $this->audit->record('terms.delete', 'academic', ['term_id' => $term->id]);

        return $this->success(message: 'Term deleted.');
    }

    /**
     * Saves the current term marker (single current term).
     */
    protected function markCurrent(AcademicTerm $term): void
    {
        AcademicTerm::query()->where('id', '!=', $term->id)->update(['is_current' => false]);
        $term->update(['is_current' => true]);
    }
}
