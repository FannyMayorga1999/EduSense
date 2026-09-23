<?php

namespace App\Modules\System\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * Validation rules for updating a platform user.
 */
class UpdateUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('manage_roles');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, string|ValidationRule>>
     */
    public function rules(): array
    {
        $userId = $this->route('user');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('sys_users', 'email')->ignore($userId)],
            'password' => ['sometimes', 'confirmed', Password::min(8)->letters()->mixedCase()->numbers()],
            'roles' => ['sometimes', 'array'],
            'roles.*' => ['integer', Rule::exists('sys_roles', 'id')],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
