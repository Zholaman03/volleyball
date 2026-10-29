import { normalizePhone } from './phone';

export const FORMAT_OPTIONS = [
  ['mixed', 'Аралас (қыз-бала)'],
  ['girls', 'Тек қыздар'],
  ['boys', 'Тек ұлдар'],
  ['4_2', '4/2 (4 ұл, 2 қыз)'],
  ['2_4', '2/4 (2 ұл, 4 қыз)'],
];

export const DURATIONS = [60, 90, 120, 150, 180];

export const TEAM_SIZE = 6;

/** Бүгінгі күн YYYY-MM-DD форматында (браузердің жергілікті уақытымен) */
export function todayStr() {
  return new Date().toLocaleDateString('sv-SE');
}

export function formatDate(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('kk-KZ', { day: 'numeric', month: 'long', weekday: 'short' });
}

/* ---- WhatsApp нөмірі ---- */

export const PHONE_PREFIX = '+7 ';

/**
 * Нөмірді жазып жатқанда пішімдейді: +7 701 123 45 67.
 * Басқа ел нөмірі үшін «+» және сандар қалады.
 */
export function formatPhoneInput(raw) {
  let digits = raw.replace(/\D/g, '');
  if (!digits) return raw.trim().startsWith('+') ? '+' : '';

  // Өрісті толық жауып, ұлттық нөмірді қойса: 701… → 7 701…
  if (!raw.trim().startsWith('+')) {
    if (digits.length === 10) digits = `7${digits}`;
    if (digits[0] === '8') digits = `7${digits.slice(1)}`;
  }

  if (digits[0] !== '7') return `+${digits.slice(0, 15)}`;

  digits = digits.slice(0, 11);
  const parts = [digits.slice(1, 4), digits.slice(4, 7), digits.slice(7, 9), digits.slice(9, 11)].filter(Boolean);
  return `+7${parts.length ? ` ${parts.join(' ')}` : ''}`;
}

/** Сервердегі ережемен бірдей (phone.js): KZ ұялы (70X, 74X–77X), RU ұялы (9XX) немесе «+» бар халықаралық нөмір */
export function isValidWhatsApp(value) {
  return normalizePhone(value) !== null;
}

/** wa.me сілтемесі (ұйымдастырушы жазу үшін) */
export function whatsappLink(phone) {
  return `https://wa.me/${phone.replace(/\D/g, '')}`;
}
