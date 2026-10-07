<?php

namespace App\Modules\Academic\Services;

use App\Modules\Academic\Models\AcademicTerm;
use App\Modules\Academic\Models\Grade;
use App\Modules\Academic\Models\Subject;
use App\Modules\Academic\Submodules\Students\Models\Student;

/**
 * Bulk grade import from a CSV matrix.
 *
 * Expected format (UTF-8, manual uploads must escape the header):
 *   document_number, MAT1, LEN2, ...
 *   1712345678,      9.5,  7.25, ...
 *   ...
 *
 * The term is provided with the request, not inside the file.
 */
class GradeImportService
{
    /**
     * Parses and persists the CSV content.
     *
     * @param  resource  $stream  opened file handle
     * @return array{failed: int, created: int, updated: int, errors: array<int, string>}
     */
    public function import(string $separator, int $termId, $stream): array
    {
        $result = ['failed' => 0, 'created' => 0, 'updated' => 0, 'errors' => []];

        $term = AcademicTerm::findOrFail($termId);

        $header = $this->readRow($stream, $separator);

        if ($header === null || strtolower($header[0]) !== 'document_number') {
            $result['errors'][] = 'The first column must be "document_number".';

            return $result;
        }

        $subjectCodes = array_slice($header, 1);

        $subjects = Subject::query()
            ->whereIn('code', $subjectCodes)
            ->get()
            ->keyBy(fn (Subject $subject) => $subject->code);

        if ($subjects->count() !== count($subjectCodes)) {
            $result['errors'][] = 'Some subject codes do not exist.';

            return $result;
        }

        $students = Student::query()
            ->whereNotNull('document_number')
            ->get()
            ->keyBy('document_number');

        $rowNumber = 1;

        while (($row = $this->readRow($stream, $separator)) !== null) {
            $rowNumber++;

            if (count($row) < 2 || trim((string) ($row[0] ?? '')) === '') {
                continue;
            }

            $document = trim((string) $row[0]);

            if (! isset($students[$document])) {
                $result['failed']++;
                $result['errors'][] = "Row {$rowNumber}: student with document '{$document}' not found.";

                continue;
            }

            $student = $students[$document];

            foreach ($subjectCodes as $index => $code) {
                $value = trim((string) ($row[$index + 1] ?? ''));

                if ($value === '') {
                    continue;
                }

                if (! is_numeric($value)) {
                    $result['failed']++;
                    $result['errors'][] = "Row {$rowNumber}: score '{$value}' for '{$code}' is not numeric.";

                    continue;
                }

                $score = (float) $value;

                if ($score < 0 || $score > 10) {
                    $result['failed']++;
                    $result['errors'][] = "Row {$rowNumber}: score '{$score}' for '{$code}' is out of range (0-10).";

                    continue;
                }

                $grade = Grade::query()->updateOrCreate(
                    [
                        'student_id' => $student->id,
                        'subject_id' => $subjects[$code]->id,
                        'term_id' => $term->id,
                    ],
                    [
                        'score' => $score,
                        'created_by' => auth()->id(),
                    ]
                );

                if ($grade->wasRecentlyCreated) {
                    $result['created']++;
                } else {
                    $result['updated']++;
                }
            }
        }

        return $result;
    }

    /**
     * Reads a CSV row as a string array (handles BOM on the first row).
     *
     * @param  resource  $stream
     * @return array<int, string>|null
     */
    protected function readRow($stream, string $separator): ?array
    {
        $line = fgetcsv($stream, null, $separator, '"');

        if ($line === false) {
            return null;
        }

        $line = array_map(fn ($value) => trim(mb_convert_encoding((string) $value, 'UTF-8', 'UTF-8')), $line);

        if (isset($line[0]) && str_starts_with($line[0], "\xEF\xBB\xBF")) {
            $line[0] = substr($line[0], 3);
        }

        return $line;
    }
}
