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
    <button type="button" className="btn btn--ghost" onClick={share}>
      {copied ? t('Көшірілді ✓') : t('Бөлісу')}
    </button>
  );
}
