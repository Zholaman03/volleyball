import { formatDate } from './utils';

const money = (price) => `${price.toLocaleString('ru-RU')} ₸`;

/** Ойынның жеке бетіне сілтеме: https://сайт/games/12 */
export function gameUrl(id) {
  return `${window.location.origin}/games/${id}`;
}

/** Хабарламаның мәтіні (сілтемесіз) */
export function shareText(game) {
  return [
    `Волейбол · ${formatDate(game.play_date)}, ${game.start_time}–${game.end_time}`,
    `${game.venue_name}, ${game.venue_address}`,
    `${game.format_label} · ${money(game.price)} адам басына`,
  ].join('\n');
}

/** WhatsApp-та (топқа не адамға) жіберуге арналған дайын сілтеме */
export function whatsappShareUrl(game) {
  const text = `${shareText(game)}\nТіркелу: ${gameUrl(game.id)}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Ұйымдастырушыдан қатысушыға төлем туралы хабарлама (WhatsApp чатында дайын тұрады).
 * game.payment_info бос болса, төлем жолы қосылмайды.
 */
export function paymentMessage(game, registration) {
  const lines = [
    `Сәлем, ${registration.name}! Сіз ${formatDate(game.play_date)}, ${game.start_time}–${game.end_time} (${game.venue_name}) волейбол ойынына тіркелдіңіз.`,
    `Төлем: ${money(game.price)}.`,
  ];
  if (game.payment_info) lines.push(game.payment_info);
  lines.push('Төлегеннен кейін чекті осы чатқа жіберіңіз. Рақмет!');
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
