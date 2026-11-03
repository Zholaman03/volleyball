import { useState } from 'react';
import { useLang } from '../i18n.jsx';
import { copyText, gameUrl, shareText } from '../share';

/**
 * «Бөлісу»: телефонда жүйенің бөлісу терезесін ашады (WhatsApp, Telegram…),
 * ал мүмкін болмаса сілтемені буферге көшіреді.
 */
export default function ShareButton({ game }) {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = gameUrl(game.id);

    if (navigator.share) {
      try {
        await navigator.share({ title: t('Волейбол ойыны'), text: shareText(game), url });
      } catch {
        /* пайдаланушы терезені жапты */
      }
      return;
    }

    if (await copyText(url)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      window.prompt(t('Сілтемені көшіріп алыңыз'), url);
    }
  }

  return (
    <button type="button" className="btn btn--ghost btn--icon" onClick={share} title={t('Бөлісу')}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {copied ? (
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        ) : (
          <>
            <path d="M12 15V3.5" />
            <path d="M7.5 8L12 3.5 16.5 8" />
            <path d="M5 12v6.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V12" />
          </>
        )}
      </svg>
      <span className="btn__label">{copied ? t('Көшірілді ✓') : t('Бөлісу')}</span>
    </button>
  );
}
