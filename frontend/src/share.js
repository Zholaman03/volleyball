import { tr } from './i18n.jsx';
import { deadlineText, formatDate } from './utils';

const money = (price) => `${price.toLocaleString('ru-RU')} ₸`;

/** Ойынның жеке бетіне сілтеме: https://сайт/games/12 */
export function gameUrl(id) {
  return `${window.location.origin}/games/${id}`;
}

/** Хабарламаның мәтіні (сілтемесіз) */
export function shareText(game) {
  return [
    tr('Волейбол · {date}, {start}–{end}', { date: formatDate(game.play_date), start: game.start_time, end: game.end_time }),
    `${game.venue_name}, ${game.venue_address}`,
    `${game.format_label} · ${game.is_free ? tr('Тегін') : tr('{price} адам басына', { price: money(game.price) })}`,
  ].join('\n');
}

/** WhatsApp-та (топқа не адамға) жіберуге арналған дайын сілтеме */
export function whatsappShareUrl(game) {
  const text = `${shareText(game)}\n${tr('Тіркелу:')} ${gameUrl(game.id)}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Ұйымдастырушыдан қатысушыға төлем туралы хабарлама (WhatsApp чатында дайын тұрады).
 * game.payment_info бос болса, төлем жолы қосылмайды.
 */
export function paymentMessage(game, registration) {
  const lines = [
    tr('Сәлем, {name}! Сіз {date}, {start}–{end} ({venue}) волейбол ойынына тіркелдіңіз.', {
      name: registration.name,
      date: formatDate(game.play_date),
      start: game.start_time,
      end: game.end_time,
      venue: game.venue_name,
    }),
    tr('Төлем: {price}.', { price: money(game.price) }),
  ];
  if (game.payment_info) lines.push(game.payment_info);
  if (game.payment_deadline) {
    lines.push(tr('Төлемді {time}-ге дейін жасаңыз.', { time: deadlineText(game.play_date, game.payment_deadline) }));
  }
  lines.push(tr('Төлегеннен кейін чекті осы чатқа жіберіңіз. Рақмет!'));
  return lines.join('\n');
}

/** Мәтінді буферге көшіреді. Сәтсіз болса false қайтарады */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Ескі браузер немесе HTTP: қосалқы жол
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
}
