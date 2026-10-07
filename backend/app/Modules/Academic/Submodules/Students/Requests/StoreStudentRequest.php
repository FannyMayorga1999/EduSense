<?php

namespace App\Modules\Academic\Submodules\Students\Requests;

use App\Modules\Academic\Submodules\Students\Requests\Rules\ValidDocumentNumber;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/**
 * Validation rules for creating a student.
 */
class StoreStudentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('create_students');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, string|ValidationRule>>
     */
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'birth_date' => ['required', 'date', 'before:today'],
            'document_type' => ['required', Rule::in(['cedula', 'pasaporte', 'dni'])],
            'document_number' => ['required', new ValidDocumentNumber, Rule::unique('std_students', 'document_number')],
            'gender' => ['nullable', Rule::in(['male', 'female', 'other'])],
            'representative_name' => ['nullable', 'string', 'max:160'],
            'representative_relation' => ['nullable', 'string', 'max:100'],
            'contact_phone' => ['nullable', 'string', 'max:30'],
            'contact_email' => ['nullable', 'email', 'max:150'],
            'home_address' => ['nullable', 'string', 'max:255'],
            'laterality' => ['nullable', Rule::in(['left', 'right', 'ambidextrous'])],
            'medical_conditions' => ['nullable', 'string'],
            'course_id' => ['nullable', 'integer', 'required_with:term_id', Rule::exists('aca_courses', 'id')],
            'term_id' => ['nullable', 'integer', 'required_with:course_id', Rule::exists('aca_academic_terms', 'id')],
            'parallel' => ['nullable', 'string', 'max:50'],
            'academic_status' => ['nullable', Rule::in(['active', 'inactive', 'graduated', 'retired'])],
            'tutor_id' => ['nullable', 'integer', Rule::exists('sys_users', 'id')],
            'is_active' => ['boolean'],
        ];
    }
}
