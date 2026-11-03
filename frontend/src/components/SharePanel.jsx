import { useState } from 'react';
import { useLang } from '../i18n.jsx';
import { copyText, gameUrl, whatsappShareUrl } from '../share';

/** Ұйымдастырушыға: ойынға сілтемені көшіру және WhatsApp-қа дайын хабарламамен жіберу */
export default function SharePanel({ game }) {
  const { t } = useLang();
  const url = gameUrl(game.id);
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (await copyText(url)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      window.prompt(t('Сілтемені көшіріп алыңыз'), url);
    }
  }

  return (
    <div className="share">
      <input readOnly value={url} onFocus={(e) => e.target.select()} aria-label={t('Ойынға сілтеме')} />
      <button type="button" className="btn btn--ghost" onClick={copy}>
        {copied ? t('Көшірілді ✓') : t('Көшіру')}
      </button>
      <a className="btn btn--link" href={whatsappShareUrl(game)} target="_blank" rel="noreferrer">
        {t('WhatsApp-қа жіберу')}
      </a>
    </div>
  );
}
