import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { cancelMyRegistration, fetchMyRegistration } from '../api';
import LangSwitch from '../components/LangSwitch.jsx';
import { useLang } from '../i18n.jsx';
import { deadlineText, formatDate } from '../utils';

const STATUS_TEXT = {
  active: 'Сіз ойынға тіркелгенсіз',
  waitlist: 'Сіз күту тізіміндесіз',
  cancelled: 'Тіркеу бас тартылған',
};

/** /cancel/<token>: ойыншы өз тіркеуін көреді және аккаунтсыз бас тарта алады */
export default function CancelPage() {
  const { token } = useParams();
  const { t, tx } = useLang();
  const [reg, setReg] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | notfound | error
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    fetchMyRegistration(token)
      .then((data) => {
        setReg(data);
        setState('ready');
      })
      .catch((err) => setState(err.status === 404 ? 'notfound' : 'error'));
  }, [token]);

  async function cancel() {
    if (!window.confirm(t('Тіркеуден бас тартасыз ба?'))) return;
    setBusy(true);
    setError('');
    try {
      const res = await cancelMyRegistration(token);
      setReg(res.data);
      setNotice(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const game = reg?.game;

  return (
    <div className="page">
      <div className="toprow toprow--left">
        <Link to="/" className="toprow__link">
          {t('← Барлық ойындар')}
        </Link>
        <LangSwitch />
      </div>

      <header className="hero">
        <span className="hero__eyebrow">{t('Менің тіркеуім')}</span>
        <h1>{t('Бас тарту')}</h1>
      </header>

      <main className="list list--one">
        {state === 'loading' && <p className="state">{t('Жүктелуде…')}</p>}
        {state === 'notfound' && <p className="state">{t('Сілтеме дұрыс емес немесе тіркеу табылмады.')}</p>}
        {state === 'error' && (
          <p className="state state--error">{t('Серверге қосыла алмадық. Кейінірек қайта көріңіз.')}</p>
        )}

        {state === 'ready' && (
          <article className="card">
            <div className="card__top">
              <span className="badge">{game.format_label}</span>
              <span className="card__price">{reg.name}</span>
            </div>

            <div className="card__time">
              <strong>
                {game.start_time}–{game.end_time}
              </strong>
              <span>{formatDate(game.play_date)}</span>
            </div>

            <div className="card__venue">
              <strong>{game.venue_name}</strong>
              <span>{game.venue_address}</span>
            </div>

            <p className="hint hint--block">
              {t(STATUS_TEXT[reg.status])}
              {reg.status === 'waitlist' && reg.waitlist_position ? ` (№${reg.waitlist_position})` : ''}.
            </p>

            {notice && <p className="hint hint--block">{notice}</p>}
            {error && <p className="form-error">{error}</p>}

            {reg.can_cancel && (
              <>
                <button className="btn btn--wide" onClick={cancel} disabled={busy}>
                  {busy ? t('Күтіңіз…') : t('Тіркеуден бас тарту')}
                </button>
                {reg.status === 'active' && (
                  <p className="hint">
                    {t('Бас тартуға болады: {time}-ге дейін.', { time: deadlineText(game.play_date, reg.cancel_deadline) })}
                  </p>
                )}
              </>
            )}

            {!reg.can_cancel && reg.status !== 'cancelled' && (
              <p className="hint hint--block">
                {tx('Бас тарту мерзімі өтті. Ұйымдастырушыға ({name}) WhatsApp-та жазыңыз.', {
                  name: <b>{game.organizer_name}</b>,
                })}
              </p>
            )}

            {reg.status === 'cancelled' && reg.paid && (
              <p className="hint hint--block">
                {tx('Төлем жасаған болсаңыз, ұйымдастырушы {name} сізбен хабарласады.', {
                  name: <b>{game.organizer_name}</b>,
                })}
              </p>
            )}
          </article>
        )}
      </main>
    </div>
  );
}
