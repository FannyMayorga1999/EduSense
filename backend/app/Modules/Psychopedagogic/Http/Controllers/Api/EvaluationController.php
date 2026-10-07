<?php

namespace App\Modules\Psychopedagogic\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\Academic\Submodules\Students\Models\Student;
use App\Modules\Administration\Services\AuditService;
use App\Modules\Psychopedagogic\Http\Requests\EvaluateStudentRequest;
use App\Modules\Psychopedagogic\Models\EvaluationResponse;
use App\Modules\Psychopedagogic\Models\Survey;
use App\Modules\Psychopedagogic\Services\PsychopedagogicEvaluationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Evaluation processing and results summary.
 */
class EvaluationController extends Controller
{
    public function __construct(
        private readonly PsychopedagogicEvaluationService $service,
        private readonly AuditService $audit,
    ) {}

    /**
     * Applies a survey to a student and returns the resulting score.
     */
    public function evaluate(EvaluateStudentRequest $request): JsonResponse
    {
        $student = Student::query()->findOrFail($request->integer('student_id'));
        $survey = Survey::query()->findOrFail($request->integer('survey_id'));

        if (! $survey->is_active) {
            return $this->error('The survey is not active.', 422);
        }

        $result = $this->service->evaluate(
            $student,
            $survey,
            $request->user()->id,
            $request->input('answers'),
        );

        $this->audit->record('evaluations.process', 'psychopedagogic', [
            'student_id' => $student->id,
            'survey_id' => $survey->id,
            ...$result,
        ]);

        $status = $result['alerted'] ? 'Alert detected, record and support plan generated.' : 'Evaluation processed without alert.';

        return $this->success($result, $status, 201);
    }

    /**
     * Latest score summary of a student per area.
     */
    public function studentSummary(Request $request, Student $student): JsonResponse
    {
        return $this->success($this->service->studentSummary($student->id));
    }

    /**
     * Latest evaluations history of a student.
     */
    public function history(Request $request, Student $student): JsonResponse
    {
        $history = EvaluationResponse::query()
            ->with(['question:id,statement', 'question.survey:id,title,evaluation_area'])
            ->where('student_id', $student->id)
            ->orderByDesc('application_date')
            ->get()
            ->groupBy('application_date');

        return $this->success($history);
    }
}
