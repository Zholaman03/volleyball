import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orgGames } from '../../api';
import { formatDate, todayStr } from '../../utils';

function GameRow({ game }) {
  return (
    <Link to={`/organizer/games/${game.id}`} className="row">
      <div className="row__main">
        <div className="row__time">
          <strong>
            {game.start_time}–{game.end_time}
          </strong>
          <span>{formatDate(game.play_date)}</span>
        </div>
        <div className="row__meta">
          {game.format_label} · {game.venue_name}
        </div>
      </div>
      <div className="row__side">
        <b>
          {game.registered_count}/{game.capacity}
        </b>
        <span>{game.is_free ? 'тегін' : `${game.paid_count} төледі`}</span>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [games, setGames] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    orgGames()
      .then(setGames)
      .catch((e) => setError(e.message));
  }, []);

  const today = todayStr();
  const upcoming = (games ?? [])
    .filter((g) => g.play_date >= today)
    .sort((a, b) => `${a.play_date}${a.start_time}`.localeCompare(`${b.play_date}${b.start_time}`));
  const past = (games ?? []).filter((g) => g.play_date < today);

  return (
    <>
      <div className="head">
        <h1>Менің ойындарым</h1>
        <Link to="/organizer/games/new" className="btn btn--link">
          + Ойын қосу
        </Link>
      </div>

      {error && <p className="state state--error">{error}</p>}
      {!games && !error && <p className="state">Жүктелуде…</p>}

      {games && games.length === 0 && (
        <p className="state">Әзірге ойын жоқ. «Ойын қосу» батырмасын басыңыз.</p>
      )}

      {upcoming.length > 0 && (
        <section className="block">
          <h2 className="block__title">Алдағы ойындар</h2>
          <div className="rows">
            {upcoming.map((g) => (
              <GameRow key={g.id} game={g} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="block">
          <h2 className="block__title">Өткен ойындар</h2>
          <div className="rows rows--past">
            {past.map((g) => (
              <GameRow key={g.id} game={g} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
