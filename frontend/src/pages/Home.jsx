import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchGames } from '../api';
import GameCard from '../components/GameCard.jsx';
import RegisterModal from '../components/RegisterModal.jsx';
import { todayStr } from '../utils';

const FILTERS = [
  { key: 'all', label: 'Барлығы' },
  { key: 'mixed', label: 'Аралас' },
  { key: 'girls', label: 'Қыздар' },
  { key: 'boys', label: 'Ұлдар' },
  { key: '4_2', label: '4 ұл / 2 қыз' },
  { key: '2_4', label: '2 ұл / 4 қыз' },
];

const DAYS_AHEAD = 7;

function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString('sv-SE'); // YYYY-MM-DD
}

function buildDays(today) {
  return Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const iso = addDays(today, i);
    const d = new Date(`${iso}T00:00:00`);
    return {
      iso,
      top:
        i === 0
          ? 'Бүгін'
          : i === 1
            ? 'Ертең'
            : d.toLocaleDateString('kk-KZ', { weekday: 'short' }),
      day: d.getDate(),
      long: d.toLocaleDateString('kk-KZ', { day: 'numeric', month: 'long', weekday: 'long' }),
    };
  });
}

export default function Home() {
  const today = useMemo(() => todayStr(), []);
  const days = useMemo(() => buildDays(today), [today]);

  const [date, setDate] = useState(today);
  const [games, setGames] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  // Күнді жылдам ауыстырғанда ескі жауап жаңасын басып кетпеуі үшін
  const requestId = useRef(0);

  /** silent: тізімді «Жүктелуде…» деп жылтыңдатпай, фонда жаңартады */
  const load = useCallback(
    async (silent = false) => {
      const id = ++requestId.current;
      if (!silent) setStatus('loading');
      try {
        const data = await fetchGames(date);
        if (id !== requestId.current) return;
        setGames(data);
        setStatus('ready');
      } catch {
        if (id === requestId.current && !silent) setStatus('error');
      }
    },
    [date]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Бетке қайта оралғанда (мысалы ұйымдастырушы жаңа ойын қосқаннан кейін) тізімді жаңартамыз
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') load(true);
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [load]);

  const visible = filter === 'all' ? games : games.filter((g) => g.format === filter);
  const current = days.find((d) => d.iso === date) ?? days[0];
  const eyebrow = date === today ? `Бүгін · ${current.long}` : current.long;

  return (
    <div className="page">
      <div className="toprow">
        <Link to="/organizer" className="toprow__link">
          Ұйымдастырушы кабинеті
        </Link>
      </div>

      <header className="hero">
        <span className="hero__eyebrow">{eyebrow}</span>
        <h1>Волейбол ойындары</h1>
        <p>Өзіңе ыңғайлы ойынды таңда да, бір минутта тіркел.</p>
      </header>

      <nav className="days" aria-label="Күнді таңдау">
        {days.map((d) => (
          <button
            key={d.iso}
            className={`day ${d.iso === date ? 'day--active' : ''}`}
            onClick={() => setDate(d.iso)}
            aria-pressed={d.iso === date}
          >
            <span>{d.top}</span>
            <b>{d.day}</b>
          </button>
        ))}
      </nav>

      <nav className="filters" aria-label="Ойын форматы">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`chip ${filter === f.key ? 'chip--active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </nav>

      <main className="list">
        {status === 'loading' && <p className="state">Жүктелуде…</p>}
        {status === 'error' && (
          <p className="state state--error">
            Серверге қосыла алмадық.{' '}
            <button className="link" onClick={() => load()}>
              Қайта көру
            </button>
          </p>
        )}
        {status === 'ready' && games.length === 0 && (
          <p className="state">
            {date === today ? 'Бүгін ойын жоқ.' : 'Бұл күні ойын жоқ.'} Басқа күнді таңдап көріңіз.
          </p>
        )}
        {status === 'ready' && games.length > 0 && visible.length === 0 && (
          <p className="state">Бұл формат бойынша ойын жоқ.</p>
        )}
        {status === 'ready' &&
          visible.map((game) => (
            <GameCard key={game.id} game={game} onRegister={() => setSelected(game)} />
          ))}
      </main>

      {selected && (
        <RegisterModal game={selected} onClose={() => setSelected(null)} onDone={() => load(true)} />
      )}
    </div>
  );
}
