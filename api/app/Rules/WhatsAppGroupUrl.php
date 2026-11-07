<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/** WhatsApp тобына шақыру сілтемесі: https://chat.whatsapp.com/<код> (соңында ?mode=... болуы мүмкін) */
class WhatsAppGroupUrl implements ValidationRule
{
    public const PATTERN = '#^https://chat\.whatsapp\.com/[A-Za-z0-9_-]{10,40}(\?[^\s]*)?$#';

    public static function isValid(string $value): bool
    {
        return (bool) preg_match(self::PATTERN, $value);
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ! self::isValid($value)) {
            $fail(__('Сілтеме https://chat.whatsapp.com/... түрінде болуы керек.'));
        }
    }
}
