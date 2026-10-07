<?php

namespace App\Modules\Academic\Submodules\Students\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Academic\Submodules\Students\Models\Student;
use App\Modules\Academic\Submodules\Students\Requests\ImportStudentsRequest;
use App\Modules\Academic\Submodules\Students\Requests\StoreStudentRequest;
use App\Modules\Academic\Submodules\Students\Requests\UpdateStudentRequest;
use App\Modules\Academic\Submodules\Students\Services\StudentImportService;
use App\Modules\Academic\Submodules\Students\Services\StudentService;
use App\Modules\Administration\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx as XlsxWriter;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * CRUD of the student master records (Students submodule of the academic
 * module), plus bulk CSV import and filtered CSV/XLSX export. The business
 * rules live in {@see StudentService}; this class only maps HTTP to the
 * service and records the audit trail.
 */
class StudentController extends Controller
{
    public function __construct(
        private readonly AuditService $audit,
        private readonly StudentService $students,
        private readonly StudentImportService $studentImport,
    ) {}

    /**
     * Paginated list of students.
     */
    public function index(Request $request): JsonResponse
    {
        return $this->success($this->paginateQuery($request, $this->students->listQuery($request)));
    }

    /**
     * Creates a student.
     */
    public function store(StoreStudentRequest $request): JsonResponse
    {
        $student = $this->students->create($request->validated());

        $this->audit->record('students.create', 'students', ['student_id' => $student->id]);

        return $this->success($student, 'Student created.', 201);
    }

    /**
     * Returns a student with its academic and psychopedagogic context.
     */
    public function show(Student $student): JsonResponse
    {
        return $this->success($this->students->detail($student));
    }

    /**
     * Updates a student.
     */
    public function update(UpdateStudentRequest $request, Student $student): JsonResponse
    {
        $student = $this->students->update($student, $request->validated());

        $this->audit->record('students.update', 'students', ['student_id' => $student->id]);

        return $this->success($student, 'Student updated.');
    }

    /**
     * Deactivates a student.
     */
    public function destroy(Request $request, Student $student): JsonResponse
    {
        $this->students->deactivate($student);

        $this->audit->record('students.deactivate', 'students', ['student_id' => $student->id]);

        return $this->success(message: 'Student deactivated.');
    }

    /**
     * Bulk imports students from a CSV file.
     */
    public function import(ImportStudentsRequest $request): JsonResponse
    {
        $stream = fopen($request->file('file')->getRealPath(), 'r');

        $result = $this->studentImport->import(
            separator: $request->string('separator')->toString(),
            stream: $stream,
            courseId: $request->filled('course_id') ? $request->integer('course_id') : null,
            termId: $request->filled('term_id') ? $request->integer('term_id') : null,
        );

        fclose($stream);

        $this->audit->record('students.import', 'students', $result);

        return $this->success($result, 'Import finished.');
    }

    /**
     * Downloads the filtered students as CSV or XLSX.
     */
    public function export(Request $request): StreamedResponse
    {
        $students = $this->students->filtered($request);

        $format = $request->string('format')->toString() === 'xlsx' ? 'xlsx' : 'csv';

        $this->audit->record('students.export', 'students', ['format' => $format, 'rows' => $students->count()]);

        return $format === 'xlsx' ? $this->exportXlsx($request, $students) : $this->exportCsv($students);
    }

