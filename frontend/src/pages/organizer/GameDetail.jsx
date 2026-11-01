import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { addParticipant, deleteGame, orgGame, removeParticipant, setPaid } from '../../api';
import { formatDuration, formatPrice } from '../../components/GameCard.jsx';
import { normalizePhone } from '../../phone';
import {
  PHONE_PREFIX,
  formatDate,
  formatPhoneInput,
  isValidWhatsApp,
  whatsappLink,
} from '../../utils';

const GENDER = { male: 'Ұл', female: 'Қыз' };

function genderFull(game, gender) {
  const slot = game[gender];
  return slot.limit !== null && slot.registered >= slot.limit;
}

function AddParticipant({ game, onAdded }) {
  const firstFree = ['male', 'female'].find((g) => !genderFull(game, g)) ?? '';
  const [form, setForm] = useState({ name: '', phone: PHONE_PREFIX, gender: firstFree });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setPhone = (e) => setForm((f) => ({ ...f, phone: formatPhoneInput(e.target.value) }));

  async function submit(e) {
    e.preventDefault();
    if (!isValidWhatsApp(form.phone)) {
      setError('WhatsApp нөмірін дұрыс енгізіңіз, мысалы: +7 701 123 45 67.');
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

  if (game.is_full) return <p className="hint">Барлық орын толды.</p>;

  return (
    <form className="add" onSubmit={submit}>
      <input placeholder="Аты" value={form.name} onChange={set('name')} required maxLength={100} />
      <input placeholder="WhatsApp +7 701 123 45 67" inputMode="tel" value={form.phone} onChange={setPhone} required />
      <select value={form.gender} onChange={set('gender')} required>
        {['male', 'female'].map((g) => (
          <option key={g} value={g} disabled={genderFull(game, g)}>
            {GENDER[g]}
            {genderFull(game, g) ? ' (толды)' : ''}
          </option>
        ))}
      </select>
      <button className="btn" disabled={busy || !form.gender}>
        Қосу
      </button>
      {error && <p className="form-error add__error">{error}</p>}
    </form>
  );
}

export default function GameDetail() {
  const { id } = useParams();
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
      ? `Ойында ${game.registered_count} адам тіркелген. Ойынды өшіргенде тізім де өшеді. Жалғастырасыз ба?`
      : 'Ойынды өшіресіз бе?';
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
        {error} <Link to="/organizer" className="link">Кабинетке оралу</Link>
      </p>
    ) : (
      <p className="state">Жүктелуде…</p>
    );
  }

  const collected = game.paid_count * game.price;
  const expected = game.registered_count * game.price;

  return (
    <>
      <Link to="/organizer" className="back">
        ← Барлық ойындар
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
            Көшіру
          </Link>
          <Link to={`/organizer/games/${game.id}/edit`} className="btn btn--ghost btn--link">
            Өзгерту
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

      <div className="stats">
        <div className="stat">
          <b>
            {game.registered_count}/{game.capacity}
          </b>
          <span>тіркелді</span>
        </div>
        <div className="stat">
          <b>
            {game.paid_count}/{game.registered_count}
          </b>
          <span>төледі</span>
        </div>
        <div className="stat">
          <b>{formatPrice(collected)}</b>
          <span>жиналды · барлығы {formatPrice(expected)}</span>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <section className="block">
        <h2 className="block__title">Қатысушылар</h2>

        {game.registrations.length === 0 ? (
          <p className="state state--tight">Әзірге ешкім тіркелмеген.</p>
        ) : (
          <ul className="people">
            {game.registrations.map((r, i) => (
              <li key={r.id} className="person">
                <span className="person__n">{i + 1}</span>
                <div className="person__info">
                  <strong>{r.name}</strong>
                  <a href={whatsappLink(r.phone)} target="_blank" rel="noreferrer">
                    {formatPhoneInput(r.phone)} · WhatsApp
                  </a>
                </div>
                <span className="person__gender">{GENDER[r.gender]}</span>
                <button
                  className={`paid ${r.paid ? 'paid--yes' : ''}`}
                  onClick={() => run(() => setPaid(game.id, r.id, !r.paid))}
                >
                  {r.paid ? 'Төленді' : 'Төленбеді'}
                </button>
                <button
                  className="icon-btn"
                  aria-label={`${r.name} өшіру`}
                  onClick={() => {
                    if (window.confirm(`${r.name} тізімнен шығарылсын ба?`)) {
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

      <section className="block">
        <h2 className="block__title">Қолмен қосу</h2>
        <AddParticipant game={game} onAdded={load} />
      </section>

      <button className="link link--danger" onClick={removeGame}>
        Ойынды өшіру
      </button>
    </>
  );
}
