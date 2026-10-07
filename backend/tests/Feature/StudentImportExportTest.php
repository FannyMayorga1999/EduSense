<?php

namespace Tests\Feature;

use App\Modules\Academic\Models\AcademicTerm;
use App\Modules\Academic\Models\Course;
use App\Modules\Academic\Submodules\Students\Models\Student;
use App\Modules\System\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Tests\TestCase;

class StudentImportExportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_csv_import_creates_and_updates_students(): void
    {
        Sanctum::actingAs($this->admin());

        Student::factory()->create(['document_number' => '1712345009']);

        $csv = UploadedFile::fake()->createWithContent('students.csv', implode("\n", [
            'document_number,first_name,last_name,birth_date',
            '1712345001,Maria,Jose,2015-03-12',
            '1712345009,Maria,Nuevo,2015-01-01',
        ]));

        $this->postJson('/api/v1/students/import', ['file' => $csv, 'separator' => ','])
            ->assertOk()
            ->assertJsonPath('data.created', 1)
            ->assertJsonPath('data.updated', 1)
            ->assertJsonPath('data.failed', 0);

        $this->assertDatabaseHas('std_students', [
            'document_number' => '1712345001',
            'first_name' => 'Maria',
            'last_name' => 'Jose',
        ]);

        $existing = Student::query()->where('document_number', '1712345009')->firstOrFail();

        $this->assertSame('Nuevo', $existing->last_name);
    }

    public function test_csv_import_reports_invalid_rows(): void
    {
        Sanctum::actingAs($this->admin());

        $csv = UploadedFile::fake()->createWithContent('students.csv', implode("\n", [
            'document_number,first_name,last_name,birth_date',
            '123,Maria,Jose,2015-03-12',
            '1712345002,,Jose,2015-03-12',
        ]));

        $this->postJson('/api/v1/students/import', ['file' => $csv, 'separator' => ','])
            ->assertOk()
            ->assertJsonPath('data.created', 0)
            ->assertJsonPath('data.updated', 0)
            ->assertJsonPath('data.failed', 2);

        $this->assertCount(0, Student::query()->get());
    }

    public function test_csv_import_can_enroll_students_with_course_and_term(): void
    {
        Sanctum::actingAs($this->admin());

        $course = Course::factory()->create();
        $term = AcademicTerm::factory()->create();

        $csv = UploadedFile::fake()->createWithContent('students.csv', implode("\n", [
            'document_number,first_name,last_name,birth_date',
            '1712345003,Ana,Rios,2015-03-12',
        ]));

        $this->postJson('/api/v1/students/import', [
            'file' => $csv,
            'separator' => ',',
            'course_id' => $course->id,
            'term_id' => $term->id,
        ])->assertOk();

        $student = Student::query()->where('document_number', '1712345003')->firstOrFail();

        $this->assertDatabaseHas('aca_enrollments', [
            'student_id' => $student->id,
            'course_id' => $course->id,
            'term_id' => $term->id,
            'status' => 'active',
        ]);
    }

    public function test_csv_import_requires_import_permission(): void
    {
        Sanctum::actingAs($this->teacher());

        $csv = UploadedFile::fake()->createWithContent('students.csv', implode("\n", [
            'document_number,first_name,last_name,birth_date',
            '1712345004,Maria,Jose,2015-03-12',
        ]));

        $this->postJson('/api/v1/students/import', ['file' => $csv, 'separator' => ','])
            ->assertStatus(403);
    }

    public function test_export_csv_applies_the_search_filter(): void
    {
        Sanctum::actingAs($this->admin());

        Student::factory()->create(['document_number' => '1712347001', 'first_name' => 'Alan', 'last_name' => 'Torres']);
        Student::factory()->create(['document_number' => '1712347002', 'first_name' => 'Beto', 'last_name' => 'Lopez']);

        $response = $this->getJson('/api/v1/students/export?search=Torres');

        $response->assertOk();

        $content = $response->streamedContent();

        $this->assertStringStartsWith("\xEF\xBB\xBF", $content);
        $this->assertStringContainsString('Alan', $content);
        $this->assertStringNotContainsString('Beto', $content);
    }

    public function test_export_xlsx_returns_a_spreadsheet(): void
    {
        Sanctum::actingAs($this->admin());

        Student::factory()->create(['document_number' => '1712348001', 'first_name' => 'Ximena', 'last_name' => 'Yanez']);

        $response = $this->getJson('/api/v1/students/export?format=xlsx');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        $path = tempnam(sys_get_temp_dir(), 'edusense-xlsx');
        file_put_contents($path, $response->streamedContent());

        $sheet = IOFactory::load($path)->getActiveSheet();

        $this->assertSame('document_number', $sheet->getCell('A1')->getValue());
        $this->assertSame('Ximena', $sheet->getCell('B2')->getValue());
        $this->assertSame('Yanez', $sheet->getCell('C2')->getValue());

        unlink($path);
    }

    public function test_export_requires_export_permission(): void
    {
        Sanctum::actingAs($this->teacher());

        $this->getJson('/api/v1/students/export')->assertStatus(403);
    }

    public function test_index_filters_by_grade(): void
    {
        Sanctum::actingAs($this->admin());

        $course = Course::factory()->create(['name' => '2° Básica']);
        $term = AcademicTerm::factory()->create();
        $student = Student::factory()->create(['document_number' => '1712349001', 'first_name' => 'Carla']);
        Student::factory()->create(['document_number' => '1712349002', 'first_name' => 'Dario']);

        $student->enrollments()->create(['course_id' => $course->id, 'term_id' => $term->id, 'status' => 'active']);

        $this->getJson('/api/v1/students?grade=2%c2%b0%20B%c3%a1sica')
            ->assertOk()
            ->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.data.0.first_name', 'Carla');
    }

    protected function admin(): User
    {
        return User::query()->where('email', 'admin@edusense.local')->firstOrFail();
    }

    protected function teacher(): User
    {
        return User::query()->where('email', 'profesor@edusense.local')->firstOrFail();
    }
}
