<?php

namespace App\Modules\Academic\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\Academic\Http\Requests\StoreAttendanceRequest;
use App\Modules\Academic\Models\Attendance;
use App\Modules\Administration\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Attendance registry (Academic module).
 */
class AttendanceController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    /**
     * Paginated attendance records for a date/subject.
     */
    public function index(Request $request): JsonResponse
    {
        $records = $this->paginateQuery(
            $request,
            Attendance::query()
                ->with(['student:id,first_name,last_name', 'subject:id,name'])
                ->when($request->filled('attendance_date'), fn ($query) => $query->where('attendance_date', $request->string('attendance_date')->toString()))
                ->when($request->filled('subject_id'), fn ($query) => $query->where('subject_id', $request->integer('subject_id')))
                ->when($request->filled('student_id'), fn ($query) => $query->where('student_id', $request->integer('student_id')))
                ->orderByDesc('attendance_date'),
            25
        );

        return $this->success($records);
    }

    /**
     * Records attendance for one student.
     */
    public function store(StoreAttendanceRequest $request): JsonResponse
    {
        $data = $request->validated();

        $existing = Attendance::query()
            ->where('student_id', $data['student_id'])
            ->where('attendance_date', $data['attendance_date'])
            ->where('subject_id', $data['subject_id'] ?? null)
            ->first();

        if ($existing !== null) {
            $existing->update($data);
            $created = false;
            $record = $existing;
        } else {
            $record = Attendance::query()->create($data);
            $created = true;
        }

        $this->audit->record($created ? 'attendance.create' : 'attendance.update', 'academic', ['attendance_id' => $record->id]);

        return $this->success($record, $created ? 'Attendance recorded.' : 'Attendance updated.', $created ? 201 : 200);
    }

    /**
     * Records bulk attendance for a roster (student_id => status).
     */
    public function storeBulk(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'attendance_date' => ['required', 'date'],
            'subject_id' => ['required', 'integer'],
            'records' => ['required', 'array', 'min:1'],
            'records.*.student_id' => ['required', 'integer'],
            'records.*.status' => ['required', 'in:present,absent,late,excused'],
        ]);

        $count = 0;

        foreach ($validated['records'] as $entry) {
            Attendance::query()->updateOrCreate(
                [
                    'student_id' => $entry['student_id'],
                    'attendance_date' => $validated['attendance_date'],
                    'subject_id' => $validated['subject_id'],
                ],
                ['status' => $entry['status'], 'notes' => $entry['notes'] ?? null],
            );

            $count++;
        }

        $this->audit->record('attendance.bulk', 'academic', ['count' => $count]);

        return $this->success(['recorded' => $count], 'Attendance saved.');
    }

    /**
     * Returns a pivot table of attendance grouped per date.
     */
    public function report(Request $request): JsonResponse
    {
        $rows = Attendance::query()
            ->selectRaw('student_id, attendance_date, GROUP_CONCAT(status) as statuses')
            ->when($request->filled('from'), fn ($query) => $query->whereDate('attendance_date', '>=', $request->string('from')->toString()))
            ->when($request->filled('to'), fn ($query) => $query->whereDate('attendance_date', '<=', $request->string('to')->toString()))
            ->groupBy('student_id', 'attendance_date')
            ->orderBy('attendance_date')
            ->get();

        return $this->success($rows);
    }

    /**
     * Updates one attendance record.
     */
    public function update(StoreAttendanceRequest $request, Attendance $attendance): JsonResponse
    {
        $attendance->update($request->validated());

        $this->audit->record('attendance.update', 'academic', ['attendance_id' => $attendance->id]);

        return $this->success($attendance, 'Attendance updated.');
    }

    /**
     * Deletes one attendance record.
     */
    public function destroy(Attendance $attendance): JsonResponse
    {
        $attendance->delete();

        return $this->success(message: 'Attendance removed.');
    }
}
