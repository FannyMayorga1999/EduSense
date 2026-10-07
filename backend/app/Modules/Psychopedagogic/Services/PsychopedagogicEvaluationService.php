<?php

namespace App\Modules\Psychopedagogic\Services;

use App\Modules\Academic\Submodules\Students\Models\Student;
use App\Modules\Psychopedagogic\Enums\DiagnosticSeverity;
use App\Modules\Psychopedagogic\Enums\EvaluationArea;
use App\Modules\Psychopedagogic\Enums\PlanStatus;
use App\Modules\Psychopedagogic\Events\EvaluationProcessed;
use App\Modules\Psychopedagogic\Models\CurricularAdaptationPlan;
use App\Modules\Psychopedagogic\Models\Diagnostic;
use App\Modules\Psychopedagogic\Models\EvaluationResponse;
use App\Modules\Psychopedagogic\Models\NeeCategory;
use App\Modules\Psychopedagogic\Models\PsychopedagogicRecord;
use App\Modules\Psychopedagogic\Models\Question;
use App\Modules\Psychopedagogic\Models\Survey;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Core domain logic of the psychopedagogic evaluations.
 */
class PsychopedagogicEvaluationService
{
    /**
     * Processes an evaluation: persists the responses, computes the alert
     * score per area, creates the record, the diagnostic (if needed) and a
     * curricular adaptation plan (if flagged).
     *
     * @param  array<string, int>  $answers  Problem -> option value
     * @return array{score: int, threshold: int, alerted: bool} of the applied survey
     */
    public function evaluate(Student $student, Survey $survey, int $evaluatorId, array $answers): array
    {
        return DB::transaction(function () use ($student, $survey, $evaluatorId, $answers) {
            $questions = Question::query()->where('survey_id', $survey->id)->get();

            $totalWeight = 0;
            $obtained = 0;

            foreach ($questions as $question) {
                $value = (int) ($answers[$question->id] ?? 1);

                $totalWeight += $question->alert_weight;
                $obtained += $value * $question->alert_weight;

                EvaluationResponse::query()->create([
                    'student_id' => $student->id,
                    'question_id' => $question->id,
                    'evaluator_id' => $evaluatorId,
                    'option_value' => $value,
                    'application_date' => now()->toDateString(),
                ]);
            }

            $score = $totalWeight > 0 ? (int) round(($obtained / $totalWeight - 1) / 4 * 100) : 0;
            $threshold = $survey->evaluation_area->alertThreshold();
            $alerted = $score >= $threshold;

            $this->createRecord($student, $survey, $evaluatorId, $score, $alerted);

            if ($alerted) {
                $severity = $score >= $threshold + 10
                    ? DiagnosticSeverity::High
                    : ($score >= $threshold + 5 ? DiagnosticSeverity::Moderate : DiagnosticSeverity::Low);

                $this->createDiagnosticAndPlan($student, $survey, $evaluatorId, $severity, $score);
            }

            EvaluationProcessed::dispatch($student, $survey, $score, $threshold, $alerted, $evaluatorId);

            return [
                'score' => $score,
                'threshold' => $threshold,
                'alerted' => $alerted,
            ];
        });
    }

    /**
     * Creates the psychopedagogic record summarizing the evaluation.
     */
    protected function createRecord(Student $student, Survey $survey, int $evaluatorId, int $score, bool $alerted): void
    {
        PsychopedagogicRecord::query()->create([
            'student_id' => $student->id,
            'title' => "Evaluation - {$survey->title}",
            'description' => sprintf(
                'Score %d%% in area [%s]. %s',
                $score,
                $survey->evaluation_area->value,
                $alerted ? 'Alert threshold reached.' : 'Within expected range.'
            ),
            'registered_by' => $evaluatorId,
            'recorded_at' => now()->toDateString(),
        ]);
    }

    /**
     * Creates the diagnostic row and (if none active) a curricular plan.
     */
    protected function createDiagnosticAndPlan(Student $student, Survey $survey, int $evaluatorId, DiagnosticSeverity $severity, int $score): void
    {
        $category = NeeCategory::query()->firstOrCreate(
            ['code' => 'NEE-'.strtoupper($survey->evaluation_area->value)],
            [
                'name' => "{$survey->evaluation_area->label()} support",
                'is_active' => true,
            ]
        );

        $diagnostic = Diagnostic::query()->create([
            'student_id' => $student->id,
            'nee_category_id' => $category->id,
            'title' => "{$survey->evaluation_area->label()} alert",
            'description' => "Alert detected in {$survey->title} with score {$score}%.",
            'severity' => $severity,
            'detected_by' => $evaluatorId,
            'detected_at' => now()->toDateString(),
        ]);

        $hasActivePlan = CurricularAdaptationPlan::query()
            ->where('student_id', $student->id)
            ->where('status', PlanStatus::Active)
            ->exists();

        if (! $hasActivePlan) {
            CurricularAdaptationPlan::query()->create([
                'student_id' => $student->id,
                'title' => "Support plan - {$survey->evaluation_area->label()}",
                'objective' => 'Focused reinforcement through scheduled activities.',
                'start_date' => now()->toDateString(),
                'status' => PlanStatus::Active,
                'created_by' => $evaluatorId,
            ]);
        }

        // Keeps the diagnostic reachable via the relation.
        $diagnostic->refresh();
    }

