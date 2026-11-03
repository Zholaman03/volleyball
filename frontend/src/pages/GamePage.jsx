import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchGame } from '../api';
import { useLang } from '../i18n.jsx';
import GameCard from '../components/GameCard.jsx';
import LangSwitch from '../components/LangSwitch.jsx';
import RegisterModal from '../components/RegisterModal.jsx';
import { formatDate, todayStr } from '../utils';

/** Бір ойынның беті: сілтемемен бөлісілген ойын осында ашылады */
export default function GamePage() {
  const { id } = useParams();
  const { t } = useLang();
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
          {t('← Барлық ойындар')}
        </Link>
        <LangSwitch />
      </div>

      <header className="hero">
        <span className="hero__eyebrow">{game ? formatDate(game.play_date) : t('Волейбол ойыны')}</span>
        <h1>{t('Волейбол ойыны')}</h1>
      </header>

      <main className="list list--one">
        {status === 'loading' && <p className="state">{t('Жүктелуде…')}</p>}
        {status === 'notfound' && (
          <p className="state">
            {t('Ойын табылмады. Ол өшірілген болуы мүмкін.')}{' '}
            <Link to="/" className="link">
              {t('Басқа ойындарды көру')}
            </Link>
          </p>
        )}
        {status === 'error' && (
          <p className="state state--error">
            {t('Серверге қосыла алмадық.')}{' '}
            <button className="link" onClick={() => load()}>
              {t('Қайта көру')}
            </button>
          </p>
        )}
        {status === 'ready' && (
          <GameCard
            game={game}
            closedLabel={isPast ? t('Өтіп кетті') : undefined}
            participantsOpen
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
