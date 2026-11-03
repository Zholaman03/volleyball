<?php

namespace App\Support;

/** Қатысушының атын ашық тізімде көрсетуге арналған қысқартылған түрі */
class DisplayName
{
    /**
     * «Айдос Нұрлан Ерболұлы» → «Айдос Н.», «Айдос» → «Айдос».
     * Тек аты мен екінші сөздің бас әрпі қалады, сонда толық аты-жөні ашық көрінбейді.
     */
    public static function short(string $name): string
    {
        $parts = preg_split('/\s+/u', trim($name), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        if ($parts === []) {
            return '';
        }

        $first = mb_substr($parts[0], 0, 30);

        if (count($parts) === 1) {
            return $first;
        }

        return $first.' '.mb_strtoupper(mb_substr($parts[1], 0, 1)).'.';
    }
}