    /**
     * Latest evaluation summary of a student grouped by area.
     *
     * @return Collection<int, object{area: string, score: float}> with latest application
     */
    public function studentSummary(int $studentId): Collection
    {
        return DB::table('psy_evaluation_responses as er')
            ->join('psy_questions as q', 'q.id', '=', 'er.question_id')
            ->join('psy_surveys as s', 's.id', '=', 'q.survey_id')
            ->where('er.student_id', $studentId)
            ->selectRaw('s.evaluation_area as area, AVG(er.option_value) as avg_value')
            ->groupBy('s.evaluation_area')
            ->get()
            ->map(fn ($row) => (object) [
                'area' => $row->area,
                'score' => round((((float) $row->avg_value - 1) / 4) * 100, 1),
            ]);
    }

    /**
     * Dashboard KPIs and the latest evaluation of each student.
     *
     * @return array<string, mixed>
     */
    public function dashboardSummary(): array
    {
        $students = Student::query()
            ->where('is_active', true)
            ->with(['enrollments' => fn ($query) => $query->with('course:id,name')])
            ->withCount(['interventionSchedules as pending_sessions_count' => function ($query) {
                $query->where('status', 'pending');
            }])
            ->orderBy('last_name')
            ->get();

        return [
            'total_students' => $students->count(),
            'evaluated_students' => EvaluationResponse::query()->distinct('student_id')->count('student_id'),
            'pending_sessions_today' => DB::table('psy_intervention_schedules')
                ->where('scheduled_date', now()->toDateString())
                ->where('status', 'pending')
                ->count(),
            'active_plans' => CurricularAdaptationPlan::query()
                ->where('status', PlanStatus::Active)
                ->count(),
            'active_alerts' => Diagnostic::query()->distinct('student_id')->count('student_id'),
            'students' => $students->map(function (Student $student): array {
                $latest = $this->latestAreaSummary($student);

                return [
                    'id' => $student->id,
                    'full_name' => $student->full_name,
                    'document_number' => $student->document_number,
                    'grade' => $student->enrollments->first()?->course?->name,
                    'last_area' => $latest['area']->value ?? null,
                    'area_label' => isset($latest['area']) ? $latest['area']->label() : null,
                    'score' => $latest['score'] ?? 0,
                    'threshold' => $latest['threshold'] ?? null,
                    'alerted' => $latest['alerted'] ?? false,
                    'pending_sessions' => (int) $student->pending_sessions_count,
                ];
            })->all(),
        ];
    }

    /**
     * Latest area, score and alert state of a single student.
     *
     * @return array{area: EvaluationArea, score: int, threshold: int, alerted: bool}|null
     */
    protected function latestAreaSummary(Student $student): ?array
    {
        $latest = DB::table('psy_evaluation_responses as er')
            ->join('psy_questions as q', 'q.id', '=', 'er.question_id')
            ->join('psy_surveys as s', 's.id', '=', 'q.survey_id')
            ->where('er.student_id', $student->id)
            ->selectRaw('MAX(er.application_date) as last_date')
            ->addSelect('s.evaluation_area as area')
            ->addSelect('s.id as survey_id')
            ->groupBy('s.id', 's.evaluation_area')
            ->orderByDesc('last_date')
            ->orderBy('survey_id')
            ->first();

        if ($latest === null) {
            return null;
        }

        $scoreRow = DB::table('psy_evaluation_responses as er')
            ->join('psy_questions as q', 'q.id', '=', 'er.question_id')
            ->where('er.student_id', $student->id)
            ->where('q.survey_id', $latest->survey_id)
            ->where('er.application_date', $latest->last_date)
            ->selectRaw('SUM(q.alert_weight) as total_weight, SUM(q.alert_weight * er.option_value) as obtained')
            ->first();

        $area = EvaluationArea::from($latest->area);
        $totalWeight = (float) $scoreRow->total_weight;
        $score = $totalWeight > 0
            ? (int) round((($scoreRow->obtained / $totalWeight) - 1) / 4 * 100)
            : 0;
        $threshold = $area->alertThreshold();

        return [
            'area' => $area,
            'score' => $score,
            'threshold' => $threshold,
            'alerted' => $score >= $threshold,
        ];
    }
}
