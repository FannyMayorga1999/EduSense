<?php

namespace Tests\Feature;

use App\Modules\Academic\Models\AcademicTerm;
use App\Modules\Academic\Models\Subject;
use App\Modules\Academic\Services\GradeImportService;
use App\Modules\Academic\Submodules\Students\Models\Student;
use App\Modules\System\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AcademicGradeImportTest extends TestCase
{
    use RefreshDatabase;

    private User $teacher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);

        $this->teacher = User::query()->where('email', 'profesor@edusense.local')->firstOrFail();
    }

    public function test_csv_matrix_import_creates_or_updates_grades(): void
    {
        $term = AcademicTerm::factory()->create();
        $subject = Subject::factory()->create(['code' => 'MAT1']);
        $studentA = Student::factory()->create(['document_number' => '1712345001']);
        $studentB = Student::factory()->create(['document_number' => '1712345002']);

        $content = "document_number,MAT1\n1712345001,8.5\n1712345002,7.25\n";

        $path = tempnam(storage_path('framework/testing'), 'grades');
        file_put_contents($path, $content);

        $handle = fopen($path, 'r');

        $service = app(GradeImportService::class);
        $result = $service->import(',', $term->id, $handle);

        fclose($handle);
        unlink($path);

        $this->assertEquals(0, $result['failed']);
        $this->assertEquals(2, $result['created']);

        $this->assertDatabaseHas('aca_grades', [
            'student_id' => $studentA->id,
            'subject_id' => $subject->id,
            'term_id' => $term->id,
            'score' => 8.5,
        ]);
    }

    public function test_csv_import_reports_unknown_students(): void
    {
        $term = AcademicTerm::factory()->create();
        Subject::factory()->create(['code' => 'MAT1']);

        $content = "document_number,MAT1\n9999999999,8.5\n";

        $path = tempnam(storage_path('framework/testing'), 'grades');
        file_put_contents($path, $content);

        $handle = fopen($path, 'r');

        $service = app(GradeImportService::class);
        $result = $service->import(',', $term->id, $handle);

        fclose($handle);
        unlink($path);

        $this->assertEquals(1, $result['failed']);
        $this->assertCount(1, $result['errors']);
    }

    public function test_csv_grade_upload_endpoint_requires_upload_permission(): void
    {
        $psychopedagogist = User::query()->where('email', 'psicopedagogo@edusense.local')->firstOrFail();

        Sanctum::actingAs($psychopedagogist);

        $term = AcademicTerm::factory()->create();
        $csv = UploadedFile::fake()->createWithContent('grades.csv', "document_number,MAT1\n");

        $this->postJson('/api/v1/academic/grades/import', [
            'term_id' => $term->id,
            'separator' => ',',
            'file' => $csv,
        ])->assertStatus(403);
    }
}
