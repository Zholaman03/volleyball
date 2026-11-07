import { useLang } from '../i18n.jsx';
import { isValidGroupUrl } from '../utils';

/** Ұйымдастырушының WhatsApp тобына шақыру. Сілтеме жарамсыз болса, ештеңе көрсетпейді */
export default function GroupBlock({ url, title, text, cta, primary = false }) {
  const { t } = useLang();
  if (!isValidGroupUrl(url ?? '')) return null;

  return (
    <div className="group">
      <strong>{title ?? t('WhatsApp тобы')}</strong>
      <p>{text}</p>
      <a className={`btn btn--link ${primary ? '' : 'btn--ghost'}`} href={url} target="_blank" rel="noreferrer">
        {cta ?? t('WhatsApp тобына қосылу')}
      </a>
    </div>
  );
}
