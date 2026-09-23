<?php

namespace App\Modules\Psychopedagogic\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/**
 * Validation rules for creating a diagnostic.
 */
class StoreDiagnosticRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('create_diagnostics');
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
            'nee_category_id' => ['required', 'integer', Rule::exists('psy_nee_categories', 'id')],
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:2000'],
            'severity' => ['required', Rule::in(['low', 'moderate', 'high'])],
            'detected_at' => ['nullable', 'date'],
        ];
    }
}
