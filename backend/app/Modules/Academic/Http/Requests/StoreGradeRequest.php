<?php

namespace App\Modules\Academic\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/**
 * Validation rules for recording a grade.
 */
class StoreGradeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('create_grades');
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
            'subject_id' => ['required', 'integer', Rule::exists('aca_subjects', 'id')],
            'term_id' => ['required', 'integer', Rule::exists('aca_academic_terms', 'id')],
            'score' => ['required', 'numeric', 'min:0', 'max:10'],
            'observation' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
