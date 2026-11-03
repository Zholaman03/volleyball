import { tr, useLang } from '../i18n.jsx';
import { TEAM_SIZE } from '../utils';
import Participants from './Participants.jsx';
import ShareButton from './ShareButton.jsx';

export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return tr('{h} сағ {m} мин', { h, m });
  if (h) return tr('{h} сағат', { h });
  return tr('{m} мин', { m });
}

export function formatPrice(price) {
  return `${price.toLocaleString('ru-RU')} ₸`;
}

/** Орындар: әр команда — 6 нүкте. Толған орын — қара нүкте. Командалық құрылым бірден көрінеді */
function Dots({ taken, capacity }) {
  const teams = Math.ceil(capacity / TEAM_SIZE);
  return (
    <div className="dots" role="img" aria-label={`${taken}/${capacity}`}>
      {Array.from({ length: teams }, (_, team) => (
        <span className="dots__team" key={team}>
          {Array.from({ length: TEAM_SIZE }, (_, i) => {
            const n = team * TEAM_SIZE + i;
            if (n >= capacity) return null;
            return <i key={i} className={n < taken ? 'dot dot--on' : 'dot'} />;
          })}
        </span>
      ))}
    </div>
  );
}

/** closedLabel: ойын тіркеуге жабық болса (мысалы өтіп кетсе), батырмадағы жазу */
export default function GameCard({ game, onRegister, closedLabel, participantsOpen = false }) {
  const { t } = useLang();
  const left = game.capacity - game.registered_count;
  const closed = Boolean(closedLabel); // тек өтіп кеткен ойын жабық; толған ойынға күту тізіміне жазылуға болады

  return (
    <article className={`card ${closed || game.is_full ? 'card--full' : ''}`}>
      <div className="card__top">
        <span className={`badge badge--${game.format}`}>{game.format_label}</span>
        <span className="card__price">
          {game.is_free ? (
            t('Тегін')
          ) : (
            <>
              {formatPrice(game.price)} <small>{t('адам басына')}</small>
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
        <Dots taken={game.registered_count} capacity={game.capacity} />
        <div className="spots__row">
          <span>
            <b>
              {game.registered_count}/{game.capacity}
            </b>{' '}
            · {t('{n} команда', { n: game.teams_count })}
          </span>
          <span className={`spots__left ${!game.is_full && left <= 3 ? 'spots__left--low' : ''}`}>
            {game.is_full
              ? game.waitlist_count > 0
                ? t('Орын жоқ · күтуде: {n}', { n: game.waitlist_count })
                : t('Орын жоқ')
              : t('{n} орын қалды', { n: left })}
          </span>
        </div>
      </div>

      <Participants game={game} defaultOpen={participantsOpen} />

      <div className="card__bottom">
        <span className="organizer">
          {t('Ұйымдастырушы:')} <b>{game.organizer_name}</b>
        </span>
        <div className="card__actions">
          <ShareButton game={game} />
          <button className="btn" disabled={closed} onClick={onRegister}>
            {closedLabel ?? (game.is_full ? t('Күту тізімі') : t('Тіркелу'))}
          </button>
        </div>
      </div>
    </article>
  );
}
