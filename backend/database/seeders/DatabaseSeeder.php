<?php

namespace Database\Seeders;

use App\Modules\Academic\Models\AcademicTerm;
use App\Modules\Academic\Models\Attendance;
use App\Modules\Academic\Models\Course;
use App\Modules\Academic\Models\Enrollment;
use App\Modules\Academic\Models\Grade;
use App\Modules\Academic\Models\Subject;
use App\Modules\Psychopedagogic\Enums\EvaluationArea;
use App\Modules\Psychopedagogic\Models\Activity;
use App\Modules\Psychopedagogic\Models\EvaluationResponse;
use App\Modules\Psychopedagogic\Models\InterventionSchedule;
use App\Modules\Psychopedagogic\Models\Question;
use App\Modules\Psychopedagogic\Models\Survey;
use App\Modules\Psychopedagogic\Services\PsychopedagogicEvaluationService;
use App\Modules\Students\Models\Student;
use App\Modules\System\Models\User;
use Illuminate\Database\Seeder;

/**
 * Populates demo data for every business module.
 */
class DatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call(RolePermissionSeeder::class);
        $this->call(MenuSeeder::class);

        $this->createActivities();
        $this->createSurveysWithQuestions();
        $this->createAcademicStructure();

        [$evaluator, $students] = $this->createStudents();

        $service = app(PsychopedagogicEvaluationService::class);

        $this->evaluate($service, $evaluator, $students[0], 'atencion', [5, 5, 5, 5, 4], true);
        $this->evaluate($service, $evaluator, $students[1], 'lectoescritura', [3, 2, 3, 2, 4], true);
        $this->evaluate($service, $evaluator, $students[2], 'calculo', [2, 2, 1, 2, 1], false);
        $this->evaluate($service, $evaluator, $students[3], 'motor', [2, 2, 3, 2, 2], false);
        $this->evaluate($service, $evaluator, $students[4], 'lectoescritura', [2, 1, 2, 1, 3], true);
        $this->evaluate($service, $evaluator, $students[5], 'calculo', [2, 2, 2, 1, 2], false);

        $this->fillAcademicData($students);
    }

    /**
     * The activity catalogue per evaluation area.
     *
     * @return array<string, array<int, array{string, string, string, int}>>
     */
    protected function activityCatalogue(): array
    {
        return [
            EvaluationArea::ReadingWriting->value => [
                ['Guided loud reading', 'Reading of a short story with immediate teacher feedback.', 'medium', 25],
                ['Simple sentence writing', 'Guided writing of sentences with visual support and templates.', 'low', 20],
                ['Syllables and rhymes game', 'Playful activity to strengthen phonological awareness.', 'high', 30],
            ],
            EvaluationArea::Math->value => [
                ['Addition problems', 'Progressive addition exercises with concrete material.', 'medium', 25],
                ['Number-quantity association', 'Relating numbers with collections of manipulative objects.', 'low', 20],
                ['Number series and patterns', 'Completing numeric sequences with manipulative support.', 'high', 30],
            ],
            EvaluationArea::Attention->value => [
                ['Visual pairs memory', 'Visual memory game to promote sustained concentration.', 'low', 20],
                ['Instruction following', 'Sequenced command execution exercises.', 'medium', 25],
                ['Self-regulation breaks', 'Mindfulness and guided breathing techniques.', 'high', 15],
            ],
            EvaluationArea::Motor->value => [
                ['Tracing and graphomotor', 'Tracing sheets, curves and figures for fine motor skills.', 'medium', 25],
                ['Precision crafts', 'Cutting, stringing and modeling for coordination.', 'low', 30],
                ['Balance circuit', 'Gross motor activities and body coordination.', 'high', 35],
            ],
        ];
    }

    /**
     * The question statements by area.
     *
     * @return array<string, array<int, string>>
     */
    protected function questionsByArea(): array
    {
        return [
            EvaluationArea::ReadingWriting->value => [
                'Identifies the alphabet letters fluently.',
                'Reads two-syllable words without visual support.',
                'Writes its first and last name correctly.',
                'Understands short texts read aloud.',
                'Maintains an adequate reading speed for its age.',
            ],
            EvaluationArea::Math->value => [
                'Solves two-digit additions with concrete material.',
                'Identifies and orders numbers up to 100.',
                'Understands the positional value of digits.',
                'Solves simple subtraction problems.',
                'Recognizes basic geometric shapes.',
            ],
            EvaluationArea::Attention->value => [
                'Maintains attention during 15 minute activities.',
                'Follows instructions with two or more steps.',
                'Completes tasks without getting distracted easily.',
                'Listens actively during class.',
                'Regulates impulses in group activities.',
            ],
            EvaluationArea::Motor->value => [
                'Shows firm and controlled tracing.',
                'Coordinates fine pinch movements when writing.',
                'Cuts following the outline.',
                'Keeps body balance in circuits.',
                'Coordinates arms and legs in motor activities.',
            ],
        ];
    }

    /**
     * Creates the intervention activity catalogue.
     */
    protected function createActivities(): void
    {
        foreach ($this->activityCatalogue() as $category => $items) {
            foreach ($items as [$title, $description, $level, $duration]) {
                Activity::query()->firstOrCreate(
                    ['title' => $title],
                    [
                        'description' => $description,
                        'category' => $category,
                        'difficulty_level' => $level,
                        'duration_minutes' => $duration,
                        'is_active' => true,
                    ],
                );
            }
        }
    }

    /**
     * Creates one survey per area with five questions.
     */
    protected function createSurveysWithQuestions(): void
    {
        foreach (EvaluationArea::cases() as $area) {
            $survey = Survey::query()->firstOrCreate(
                ['title' => "Survey - {$area->label()}", 'evaluation_area' => $area->value],
                [
                    'description' => "Initial evaluation of the {$area->label()} area.",
                    'is_active' => true,
                ],
            );

            foreach ($this->questionsByArea()[$area->value] ?? [] as $statement) {
                Question::query()->firstOrCreate(
                    ['survey_id' => $survey->id, 'statement' => $statement],
                    ['alert_weight' => 1],
                );
            }
        }
    }

    /**
     * Creates courses, current term and subjects.
     */
    protected function createAcademicStructure(): void
    {
        $currentYear = now()->year;

        foreach ([$currentYear - 2, $currentYear - 1, $currentYear, $currentYear + 1] as $year) {
            $name = $year.'-'.($year + 1);

            $term = AcademicTerm::query()->firstOrCreate(
                ['name' => $name],
                [
                    'start_date' => "{$year}-09-01",
                    'end_date' => ($year + 1).'-08-31',
                    'is_current' => $year === $currentYear,
                ],
            );

            if ($year === $currentYear) {
                AcademicTerm::query()->whereKeyNot($term->id)->update(['is_current' => false]);
                $term->update(['is_current' => true]);
            }
        }

        $courses = [
            ['1-BAS', 'Primero de Básica', ['MAT1', 'LEN1', 'CNA1', 'ESC1', 'ING1']],
            ['2-BAS', 'Segundo de Básica', ['MAT2', 'LEN2', 'CNA2', 'ESC2', 'ING2']],
            ['3-BAS', 'Tercero de Básica', ['MAT3', 'LEN3', 'CNA3', 'ESC3', 'ING3']],
            ['4-BAS', 'Cuarto de Básica', ['MAT4', 'LEN4', 'CNA4', 'ESC4', 'ING4']],
        ];

        $subjectNames = [
            'MAT' => 'Matemática',
            'LEN' => 'Lengua y Literatura',
            'CNA' => 'Ciencias Naturales',
            'ESC' => 'Estudios Sociales',
            'ING' => 'Inglés',
        ];

        foreach ($courses as [$courseCode, $courseName, $subjectCodes]) {
            $course = Course::query()->firstOrCreate(
                ['code' => $courseCode],
                ['name' => $courseName, 'description' => "Curso {$courseName}", 'is_active' => true],
            );

            foreach ($subjectCodes as $subjectCode) {
                $prefix = substr($subjectCode, 0, 3);
                $subjectName = $subjectNames[$prefix] ?? $subjectCode;

                Subject::query()->firstOrCreate(
                    ['course_id' => $course->id, 'code' => $subjectCode],
                    ['name' => $subjectName, 'description' => "{$subjectName} ({$subjectCode})"],
                );
            }
        }
    }

    /**
     * Creates deterministic demo students.
     *
     * @return array{0: User, 1: array<int, Student>}
     */
    protected function createStudents(): array
    {
        $evaluator = User::query()->firstOrCreate(
            ['email' => 'evaluador@edusense.local'],
            ['name' => 'Docente Evaluador', 'password' => 'edusense-2026', 'is_active' => true],
        );

        $demo = [
            ['María José', 'Álvarez', '1712345678'],
            ['Pedro', 'Ramírez', '1712345679'],
            ['Lucía', 'Fernández', '1712345680'],
            ['Mateo', 'Soto', '1712345681'],
            ['Valentina', 'Rojas', '1712345682'],
            ['Santiago', 'Cruz', '1712345683'],
        ];

        $students = [];

        foreach ($demo as [$first, $last, $document]) {
            $students[] = Student::query()->firstOrCreate(
                ['document_number' => $document],
                [
                    'first_name' => $first,
                    'last_name' => $last,
                    'birth_date' => fake()->dateTimeBetween('-12 years', '-6 years')->format('Y-m-d'),
                    'tutor_id' => $evaluator->id,
                    'is_active' => true,
                ],
            );
        }

        return [$evaluator, $students];
    }

    /**
     * Applies one evaluation through the domain service.
     *
     * @param  array<int, int>  $answers
     */
    protected function evaluate(PsychopedagogicEvaluationService $service, User $evaluator, Student $student, string $area, array $answers, bool $withSchedule): void
    {
        $survey = Survey::query()->where('evaluation_area', $area)->first();

        if ($survey === null || $this->studentAlreadyEvaluated($student, $survey)) {
            return;
        }

        $questions = Question::query()->where('survey_id', $survey->id)->get();

        $payload = $questions->map(fn (Question $question, int $index) => [$question->id, $answers[$index] ?? 1])->toArray();

        $service->evaluate($student, $survey, $evaluator->id, array_column($payload, 1, 0));

        if ($withSchedule) {
            $this->scheduleInterventions($student, $area);
        }
    }

    /**
     * Records sample attendance and grades for the enrolled students.
     *
     * @param  array<int, Student>  $students
     */
    protected function fillAcademicData(array $students): void
    {
        if (Attendance::query()->exists()) {
            return;
        }

        $courses = Course::query()->get();
        $term = AcademicTerm::query()->where('is_current', true)->first() ?? AcademicTerm::query()->first();

        $course = $courses->first();

        foreach ($students as $index => $student) {
            Enrollment::query()->firstOrCreate(
                ['student_id' => $student->id, 'term_id' => $term->id],
                ['course_id' => $course->id, 'status' => 'active', 'enrolled_at' => now()->toDateString()],
            );

            $subjects = Subject::query()->where('course_id', $course->id)->get();

            foreach ($subjects as $subjectIndex => $subject) {
                Attendance::query()->firstOrCreate(
                    ['student_id' => $student->id, 'subject_id' => $subject->id, 'attendance_date' => now()->toDateString()],
                    ['status' => $index === 0 && $subjectIndex === 0 ? 'absent' : 'present'],
                );

                Grade::query()->firstOrCreate(
                    ['student_id' => $student->id, 'subject_id' => $subject->id, 'term_id' => $term->id],
                    ['score' => fake()->randomFloat(2, 5, 10), 'created_by' => $student->tutor_id ?? 1],
                );
            }
        }
    }

    /**
     * Creates three demo intervention sessions for the prioritized area.
     */
    protected function scheduleInterventions(Student $student, string $area): void
    {
        $activities = Activity::query()->where('category', $area)->get();

        $states = ['completed', 'pending', 'pending'];

        foreach ($activities as $index => $activity) {
            InterventionSchedule::query()->firstOrCreate(
                ['student_id' => $student->id, 'activity_id' => $activity->id],
                [
                    'scheduled_date' => now()->addDays(($index - 1) * 7)->toDateString(),
                    'status' => $states[$index],
                    'progress_notes' => $states[$index] === 'completed' ? 'Activity finished with good results.' : null,
                ],
            );
        }
    }

    /**
     * Whether the student already answered the given survey.
     */
    protected function studentAlreadyEvaluated(Student $student, Survey $survey): bool
    {
        return EvaluationResponse::query()
            ->join('psy_questions as q', 'q.id', '=', 'psy_evaluation_responses.question_id')
            ->where('psy_evaluation_responses.student_id', $student->id)
            ->where('q.survey_id', $survey->id)
            ->exists();
    }
}
