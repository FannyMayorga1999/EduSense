<?php

namespace App\Modules\Psychopedagogic\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\Administration\Services\AuditService;
use App\Modules\Psychopedagogic\Http\Requests\StoreSurveyRequest;
use App\Modules\Psychopedagogic\Http\Requests\UpdateSurveyRequest;
use App\Modules\Psychopedagogic\Models\Question;
use App\Modules\Psychopedagogic\Models\Survey;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CRUD of psychopedagogic surveys and their questions.
 */
class SurveyController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    /**
     * Paginated list of surveys with question count.
     */
    public function index(Request $request): JsonResponse
    {
        $surveys = $this->paginateQuery(
            $request,
            Survey::query()
                ->withCount('questions')
                ->when($request->filled('evaluation_area'), fn ($query) => $query->where('evaluation_area', $request->string('evaluation_area')->toString()))
                ->when($request->filled('is_active'), fn ($query) => $query->where('is_active', $request->boolean('is_active')))
                ->orderBy('title')
        );

        return $this->success($surveys);
    }

    /**
     * Creates a survey with its questions.
     */
    public function store(StoreSurveyRequest $request): JsonResponse
    {
        $data = $request->safe()->except(['questions']);

        $survey = Survey::query()->create($data);

        foreach ($request->input('questions') as $question) {
            $survey->questions()->create([
                'statement' => $question['statement'],
                'alert_weight' => $question['alert_weight'] ?? 1,
            ]);
        }

        $this->audit->record('surveys.create', 'psychopedagogic', ['survey_id' => $survey->id]);

        return $this->success($survey->load('questions'), 'Survey created.', 201);
    }

    /**
     * Returns a survey with its questions.
     */
    public function show(Survey $survey): JsonResponse
    {
        return $this->success($survey->load('questions'));
    }

    /**
     * Updates a survey and syncs its question bank.
     */
    public function update(UpdateSurveyRequest $request, Survey $survey): JsonResponse
    {
        $survey->update($request->safe()->except(['questions', 'deleted_questions']));

        if ($request->filled('deleted_questions')) {
            Question::query()->whereIn('id', $request->input('deleted_questions'))->delete();
        }

        foreach ($request->input('questions', []) as $question) {
            if (isset($question['id'])) {
                Question::query()->where('id', $question['id'])->update([
                    'statement' => $question['statement'],
                    'alert_weight' => $question['alert_weight'] ?? 1,
                ]);
            } else {
                $survey->questions()->create([
                    'statement' => $question['statement'],
                    'alert_weight' => $question['alert_weight'] ?? 1,
                ]);
            }
        }

        $this->audit->record('surveys.update', 'psychopedagogic', ['survey_id' => $survey->id]);

        return $this->success($survey->load('questions'), 'Survey updated.');
    }

    /**
     * Deletes a survey (cascade removes its questions).
     */
    public function destroy(Survey $survey): JsonResponse
    {
        $survey->questions()->delete();
        $survey->delete();

        $this->audit->record('surveys.delete', 'psychopedagogic', ['survey_id' => $survey->id]);

        return $this->success(message: 'Survey deleted.');
    }
}
