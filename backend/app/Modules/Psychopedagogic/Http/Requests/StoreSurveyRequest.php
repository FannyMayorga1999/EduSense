<?php

namespace App\Modules\Psychopedagogic\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/**
 * Validation rules for creating a survey.
 */
class StoreSurveyRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('create_surveys');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, string|ValidationRule>>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:2000'],
            'evaluation_area' => ['required', Rule::in(['reading_writing', 'math', 'attention', 'motor'])],
            'is_active' => ['boolean'],
            'questions' => ['required', 'array', 'min:1'],
            'questions.*.statement' => ['required', 'string', 'max:500'],
            'questions.*.alert_weight' => ['nullable', 'integer', 'min:1', 'max:5'],
        ];
    }
}
