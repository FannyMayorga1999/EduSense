<?php

namespace App\Modules\Psychopedagogic\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\Administration\Services\AuditService;
use App\Modules\Psychopedagogic\Http\Requests\StoreDiagnosticRequest;
use App\Modules\Psychopedagogic\Models\Diagnostic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CRUD of diagnostics / NEE categorizations.
 */
class DiagnosticController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    /**
     * Paginated list of diagnostics.
     */
    public function index(Request $request): JsonResponse
    {
        $diagnostics = Diagnostic::query()
            ->with(['student:id,first_name,last_name', 'neeCategory:id,name', 'detector:id,name'])
            ->when($request->filled('student_id'), fn ($query) => $query->where('student_id', $request->integer('student_id')))
            ->when($request->filled('severity'), fn ($query) => $query->where('severity', $request->string('severity')->toString()))
            ->when($request->filled('nee_category_id'), fn ($query) => $query->where('nee_category_id', $request->integer('nee_category_id')))
            ->orderByDesc('detected_at')
            ->paginate($request->integer('per_page', 15));

        return $this->success($diagnostics);
    }

    /**
     * Creates a diagnostic manually.
     */
    public function store(StoreDiagnosticRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['detected_by'] = $request->user()->id;
        $data['detected_at'] ??= now()->toDateString();

        $diagnostic = Diagnostic::query()->create($data);

        $this->audit->record('diagnostics.create', 'psychopedagogic', ['diagnostic_id' => $diagnostic->id]);

        return $this->success($diagnostic, 'Diagnostic created.', 201);
    }

    /**
     * Returns a diagnostic.
     */
    public function show(Diagnostic $diagnostic): JsonResponse
    {
        return $this->success($diagnostic->load(['student:id,first_name,last_name', 'neeCategory:id,name']));
    }

    /**
     * Updates a diagnostic.
     */
    public function update(StoreDiagnosticRequest $request, Diagnostic $diagnostic): JsonResponse
    {
        $diagnostic->update($request->safe()->except(['student_id', 'detected_by']));

        $this->audit->record('diagnostics.update', 'psychopedagogic', ['diagnostic_id' => $diagnostic->id]);

        return $this->success($diagnostic, 'Diagnostic updated.');
    }

    /**
     * Deletes a diagnostic.
     */
    public function destroy(Diagnostic $diagnostic): JsonResponse
    {
        $diagnostic->delete();

        $this->audit->record('diagnostics.delete', 'psychopedagogic', ['diagnostic_id' => $diagnostic->id]);

        return $this->success(message: 'Diagnostic deleted.');
    }
}
