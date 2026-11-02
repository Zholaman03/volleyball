import ShareButton from './ShareButton.jsx';

export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h} сағ ${m} мин`;
  if (h) return `${h} сағат`;
  return `${m} мин`;
}

export function formatPrice(price) {
  return `${price.toLocaleString('ru-RU')} ₸`;
}

/** closedLabel: ойын тіркеуге жабық болса (мысалы өтіп кетсе), батырмадағы жазу */
export default function GameCard({ game, onRegister, closedLabel }) {
  const percent = Math.min(100, Math.round((game.registered_count / game.capacity) * 100));
  const left = game.capacity - game.registered_count;
  const closed = Boolean(closedLabel); // тек өтіп кеткен ойын жабық; толған ойынға күту тізіміне жазылуға болады

  return (
    <article className={`card ${closed || game.is_full ? 'card--full' : ''}`}>
      <div className="card__top">
        <span className={`badge badge--${game.format}`}>{game.format_label}</span>
        <span className="card__price">
          {game.is_free ? (
            'Тегін'
          ) : (
            <>
              {formatPrice(game.price)} <small>адам басына</small>
            </>
          )}
        </span>
      </div>

      <div className="card__time">
        <strong>
          {game.start_time}–{game.end_time}
        </strong>
        <span>{formatDuration(game.duration_minutes)}</span>
      </div>

      <div className="card__venue">
        <strong>{game.venue_name}</strong>
        <span>{game.venue_address}</span>
      </div>

      <div className="spots">
        <div className="spots__row">
          <span>
            <b>
              {game.registered_count}/{game.capacity}
            </b>{' '}
            · {game.teams_count} команда
          </span>
          <span className="spots__left">
            {game.is_full
              ? game.waitlist_count > 0
                ? `Орын жоқ · күтуде: ${game.waitlist_count}`
                : 'Орын жоқ'
              : `${left} орын қалды`}
          </span>
        </div>
        <div className="bar" role="progressbar" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100">
          <div className="bar__fill" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="card__bottom">
        <span className="organizer">
          Ұйымдастырушы: <b>{game.organizer_name}</b>
        </span>
        <div className="card__actions">
          <ShareButton game={game} />
          <button className="btn" disabled={closed} onClick={onRegister}>
            {closedLabel ?? (game.is_full ? 'Күту тізімі' : 'Тіркелу')}
          </button>
        </div>
      </div>
    </article>
  );
}
