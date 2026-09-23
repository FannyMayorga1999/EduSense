<?php

namespace App\Modules\Psychopedagogic\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/**
 * Validation rules for scheduling an intervention session.
 */
class StoreScheduleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('create_schedules');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, string|ValidationRule>>
     */
    public function rules(): array
    {
        return [
            'student_id' => ['required', 'integer', Rule::exists('std_students', 'id')],
            'activity_id' => ['required', 'integer', Rule::exists('psy_activities', 'id')],
            'subject_id' => ['nullable', 'integer', Rule::exists('aca_subjects', 'id')],
            'scheduled_date' => ['required', 'date'],
            'status' => ['sometimes', Rule::in(['pending', 'completed', 'rescheduled', 'cancelled'])],
            'progress_notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
