import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchGame } from '../api';
import GameCard from '../components/GameCard.jsx';
import RegisterModal from '../components/RegisterModal.jsx';
import { formatDate, todayStr } from '../utils';

/** Бір ойынның беті: сілтемемен бөлісілген ойын осында ашылады */
export default function GamePage() {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | notfound | error
  const [registering, setRegistering] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setStatus('loading');
      try {
        setGame(await fetchGame(id));
        setStatus('ready');
      } catch (err) {
        if (silent) return;
        setStatus(err.status === 404 ? 'notfound' : 'error');
      }
    },
    [id]
  );

  useEffect(() => {
    load();
  }, [load]);

  const isPast = game ? game.play_date < todayStr() : false;

  return (
    <div className="page">
      <div className="toprow toprow--left">
        <Link to="/" className="toprow__link">
          ← Барлық ойындар
        </Link>
      </div>

      <header className="hero">
        <span className="hero__eyebrow">{game ? formatDate(game.play_date) : 'Волейбол ойыны'}</span>
        <h1>Волейбол ойыны</h1>
      </header>

      <main className="list">
        {status === 'loading' && <p className="state">Жүктелуде…</p>}
        {status === 'notfound' && (
          <p className="state">
            Ойын табылмады. Ол өшірілген болуы мүмкін.{' '}
            <Link to="/" className="link">
              Басқа ойындарды көру
            </Link>
          </p>
        )}
        {status === 'error' && (
          <p className="state state--error">
            Серверге қосыла алмадық.{' '}
            <button className="link" onClick={() => load()}>
              Қайта көру
            </button>
          </p>
        )}
        {status === 'ready' && (
          <GameCard
            game={game}
            closedLabel={isPast ? 'Өтіп кетті' : undefined}
            onRegister={() => setRegistering(true)}
          />
        )}
      </main>

      {registering && game && (
        <RegisterModal game={game} onClose={() => setRegistering(false)} onDone={() => load(true)} />
      )}
    </div>
  );
}
