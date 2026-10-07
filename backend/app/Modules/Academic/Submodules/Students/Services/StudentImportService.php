<?php

namespace App\Modules\Academic\Submodules\Students\Services;

use App\Modules\Academic\Models\Enrollment;
use App\Modules\Academic\Submodules\Students\Models\Student;
use Illuminate\Support\Carbon;
use Throwable;

/**
 * Bulk student import from a CSV file.
 *
 * Expected format (UTF-8, manual uploads must escape the header):
 *   document_number, first_name, last_name, birth_date
 *   1712345678,      María,        José,      2015-03-12
 *   ...
 *
 * A student is matched by document_number: existing records are updated
 * (without changing their active state) and new ones are created active.
 * When both a course and a term are provided, every processed row is also
 * enrolled in that course for that term.
 */
class StudentImportService
{
    /**
     * Parses and persists the CSV content.
     *
     * @param  resource  $stream  opened file handle
     * @return array{failed: int, created: int, updated: int, errors: array<int, string>}
     */
    public function import(string $separator, $stream, ?int $courseId = null, ?int $termId = null): array
    {
        $result = ['failed' => 0, 'created' => 0, 'updated' => 0, 'errors' => []];

        $header = $this->readRow($stream, $separator);

        if ($header === null) {
            $result['errors'][] = 'The file is empty.';

            return $result;
        }

        $columns = $this->mapColumns($header);

        if (! isset($columns['document_number'], $columns['first_name'], $columns['last_name'])) {
            $result['errors'][] = 'The header must contain "document_number", "first_name" and "last_name".';

            return $result;
        }

        $rowNumber = 1;

        while (($row = $this->readRow($stream, $separator)) !== null) {
            $rowNumber++;

            $record = [
                'document' => trim((string) ($row[$columns['document_number']] ?? '')),
                'first_name' => trim((string) ($row[$columns['first_name']] ?? '')),
                'last_name' => trim((string) ($row[$columns['last_name']] ?? '')),
                'birth_date' => trim((string) ($row[$columns['birth_date'] ?? -1] ?? '')),
            ];

            if ($record['document'] === '') {
                continue;
            }

            $validation = $this->validateRecord($record);

            if ($validation !== null) {
                $result['failed']++;
                $result['errors'][] = "Row {$rowNumber}: {$validation}";

                continue;
            }

            try {
                $student = Student::query()->firstOrNew(['document_number' => $record['document']]);

                $student->first_name = $record['first_name'];
                $student->last_name = $record['last_name'];

                if ($record['birth_date'] !== '') {
                    $student->birth_date = Carbon::parse($record['birth_date'])->format('Y-m-d');
                }

                $created = ! $student->exists;

                if ($created) {
                    $student->is_active = true;
                }

                $student->save();

                if ($courseId !== null && $termId !== null) {
                    Enrollment::query()->updateOrCreate(
                        ['student_id' => $student->id, 'term_id' => $termId],
                        ['course_id' => $courseId, 'status' => 'active'],
                    );
                }

                $created ? $result['created']++ : $result['updated']++;
            } catch (Throwable $throwable) {
                $result['failed']++;
                $result['errors'][] = "Row {$rowNumber}: {$throwable->getMessage()}";
            }
        }

        return $result;
    }

    /**
     * Validates a single CSV record.
     *
     * @param  array{document: string, first_name: string, last_name: string, birth_date: string}  $record
     */
    protected function validateRecord(array $record): ?string
    {
        $length = preg_replace('/\D/', '', $record['document']);

        if (! is_string($length) || strlen($length) < 7 || strlen($length) > 10) {
            return "document '{$record['document']}' is not valid.";
        }

        if ($record['first_name'] === '') {
            return 'first name is required.';
        }

        if ($record['last_name'] === '') {
            return 'last name is required.';
        }

        if (mb_strlen($record['first_name']) > 100 || mb_strlen($record['last_name']) > 100) {
            return 'names must not exceed 100 characters.';
        }

        if ($record['birth_date'] !== '') {
            try {
                $birthDate = Carbon::parse($record['birth_date']);

                if ($birthDate->isAfter(Carbon::now())) {
                    return "birth_date '{$record['birth_date']}' must be before today.";
                }
            } catch (Throwable) {
                return "birth_date '{$record['birth_date']}' is not a valid date.";
            }
        }

        return null;
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

    /**
     * Maps the header labels to their column indexes.
     *
     * @param  array<int, string>  $header
     * @return array<string, int>
     */
    protected function mapColumns(array $header): array
    {
        $columns = [];

        foreach ($header as $index => $name) {
            $normalized = strtolower(trim((string) $name));

            if (in_array($normalized, ['document_number', 'first_name', 'last_name', 'birth_date'], true)) {
                $columns[$normalized] = $index;
            }
        }

        return $columns;
    }
}
