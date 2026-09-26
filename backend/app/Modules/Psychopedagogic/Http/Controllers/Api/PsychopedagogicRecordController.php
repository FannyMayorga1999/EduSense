<?php

namespace App\Modules\Psychopedagogic\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\Administration\Services\AuditService;
use App\Modules\Psychopedagogic\Http\Requests\StoreRecordRequest;
use App\Modules\Psychopedagogic\Http\Requests\UpdateRecordRequest;
use App\Modules\Psychopedagogic\Models\PsychopedagogicRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CRUD of the psychopedagogic records (fichas).
 */
class PsychopedagogicRecordController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    /**
     * Paginated list of records.
     */
    public function index(Request $request): JsonResponse
    {
        $records = $this->paginateQuery(
            $request,
            PsychopedagogicRecord::query()
                ->with(['student:id,first_name,last_name', 'registrar:id,name'])
                ->when($request->filled('student_id'), fn ($query) => $query->where('student_id', $request->integer('student_id')))
                ->when($request->string('search')->toString(), fn ($query, $search) => $query->where('title', 'like', "%{$search}%"))
                ->orderByDesc('recorded_at')
        );

        return $this->success($records);
    }

    /**
     * Creates a record.
     */
    public function store(StoreRecordRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['registered_by'] = $request->user()->id;
        $data['recorded_at'] ??= now()->toDateString();

        $record = PsychopedagogicRecord::query()->create($data);

        $this->audit->record('records.create', 'psychopedagogic', ['record_id' => $record->id]);

        return $this->success($record, 'Record created.', 201);
    }

    /**
     * Returns a record.
     */
    public function show(PsychopedagogicRecord $record): JsonResponse
    {
        return $this->success($record->load(['student:id,first_name,last_name', 'registrar:id,name']));
    }

    /**
     * Updates a record.
     */
    public function update(UpdateRecordRequest $request, PsychopedagogicRecord $record): JsonResponse
    {
        $record->update($request->validated());

        $this->audit->record('records.update', 'psychopedagogic', ['record_id' => $record->id]);

        return $this->success($record, 'Record updated.');
    }

    /**
     * Deletes a record.
     */
    public function destroy(PsychopedagogicRecord $record): JsonResponse
    {
        $record->delete();

        $this->audit->record('records.delete', 'psychopedagogic', ['record_id' => $record->id]);

        return $this->success(message: 'Record deleted.');
    }
}
