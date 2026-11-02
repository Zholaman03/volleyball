import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createGame, orgGame, updateGame } from '../../api';
import { formatDuration } from '../../components/GameCard.jsx';
import { DURATIONS, FORMAT_OPTIONS, TEAM_SIZE, computeDeadline, deadlineText, formatDate, todayStr } from '../../utils';

// Төлем мерзімі: ойынға неше сағат қалғанға дейін
const DEADLINE_OPTIONS = [1, 2, 3, 6, 12, 24, 48];

const EMPTY = {
  format: 'mixed',
  play_date: todayStr(),
  start_time: '20:00',
  duration_minutes: 120,
  venue_name: '',
  venue_address: '',
  price: 1800,
  payment_info: '',
  payment_deadline_hours: '',
  teams_count: 3,
};

// Ойынды қанша апта қайталау (backend-те ең көбі 12)
const REPEAT_OPTIONS = [0, 1, 2, 3, 4, 7, 11];

function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString('sv-SE'); // YYYY-MM-DD
}

/** Көшірілген ойынның жаңа күні: сол апта күні, бірақ бұрынғы күннен кейін және бүгіннен бұрын емес */
function nextWeekly(iso) {
  const today = todayStr();
  let next = addDays(iso, 7);
  while (next < today) next = addDays(next, 7);
  return next;
}

function toForm(g, playDate) {
  return {
    format: g.format,
    play_date: playDate,
    start_time: g.start_time,
    duration_minutes: g.duration_minutes,
    venue_name: g.venue_name,
    venue_address: g.venue_address,
    price: g.price === 0 ? 1800 : g.price,
    payment_info: g.payment_info ?? '',
    payment_deadline_hours: g.payment_deadline_hours ?? '',
    teams_count: g.teams_count,
  };
}

export default function GameForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const copyFrom = searchParams.get('from');

  const isEdit = Boolean(id);
  const isCopy = !isEdit && Boolean(copyFrom);
  const sourceId = isEdit ? id : copyFrom;
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [free, setFree] = useState(false);
  const [repeat, setRepeat] = useState(0);
  const [loading, setLoading] = useState(Boolean(sourceId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sourceId) return;
    orgGame(sourceId)
      .then((g) => {
        setForm(toForm(g, isEdit ? g.play_date : nextWeekly(g.play_date)));
        setFree(g.price === 0);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sourceId, isEdit]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const payload = {
      ...form,
      duration_minutes: Number(form.duration_minutes),
      price: free ? 0 : Number(form.price),
      payment_info: free ? '' : form.payment_info,
      payment_deadline_hours: free || form.payment_deadline_hours === '' ? null : Number(form.payment_deadline_hours),
      teams_count: Number(form.teams_count),
    };
    try {
      if (isEdit) {
        const saved = await updateGame(id, payload);
        navigate(`/organizer/games/${saved.id}`);
      } else {
        const res = await createGame({ ...payload, repeat_weeks: repeat });
        const created = res.meta?.created ?? 1;
        // Бірнеше ойын қосылса — тізімге, біреу болса — сол ойынның бетіне
        navigate(created > 1 ? '/organizer' : `/organizer/games/${res.data.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="state">Жүктелуде…</p>;

  const teams = Number(form.teams_count);
  const total = repeat + 1;
  const lastDate = form.play_date ? addDays(form.play_date, 7 * repeat) : '';
  const deadline = computeDeadline(form.play_date, form.start_time, Number(form.payment_deadline_hours));

  return (
    <>
      <div className="head">
        <h1>{isEdit ? 'Ойынды өзгерту' : isCopy ? 'Ойынды көшіру' : 'Жаңа ойын'}</h1>
      </div>

      {isCopy && !error && (
        <p className="hint hint--block">
          Бұрынғы ойынның мәліметтері көшірілді, күні келесі аптаға ауыстырылды. Қажет болса өзгертіңіз.
        </p>
      )}

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

        <label className="check">
          <input type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} />
          <span>Тегін ойын</span>
        </label>

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
          {!free && (
            <label className="field">
              <span>Құны, ₸ (адам басына)</span>
              <input type="number" min="1" step="100" value={form.price} onChange={set('price')} required />
            </label>
          )}
        </div>

        <label className="field">
          <span>Зал атауы</span>
          <input type="text" value={form.venue_name} onChange={set('venue_name')} required maxLength={120} />
        </label>

        <label className="field">
          <span>Зал мекенжайы</span>
          <input type="text" value={form.venue_address} onChange={set('venue_address')} required maxLength={255} />
        </label>

        {!free && (
          <>
            <label className="field">
              <span>Төлем мәліметі (міндетті емес)</span>
              <input
                type="text"
                value={form.payment_info}
                onChange={set('payment_info')}
                placeholder="Kaspi: +7 701 123 45 67 (Ерлан А.)"
                maxLength={255}
              />
              <small className="hint">Ойыншы тіркелгеннен кейін осыны көреді. Ашық тізімде көрсетілмейді.</small>
            </label>

            <label className="field">
              <span>Төлем мерзімі (міндетті емес)</span>
              <select value={form.payment_deadline_hours} onChange={set('payment_deadline_hours')}>
                <option value="">Мерзімсіз</option>
                {DEADLINE_OPTIONS.map((h) => (
                  <option key={h} value={h}>
                    Ойынға {h} сағат қалғанға дейін
                  </option>
                ))}
              </select>
              <small className="hint">
                {deadline
                  ? `Төлеу керек: ${deadlineText(form.play_date, deadline)}-ге дейін. Орын өздігінен босамайды, мерзімі өткен төлемсіздер тек белгіленеді.`
                  : 'Ойыншыға тіркелгеннен кейін көрсетіледі.'}
              </small>
            </label>
          </>
        )}

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

        {!isEdit && (
          <label className="field">
            <span>Апта сайын қайталау</span>
            <select value={repeat} onChange={(e) => setRepeat(Number(e.target.value))}>
              {REPEAT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? 'Қайталамау' : `Тағы ${n} апта`}
                </option>
              ))}
            </select>
            {repeat > 0 && form.play_date && (
              <small className="hint">
                Барлығы {total} ойын қосылады: {formatDate(form.play_date)} → {formatDate(lastDate)}. Әрқайсысына
                тіркелу бөлек жүреді.
              </small>
            )}
          </label>
        )}

        {error && <p className="form-error">{error}</p>}

        <div className="form__actions">
          <Link
            to={isEdit ? `/organizer/games/${id}` : isCopy ? `/organizer/games/${copyFrom}` : '/organizer'}
            className="btn btn--ghost btn--link"
          >
            Бас тарту
          </Link>
          <button className="btn" disabled={busy}>
            {busy ? 'Сақталуда…' : isEdit ? 'Сақтау' : total > 1 ? `${total} ойын қосу` : 'Ойын қосу'}
          </button>
        </div>
      </form>
    </>
  );
}
