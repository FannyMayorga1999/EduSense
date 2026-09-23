<?php

namespace App\Modules\Academic\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/**
 * Validation rules for updating an enrollment.
 */
class UpdateEnrollmentRequest extends FormRequest
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
            'course_id' => ['sometimes', 'integer', Rule::exists('aca_courses', 'id')],
            'status' => ['sometimes', Rule::in(['active', 'completed', 'retired'])],
            'enrolled_at' => ['nullable', 'date'],
        ];
    }
}
