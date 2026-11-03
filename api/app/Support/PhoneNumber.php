<?php

namespace App\Support;

/**
 * WhatsApp нөмірін E.164 пішіміне (+77011234567) келтіреді және тексереді.
 *
 *  - Қазақстан ұялы: +7 70X, 74X, 75X, 76X, 77X
 *  - Ресей ұялы:     +7 9XX
 *  - Басқа елдер:    тек "+" және ел коды бар болса (8–15 цифр)
 *  - Қалалық нөмірлер (+7 727…, +7 7122…) қабылданбайды.
 *
 * Әр түрлі жазылған бір нөмір (+7 701…, 8 701…, 7701…) бірдей пішімге келеді,
 * сондықтан "бір ойынға бір нөмір" ережесі дұрыс жұмыс істейді.
 *
 * Ескерту: бұл тек ПІШІМДІ тексереді. Нөмірде WhatsApp шынымен бар екенін
 * тек WhatsApp Business API (OTP) арқылы растауға болады.
 *
 * frontend/src/phone.js осымен бірдей ережені қолданады — екеуін бірге өзгертіңіз.
 */
final class PhoneNumber
{
    /** +7 нөмірлері: Қазақстан ұялы немесе Ресей ұялы */
    private const KZ_RU = '/^\+7(?:7[04567]\d{8}|9\d{9})$/';

    /** +7 емес нөмірлер: халықаралық E.164 */
    private const INTERNATIONAL = '/^\+[1-9]\d{7,14}$/';

    public static function error(): string
    {
        return __('WhatsApp нөмірін дұрыс енгізіңіз. Мысалы: +7 701 123 45 67 немесе халықаралық: +996 555 123 456.');
    }

    /** Дұрыс болса E.164 қайтарады (+77011234567), әйтпесе null */
    public static function normalize(string $input): ?string
    {
        $s = trim($input);

        // Тек цифр, бос орын, сызықша, жақша, нүкте және бір "+" (басында) рұқсат
        if ($s === '' || preg_match('/[^\d\s\-().+]/', $s)) {
            return null;
        }

        $plusCount = substr_count($s, '+');
        if ($plusCount > 1 || ($plusCount === 1 && $s[0] !== '+')) {
            return null;
        }

        $digits = preg_replace('/\D/', '', $s);
        $len = strlen($digits);

        if ($s[0] === '+') {
            $e164 = '+' . $digits;
        } elseif (str_starts_with($digits, '00')) {
            $e164 = '+' . substr($digits, 2);                        // 00996555…
        } elseif ($len === 11 && ($digits[0] === '7' || $digits[0] === '8')) {
            $e164 = '+7' . substr($digits, 1);                       // 8 701…, 7 701…
        } elseif ($len === 10) {
            $e164 = '+7' . $digits;                                  // 701 123 45 67
        } else {
            return null;
        }

        $pattern = str_starts_with($e164, '+7') ? self::KZ_RU : self::INTERNATIONAL;

        return preg_match($pattern, $e164) ? $e164 : null;
    }

    public static function isValid(string $input): bool
    {
        return self::normalize($input) !== null;
    }
}
