<?php

namespace App\Modules\Psychopedagogic\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/**
 * Validation rules for updating a survey and its questions.
 */
class UpdateSurveyRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('edit_surveys');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, string|ValidationRule>>
     */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:2000'],
            'evaluation_area' => ['sometimes', Rule::in(['reading_writing', 'math', 'attention', 'motor'])],
            'is_active' => ['sometimes', 'boolean'],
            'questions' => ['sometimes', 'array'],
            'questions.*.id' => ['nullable', 'integer'],
            'questions.*.statement' => ['required_with:questions', 'string', 'max:500'],
            'questions.*.alert_weight' => ['nullable', 'integer', 'min:1', 'max:5'],
            'deleted_questions' => ['sometimes', 'array'],
            'deleted_questions.*' => ['integer'],
        ];
    }
}
