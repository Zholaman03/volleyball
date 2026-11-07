import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth.jsx';
import { useLang } from '../../i18n.jsx';
import { isValidGroupUrl } from '../../utils';

/** Ұйымдастырушының профилі: ойыншылар жаңалықтарды көретін WhatsApp тобының сілтемесі */
export default function Profile() {
  const { t } = useLang();
  const { user, updateProfile } = useAuth();
  const [url, setUrl] = useState(user.whatsapp_group_url ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const value = url.trim();
    if (value && !isValidGroupUrl(value)) {
      setError(t('Сілтеме https://chat.whatsapp.com/... түрінде болуы керек.'));
      return;
    }
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      await updateProfile(value);
      setUrl(value);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Link to="/organizer" className="back">
        {t('← Барлық ойындар')}
      </Link>

      <div className="head">
        <h1>{t('Профиль')}</h1>
      </div>

      <form className="form" onSubmit={submit}>
        <label className={`field ${error ? 'field--error' : ''}`}>
          <span>{t('WhatsApp топ сілтемесі')}</span>
          <input
            type="url"
            inputMode="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setSaved(false);
              setError('');
            }}
            placeholder="https://chat.whatsapp.com/..."
            maxLength={255}
            autoComplete="off"
          />
          {error && <small className="field__error">{error}</small>}
        </label>

        <p className="hint hint--block">
          {t('Ойыншылар тіркелгенде осы сілтемені көреді және топқа қосылуға шақырылады. Ойын бас тартылса немесе уақыты ауысса, хабарды осы топқа жазасыз.')}
        </p>
        <p className="hint hint--block">
          {t('Сілтемені алу: WhatsApp → топты ашыңыз → топ атауы → «Сілтеме арқылы шақыру» → «Сілтемені көшіру». Топқа сілтеме арқылы кіруге болатынын тексеріңіз.')}
        </p>

        <div className="form__actions">
          {isValidGroupUrl(user.whatsapp_group_url ?? '') && (
            <a className="btn btn--ghost btn--link" href={user.whatsapp_group_url} target="_blank" rel="noreferrer">
              {t('Сілтемені ашып тексеру')}
            </a>
          )}
          <button className="btn" disabled={busy}>
            {busy ? t('Күтіңіз…') : saved ? t('Сақталды ✓') : t('Сақтау')}
          </button>
        </div>
      </form>
    </>
  );
}
