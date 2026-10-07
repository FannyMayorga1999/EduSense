<?php

namespace App\Modules\Academic\Submodules\Students\Requests\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validates a student document number, ignoring the formatting separators
 * the user may have typed.
 */
class ValidDocumentNumber implements ValidationRule
{
    /**
     * Minimum amount of digits accepted by a document number.
     */
    private const MIN_DIGITS = 7;

    /**
     * Maximum amount of digits accepted by a document number.
     */
    private const MAX_DIGITS = 10;

    /**
     * Run the validation rule.
     *
     * @param  Closure(string): void  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $digits = preg_replace('/\D/', '', (string) $value);

        if (! is_string($digits)) {
            $fail('The :attribute must be a valid document number.');

            return;
        }

        $length = strlen($digits);

        if ($length < self::MIN_DIGITS || $length > self::MAX_DIGITS) {
            $fail('The :attribute must have between '.self::MIN_DIGITS.' and '.self::MAX_DIGITS.' digits.');
        }
    }
}
