<?php

namespace App\Modules\Students\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;
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
        Validator::extend('valid_document', function ($attribute, $value, $parameters, $validator) {
            $length = preg_replace('/\D/', '', (string) $value);

            return is_string($length) && strlen($length) >= 7 && strlen($length) <= 10;
        });

        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'birth_date' => ['required', 'date', 'before:today'],
            'document_number' => ['required', 'valid_document', Rule::unique('std_students', 'document_number')],
            'tutor_id' => ['nullable', 'integer', Rule::exists('sys_users', 'id')],
            'is_active' => ['boolean'],
        ];
    }
}
