import { dateLocale } from './i18n.jsx';
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
  return d.toLocaleDateString(dateLocale(), { day: 'numeric', month: 'long', weekday: 'short' });
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

/** wa.me сілтемесі (ұйымдастырушы жазу үшін). text берілсе, чатта дайын хабарлама тұрады */
export function whatsappLink(phone, text) {
  const base = `https://wa.me/${phone.replace(/\D/g, '')}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/**
 * Төлем мерзімін есептейді: ойынның басталуына `hours` сағат қалғанда.
 * Қайтарады "YYYY-MM-DD HH:MM" (серверден келетін пішіммен бірдей) немесе null.
 */
export function computeDeadline(playDate, startTime, hours) {
  if (!playDate || !startTime || !hours) return null;
  const start = new Date(`${playDate}T${startTime}:00`);
  if (Number.isNaN(start.getTime())) return null;
  const d = new Date(start.getTime() - hours * 3600 * 1000);
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${d.toLocaleDateString('sv-SE')} ${time}`;
}

/** "2026-11-05 20:00" → "20:00" (ойын күні сол болса) немесе "4 қараша, 20:00" */
export function deadlineText(playDate, deadline) {
  const [date, time] = deadline.split(' ');
  return date === playDate ? time : `${formatDate(date)}, ${time}`;
}
