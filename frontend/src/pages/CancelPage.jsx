import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { cancelMyRegistration, fetchMyRegistration } from '../api';
import { deadlineText, formatDate } from '../utils';

const STATUS_TEXT = {
  active: 'Сіз ойынға тіркелгенсіз',
  waitlist: 'Сіз күту тізіміндесіз',
  cancelled: 'Тіркеу бас тартылған',
};

/** /cancel/<token>: ойыншы өз тіркеуін көреді және аккаунтсыз бас тарта алады */
export default function CancelPage() {
  const { token } = useParams();
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
    if (!window.confirm('Тіркеуден бас тартасыз ба?')) return;
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
          ← Барлық ойындар
        </Link>
      </div>

      <header className="hero">
        <span className="hero__eyebrow">Менің тіркеуім</span>
        <h1>Бас тарту</h1>
      </header>

      <main className="list">
        {state === 'loading' && <p className="state">Жүктелуде…</p>}
        {state === 'notfound' && <p className="state">Сілтеме дұрыс емес немесе тіркеу табылмады.</p>}
        {state === 'error' && <p className="state state--error">Серверге қосыла алмадық. Кейінірек қайта көріңіз.</p>}

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
              {STATUS_TEXT[reg.status]}
              {reg.status === 'waitlist' && reg.waitlist_position ? ` (№${reg.waitlist_position})` : ''}.
            </p>

            {notice && <p className="hint hint--block">{notice}</p>}
            {error && <p className="form-error">{error}</p>}

            {reg.can_cancel && (
              <>
                <button className="btn btn--wide" onClick={cancel} disabled={busy}>
                  {busy ? 'Күтіңіз…' : 'Тіркеуден бас тарту'}
                </button>
                {reg.status === 'active' && (
                  <p className="hint">Бас тартуға болады: {deadlineText(game.play_date, reg.cancel_deadline)}-ге дейін.</p>
                )}
              </>
            )}

            {!reg.can_cancel && reg.status !== 'cancelled' && (
              <p className="hint hint--block">
                Бас тарту мерзімі өтті. Ұйымдастырушыға (<b>{game.organizer_name}</b>) WhatsApp-та жазыңыз.
              </p>
            )}

            {reg.status === 'cancelled' && reg.paid && (
              <p className="hint hint--block">
                Төлем жасаған болсаңыз, ұйымдастырушы <b>{game.organizer_name}</b> сізбен хабарласады.
              </p>
            )}
          </article>
        )}
      </main>
    </div>
  );
}