    /**
     * Streams a UTF-8 CSV (with BOM) of the given students.
     *
     * @param  Collection<int, Student>  $students
     */
    protected function exportCsv(Collection $students): StreamedResponse
    {
        return response()->streamDownload(function () use ($students) {
            $stream = fopen('php://output', 'w');

            fwrite($stream, "\xEF\xBB\xBF");
            fputcsv($stream, $this->students->exportColumns(), ';');

            foreach ($students as $student) {
                fputcsv($stream, array_values($this->students->exportRow($student)), ';');
            }

            fclose($stream);
        }, 'estudiantes_'.date('Ymd_His').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /**
     * Streams an XLSX workbook of the given students.
     *
     * Row one carries the brand header (logo + title), row two the generation
     * context (date, row count, applied filters) and row three the table
     * header, so the exported file documents the slice it contains.
     *
     * @param  Collection<int, Student>  $students
     */
    protected function exportXlsx(Request $request, Collection $students): StreamedResponse
    {
        return response()->streamDownload(function () use ($request, $students) {
            $spreadsheet = new Spreadsheet;
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Estudiantes');

            $columns = $this->students->exportColumns();
            $lastColumn = Coordinate::stringFromColumnIndex(count($columns));
            $headerRow = 3;

            $sheet->mergeCells("B1:{$lastColumn}1");
            $sheet->mergeCells("A2:{$lastColumn}2");
            $sheet->setCellValue('B1', 'EduSense — Listado de estudiantes');
            $sheet->setCellValue('A2', $this->exportSubtitle($request, $students->count()));
            $sheet->fromArray($columns, null, "A{$headerRow}");

            $row = $headerRow + 1;

            foreach ($students as $student) {
                $sheet->fromArray(array_values($this->students->exportRow($student)), null, "A{$row}");
                $row++;
            }

            $this->styleExportSheet($sheet, $lastColumn, $row - 1);

            $writer = new XlsxWriter($spreadsheet);
            $writer->save('php://output');
        }, 'estudiantes_'.date('Ymd_His').'.xlsx', ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
    }

    /**
     * One-line context printed under the header: generation date, exported
     * row count and the filters that shaped the result.
     */
    protected function exportSubtitle(Request $request, int $total): string
    {
        $parts = [
            'Generado el '.now()->format('d/m/Y H:i'),
        ];

        if ($request->filled('ids')) {
            $parts[] = 'Selección de '.$total.' estudiantes';
        } else {
            $parts[] = $total.' registros';

            $description = $this->students->exportFilterDescription($request);

            if ($description !== '') {
                $parts[] = 'Filtros: '.$description;
            }
        }

        return implode(' · ', $parts);
    }

    /**
     * Applies the branded layout of the export workbook: header band with
     * logo, subtitle, styled table header, borders, zebra rows, the
     * active/inactive colour cue, freeze panes and the auto filter.
     */
    protected function styleExportSheet(Worksheet $sheet, string $lastColumn, int $lastRow): void
    {
        $logoPath = public_path('logo-edusense.png');

        if (is_file($logoPath)) {
            $logo = new Drawing;
            $logo->setPath($logoPath);
            $logo->setCoordinates('A1');
            $logo->setHeight(34);
            $logo->setOffsetX(8);
            $logo->setOffsetY(4);
            $logo->setWorksheet($sheet);
        }

        $sheet->getRowDimension(1)->setRowHeight(42);
        $sheet->getRowDimension(2)->setRowHeight(20);
        $sheet->getRowDimension(3)->setRowHeight(24);

        $sheet->getStyle("A1:{$lastColumn}1")
            ->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()
            ->setRGB('0F9D8A');
        $sheet->getStyle('B1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 15, 'color' => ['rgb' => 'FFFFFF']],
            'alignment' => [
                'vertical' => Alignment::VERTICAL_CENTER,
                'horizontal' => Alignment::HORIZONTAL_LEFT,
                'indent' => 1,
            ],
        ]);

        $sheet->getStyle("A2:{$lastColumn}2")->applyFromArray([
            'font' => ['italic' => true, 'size' => 9, 'color' => ['rgb' => '78716C']],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);

        $sheet->getStyle("A3:{$lastColumn}3")
            ->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()
            ->setRGB('0F9D8A');
        $sheet->getStyle("A3:{$lastColumn}3")->applyFromArray([
            'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => 'FFFFFF']],
            'alignment' => [
                'vertical' => Alignment::VERTICAL_CENTER,
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'wrapText' => true,
            ],
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'D6D3D1']],
            ],
        ]);

        if ($lastRow >= 4) {
            $sheet->getStyle("A4:{$lastColumn}{$lastRow}")->applyFromArray([
                'borders' => [
                    'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'E7E5E4']],
                ],
                'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
            ]);

            for ($line = 4; $line <= $lastRow; $line++) {
                if (($line % 2) === 0) {
                    $sheet->getStyle("A{$line}:{$lastColumn}{$line}")
                        ->getFill()
                        ->setFillType(Fill::FILL_SOLID)
                        ->getStartColor()
                        ->setRGB('FAFAF9');
                }

                $statusCell = $sheet->getCell("{$lastColumn}{$line}");
                $status = (string) $statusCell->getValue();

                if ($status === 'Activo' || $status === 'Inactivo') {
                    $statusCell->getStyle()->getFont()->getColor()->setRGB(
                        $status === 'Activo' ? '059669' : 'BE123C'
                    );
                }
            }

            $sheet->getStyle("{$lastColumn}4:{$lastColumn}{$lastRow}")
                ->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }

        $sheet->freezePane('A4');
        $sheet->setAutoFilter("A3:{$lastColumn}{$lastRow}");

        $widths = [22, 18, 18, 16, 26, 12];

        foreach (range('A', $lastColumn) as $index => $columnLabel) {
            $sheet->getColumnDimension($columnLabel)->setWidth($widths[$index] ?? 16);
        }
    }

    /**
     * Bulk updates the parallel of multiple students.
     */
    public function bulkUpdateParallel(Request $request): JsonResponse
    {
        $request->validate([
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'integer|exists:std_students,id',
            'parallel' => 'nullable|string|max:10',
        ]);

        $count = $this->students->bulkUpdateParallel(
            $request->input('student_ids'),
            $request->input('parallel')
        );

        $this->audit->record('students.bulk_update_parallel', 'students', [
            'count' => $count,
            'parallel' => $request->input('parallel'),
        ]);

        return $this->success(['updated' => $count], "{$count} students updated.");
    }

    /**
     * Bulk toggles the active status of multiple students.
     */
    public function bulkToggleStatus(Request $request): JsonResponse
    {
        $request->validate([
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'integer|exists:std_students,id',
            'is_active' => 'required|boolean',
        ]);

        $count = $this->students->bulkToggleStatus(
            $request->input('student_ids'),
            $request->boolean('is_active')
        );

        $action = $request->boolean('is_active') ? 'reactivated' : 'deactivated';
        $this->audit->record("students.bulk_{$action}", 'students', ['count' => $count]);

        return $this->success(['updated' => $count], "{$count} students {$action}.");
    }
}
