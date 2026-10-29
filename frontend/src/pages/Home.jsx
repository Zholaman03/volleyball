import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchGames } from '../api';
import GameCard from '../components/GameCard.jsx';
import RegisterModal from '../components/RegisterModal.jsx';

const FILTERS = [
  { key: 'all', label: 'Барлығы' },
  { key: 'mixed', label: 'Аралас' },
  { key: 'girls', label: 'Қыздар' },
  { key: 'boys', label: 'Ұлдар' },
  { key: '4_2', label: '4 ұл / 2 қыз' },
  { key: '2_4', label: '2 ұл / 4 қыз' },
];

export default function Home() {
  const [games, setGames] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try {
      setGames(await fetchGames());
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = filter === 'all' ? games : games.filter((g) => g.format === filter);

  const todayLabel = new Date().toLocaleDateString('kk-KZ', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  });

  return (
    <div className="page">
      <div className="toprow">
        <Link to="/organizer" className="toprow__link">
          Ұйымдастырушы кабинеті
        </Link>
      </div>

      <header className="hero">
        <span className="hero__eyebrow">Бүгін · {todayLabel}</span>
        <h1>Волейбол ойындары</h1>
        <p>Өзіңе ыңғайлы ойынды таңда да, бір минутта тіркел.</p>
      </header>

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
            <button className="link" onClick={load}>
              Қайта көру
            </button>
          </p>
        )}
        {status === 'ready' && visible.length === 0 && (
          <p className="state">Бұл формат бойынша бүгін ойын жоқ.</p>
        )}
        {status === 'ready' &&
          visible.map((game) => (
            <GameCard key={game.id} game={game} onRegister={() => setSelected(game)} />
          ))}
      </main>

      {selected && (
        <RegisterModal game={selected} onClose={() => setSelected(null)} onDone={load} />
      )}
    </div>
  );
}
