<?php

namespace App\Modules\Academic\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/**
 * Validation rules for enrolling a student.
 */
class StoreEnrollmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('manage_enrollments');
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
            'course_id' => ['required', 'integer', Rule::exists('aca_courses', 'id')],
            'term_id' => ['required', 'integer', Rule::exists('aca_academic_terms', 'id')],
            'status' => ['required', Rule::in(['active', 'completed', 'retired'])],
            'enrolled_at' => ['nullable', 'date'],
        ];
    }
}
