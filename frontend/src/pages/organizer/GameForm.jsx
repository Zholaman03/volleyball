import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createGame, orgGame, updateGame } from '../../api';
import { formatDuration } from '../../components/GameCard.jsx';
import { DURATIONS, FORMAT_OPTIONS, TEAM_SIZE, todayStr } from '../../utils';

const EMPTY = {
  format: 'mixed',
  play_date: todayStr(),
  start_time: '20:00',
  duration_minutes: 120,
  venue_name: '',
  venue_address: '',
  price: 1800,
  teams_count: 3,
};

export default function GameForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    orgGame(id)
      .then((g) =>
        setForm({
          format: g.format,
          play_date: g.play_date,
          start_time: g.start_time,
          duration_minutes: g.duration_minutes,
          venue_name: g.venue_name,
          venue_address: g.venue_address,
          price: g.price,
          teams_count: g.teams_count,
        })
      )
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const payload = {
      ...form,
      duration_minutes: Number(form.duration_minutes),
      price: Number(form.price),
      teams_count: Number(form.teams_count),
    };
    try {
      const saved = isEdit ? await updateGame(id, payload) : await createGame(payload);
      navigate(`/organizer/games/${saved.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="state">Жүктелуде…</p>;

  const teams = Number(form.teams_count);

  return (
    <>
      <div className="head">
        <h1>{isEdit ? 'Ойынды өзгерту' : 'Жаңа ойын'}</h1>
      </div>

      <form className="form" onSubmit={submit}>
        <label className="field">
          <span>Формат</span>
          <select value={form.format} onChange={set('format')}>
            {FORMAT_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <div className="form__grid">
          <label className="field">
            <span>Күні</span>
            <input type="date" value={form.play_date} onChange={set('play_date')} required />
          </label>
          <label className="field">
            <span>Басталу уақыты</span>
            <input type="time" value={form.start_time} onChange={set('start_time')} required />
          </label>
        </div>

        <div className="form__grid">
          <label className="field">
            <span>Ұзақтығы</span>
            <select value={form.duration_minutes} onChange={set('duration_minutes')}>
              {DURATIONS.map((m) => (
                <option key={m} value={m}>
                  {formatDuration(m)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Құны, ₸ (адам басына)</span>
            <input type="number" min="0" step="100" value={form.price} onChange={set('price')} required />
          </label>
        </div>

        <label className="field">
          <span>Зал атауы</span>
          <input type="text" value={form.venue_name} onChange={set('venue_name')} required maxLength={120} />
        </label>

        <label className="field">
          <span>Зал мекенжайы</span>
          <input type="text" value={form.venue_address} onChange={set('venue_address')} required maxLength={255} />
        </label>

        <label className="field">
          <span>Командалар саны</span>
          <select value={form.teams_count} onChange={set('teams_count')}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <small className="hint">
            Орын саны: {teams * TEAM_SIZE} ({teams} команда × {TEAM_SIZE})
          </small>
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="form__actions">
          <Link to={isEdit ? `/organizer/games/${id}` : '/organizer'} className="btn btn--ghost btn--link">
            Бас тарту
          </Link>
          <button className="btn" disabled={busy}>
            {busy ? 'Сақталуда…' : isEdit ? 'Сақтау' : 'Ойын қосу'}
          </button>
        </div>
      </form>
    </>
  );
}
