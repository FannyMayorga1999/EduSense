<?php

namespace App\Modules\Psychopedagogic\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/**
 * Validation rules for updating a schedule (status, notes, reschedule).
 */
class UpdateScheduleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('edit_schedules');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, string|ValidationRule>>
     */
    public function rules(): array
    {
        return [
            'scheduled_date' => ['sometimes', 'date'],
            'status' => ['sometimes', Rule::in(['pending', 'completed', 'rescheduled', 'cancelled'])],
            'progress_notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
