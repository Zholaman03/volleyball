/**
 * WhatsApp нөмірін E.164 пішіміне (+77011234567) келтіреді және тексереді.
 * Backend-тегі App\Support\PhoneNumber::normalize()-пен БІРДЕЙ ереже — екеуін бірге өзгертіңіз.
 *
 *  - Қазақстан ұялы: +7 70X, 74X, 75X, 76X, 77X
 *  - Ресей ұялы:     +7 9XX
 *  - Басқа елдер:    тек "+" және ел коды бар болса (8–15 цифр)
 *  - Қалалық нөмірлер (+7 727…, +7 7122…) қабылданбайды.
 *
 * Ескерту: бұл тек ПІШІМДІ тексереді, нөмірде WhatsApp шынымен бар екенін емес.
 */

/** +7 нөмірлері: Қазақстан ұялы немесе Ресей ұялы */
const KZ_RU = /^\+7(?:7[04567]\d{8}|9\d{9})$/;

/** +7 емес нөмірлер: халықаралық E.164 */
const INTERNATIONAL = /^\+[1-9]\d{7,14}$/;

/** Дұрыс болса E.164 қайтарады (+77011234567), әйтпесе null */
export function normalizePhone(input) {
  const s = (input ?? '').trim();

  // Тек цифр, бос орын, сызықша, жақша, нүкте және бір "+" (басында) рұқсат
  if (!s || /[^\d\s\-().+]/.test(s)) return null;

  const plusCount = (s.match(/\+/g) ?? []).length;
  if (plusCount > 1 || (plusCount === 1 && s[0] !== '+')) return null;

  const digits = s.replace(/\D/g, '');

  let e164;
  if (s[0] === '+') {
    e164 = `+${digits}`;
  } else if (digits.startsWith('00')) {
    e164 = `+${digits.slice(2)}`; // 00996555…
  } else if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8')) {
    e164 = `+7${digits.slice(1)}`; // 8 701…, 7 701…
  } else if (digits.length === 10) {
    e164 = `+7${digits}`; // 701 123 45 67
  } else {
    return null;
  }

  const pattern = e164.startsWith('+7') ? KZ_RU : INTERNATIONAL;
  return pattern.test(e164) ? e164 : null;
}
