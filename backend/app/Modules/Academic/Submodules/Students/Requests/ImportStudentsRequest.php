<?php

namespace App\Modules\Academic\Submodules\Students\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/**
 * Validation rules for the CSV student import.
 *
 * Expected format (UTF-8, manual uploads must escape the header):
 *   document_number, first_name, last_name, birth_date
 *   1712345678,      María,        José,      2015-03-12
 *   ...
 *
 * The optional enrollment is provided with the request, not inside the file.
 */
class ImportStudentsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('import_students');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, string|ValidationRule>>
     */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:2048'],
            'separator' => ['required', Rule::in([',', ';'])],
            'course_id' => ['sometimes', 'integer', 'exists:aca_courses,id', 'required_with:term_id'],
            'term_id' => ['sometimes', 'integer', 'exists:aca_academic_terms,id', 'required_with:course_id'],
        ];
    }
}
