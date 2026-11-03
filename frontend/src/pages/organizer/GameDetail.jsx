import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  addParticipant,
  deleteGame,
  orgGame,
  promoteParticipant,
  removeParticipant,
  setPaid,
} from '../../api';
import { formatDuration, formatPrice } from '../../components/GameCard.jsx';
import { useLang } from '../../i18n.jsx';
import SharePanel from '../../components/SharePanel.jsx';
import { paymentMessage } from '../../share';
import { normalizePhone } from '../../phone';
import {
  PHONE_PREFIX,
  deadlineText,
  formatDate,
  formatPhoneInput,
  isValidWhatsApp,
  whatsappLink,
} from '../../utils';

const GENDER = { male: 'Ұл', female: 'Қыз' }; // t(GENDER[…]) түрінде көрсетіледі

function genderFull(game, gender) {
  const slot = game[gender];
  return slot.limit !== null && slot.registered >= slot.limit;
}

function AddParticipant({ game, onAdded }) {
  const { t } = useLang();
  const firstFree = ['male', 'female'].find((g) => !genderFull(game, g)) ?? '';
  const [form, setForm] = useState({ name: '', phone: PHONE_PREFIX, gender: firstFree });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setPhone = (e) => setForm((f) => ({ ...f, phone: formatPhoneInput(e.target.value) }));

  async function submit(e) {
    e.preventDefault();
    if (!isValidWhatsApp(form.phone)) {
      setError(t('WhatsApp нөмірін дұрыс енгізіңіз, мысалы: +7 701 123 45 67.'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      await addParticipant(game.id, { ...form, phone: normalizePhone(form.phone) });
      setForm({ name: '', phone: PHONE_PREFIX, gender: form.gender });
      await onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (game.is_full) return <p className="hint">{t('Барлық орын толды.')}</p>;

  return (
    <form className="add" onSubmit={submit}>
      <input placeholder={t('Аты')} value={form.name} onChange={set('name')} required maxLength={100} />
      <input placeholder={t('WhatsApp +7 701 123 45 67')} inputMode="tel" value={form.phone} onChange={setPhone} required />
      <select value={form.gender} onChange={set('gender')} required>
        {['male', 'female'].map((g) => (
          <option key={g} value={g} disabled={genderFull(game, g)}>
            {t(GENDER[g])}
            {genderFull(game, g) ? ` (${t('толды')})` : ''}
          </option>
        ))}
      </select>
      <button className="btn" disabled={busy || !form.gender}>
        {t('Қосу')}
      </button>
      {error && <p className="form-error add__error">{error}</p>}
    </form>
  );
}

export default function GameDetail() {
  const { id } = useParams();
  const { t } = useLang();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setGame(await orgGame(id));
    } catch (e) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(action) {
    setError('');
    try {
      await action();
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function removeGame() {
    const warn = game.registered_count
      ? t('Ойында {n} адам тіркелген. Ойынды өшіргенде тізім де өшеді. Жалғастырасыз ба?', { n: game.registered_count })
      : t('Ойынды өшіресіз бе?');
    if (!window.confirm(warn)) return;
    try {
      await deleteGame(id);
      navigate('/organizer', { replace: true });
    } catch (e) {
      setError(e.message);
    }
  }

  if (!game) {
    return error ? (
      <p className="state state--error">
        {error} <Link to="/organizer" className="link">
          {t('Кабинетке оралу')}
        </Link>
      </p>
    ) : (
      <p className="state">{t('Жүктелуде…')}</p>
    );
  }

  const collected = game.paid_count * game.price;
  const expected = game.registered_count * game.price;

  return (
    <>
      <Link to="/organizer" className="back">
        {t('← Барлық ойындар')}
      </Link>

      <div className="head head--top">
        <div>
          <h1>
            {game.start_time}–{game.end_time}
          </h1>
          <p className="head__sub">
            {formatDate(game.play_date)} · {formatDuration(game.duration_minutes)}
          </p>
        </div>
        <div className="head__actions">
          <Link to={`/organizer/games/new?from=${game.id}`} className="btn btn--ghost btn--link">
            {t('Көшіру')}
          </Link>
          <Link to={`/organizer/games/${game.id}/edit`} className="btn btn--ghost btn--link">
            {t('Өзгерту')}
          </Link>
        </div>
      </div>

      <div className="info">
        <span className="badge">{game.format_label}</span>
        <div>
          <strong>{game.venue_name}</strong>
          <span className="info__line">{game.venue_address}</span>
        </div>
      </div>

      <p className="pay-line">
        {game.is_free
          ? t('Тегін ойын: төлем қажет емес.')
          : [
              game.payment_info
                ? t('Төлем: {info}', { info: game.payment_info })
                : t('Төлем мәліметі жоқ. «Өзгерту» арқылы Kaspi нөмірін қосыңыз.'),
              game.payment_deadline &&
                `${t('Мерзімі: {time}', { time: deadlineText(game.play_date, game.payment_deadline) })}${game.payment_overdue ? ` (${t('өтті')})` : ''}`,
            ]
              .filter(Boolean)
              .join(' · ')}
      </p>

      <div className={`stats ${game.is_free ? 'stats--one' : ''}`}>
        <div className="stat">
          <b>
            {game.registered_count}/{game.capacity}
          </b>
          <span>{t('тіркелді')}</span>
        </div>
        {!game.is_free && (
          <>
            <div className="stat">
              <b>
                {game.paid_count}/{game.registered_count}
              </b>
              <span>{t('төледі')}</span>
            </div>
            <div className="stat">
              <b>{formatPrice(collected)}</b>
              <span>{t('жиналды · барлығы {sum}', { sum: formatPrice(expected) })}</span>
            </div>
          </>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}

      <section className="block">
        <h2 className="block__title">{t('Ойынға сілтеме')}</h2>
        <SharePanel game={game} />
      </section>

      <section className="block">
        <h2 className="block__title">{t('Қатысушылар')}</h2>

        {game.registrations.length === 0 ? (
          <p className="state state--tight">{t('Әзірге ешкім тіркелмеген.')}</p>
        ) : (
          <ul className="people">
            {game.registrations.map((r, i) => (
              <li key={r.id} className="person">
                <span className="person__n">{i + 1}</span>
                <div className="person__info">
                  <strong>{r.name}</strong>
                  <a
                    href={whatsappLink(r.phone, game.is_free || r.paid ? undefined : paymentMessage(game, r))}
                    target="_blank"
                    rel="noreferrer"
                    title={game.is_free || r.paid ? t('WhatsApp-та жазу') : t('Төлем туралы WhatsApp-та жазу')}
                  >
                    {formatPhoneInput(r.phone)}
                    <span className="person__act"> · {game.is_free || r.paid ? 'WhatsApp' : t('төлемді еске салу')}</span>
                  </a>
                </div>
                <span className="person__gender">{t(GENDER[r.gender])}</span>
                {!game.is_free && (
                  <button
                    className={`paid ${r.paid ? 'paid--yes' : game.payment_overdue ? 'paid--late' : ''}`}
                    onClick={() => run(() => setPaid(game.id, r.id, !r.paid))}
                  >
                    {r.paid ? t('Төленді') : game.payment_overdue ? t('Мерзімі өтті') : t('Төленбеді')}
                  </button>
                )}
                <button
                  className="icon-btn"
                  aria-label={t('{name} өшіру', { name: r.name })}
                  onClick={() => {
                    if (window.confirm(t('{name} тізімнен шығарылсын ба?', { name: r.name }))) {
                      run(() => removeParticipant(game.id, r.id));
                    }
                  }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {game.waitlist.length > 0 && (
        <section className="block">
          <h2 className="block__title">{t('Күту тізімі')}</h2>
          <ul className="people">
            {game.waitlist.map((r, i) => {
              const hasSpot = !game.is_full && !genderFull(game, r.gender);
              const msg = t('Сәлем, {name}! {date}, {time} волейбол ойынында орын босады. Келесіз бе?', {
                name: r.name,
                date: formatDate(game.play_date),
                time: game.start_time,
              });
              return (
                <li key={r.id} className="person">
                  <span className="person__n">{i + 1}</span>
                  <div className="person__info">
                    <strong>{r.name}</strong>
                    <a href={whatsappLink(r.phone, msg)} target="_blank" rel="noreferrer">
                      {formatPhoneInput(r.phone)}
                      <span className="person__act"> · {t('орын босады деп жазу')}</span>
                    </a>
                  </div>
                  <span className="person__gender">{t(GENDER[r.gender])}</span>
                  <button
                    className="paid"
                    disabled={!hasSpot}
                    title={hasSpot ? '' : t('Бос орын жоқ')}
                    onClick={() => run(() => promoteParticipant(game.id, r.id))}
                  >
                    {t('Ойынға қосу')}
                  </button>
                  <button
                    className="icon-btn"
                    aria-label={t('{name} өшіру', { name: r.name })}
                    onClick={() => {
                      if (window.confirm(t('{name} күту тізімінен шығарылсын ба?', { name: r.name }))) {
                        run(() => removeParticipant(game.id, r.id));
                      }
                    }}
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {game.cancelled.length > 0 && (
        <section className="block">
          <h2 className="block__title">{t('Бас тартқандар')}</h2>
          <ul className="people people--muted">
            {game.cancelled.map((r) => (
              <li key={r.id} className="person">
                <div className="person__info">
                  <strong>{r.name}</strong>
                  <a href={whatsappLink(r.phone)} target="_blank" rel="noreferrer">
                    {formatPhoneInput(r.phone)} · WhatsApp
                  </a>
                </div>
                <span className={r.paid ? 'refund' : 'person__gender'}>{r.paid ? t('Төлемді қайтару керек') : t(GENDER[r.gender])}</span>
                <button
                  className="icon-btn"
                  aria-label={t('{name} жазбасын өшіру', { name: r.name })}
                  title={r.paid ? t('Ақша қайтарылған соң өшіріңіз') : t('Жазбаны өшіру')}
                  onClick={() => {
                    if (window.confirm(t('{name} жазбасы өшірілсін бе?', { name: r.name }))) {
                      run(() => removeParticipant(game.id, r.id));
                    }
                  }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="block">
        <h2 className="block__title">{t('Қолмен қосу')}</h2>
        <AddParticipant game={game} onAdded={load} />
      </section>

      <button className="link link--danger" onClick={removeGame}>
        {t('Ойынды өшіру')}
      </button>
    </>
  );
}
