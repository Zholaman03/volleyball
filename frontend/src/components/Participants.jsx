import { useEffect, useState } from 'react';
import { fetchParticipants } from '../api';
import { useLang } from '../i18n.jsx';

/** Ойыншыларға арналған ашық тізім: қысқартылған аты («Айдос Н.») және жынысы. Телефон жоқ */
export default function Participants({ game, defaultOpen = false }) {
  const { t } = useLang();
  const [open, setOpen] = useState(defaultOpen);
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  // Ашық тұрғанда, біреу тіркелсе/бас тартса (сан өзгерсе) тізім жаңарады
  useEffect(() => {
    if (!open) return undefined;
    let alive = true;
    fetchParticipants(game.id)
      .then((d) => {
        if (!alive) return;
        setData(d);
        setFailed(false);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [open, game.id, game.registered_count, game.waitlist_count]);

  const gender = { male: t('Ұл'), female: t('Қыз') };
  const rows = (list) =>
    list.map((p) => (
      <li key={`${p.position}-${p.name}`}>
        <span className="plist__n">{p.position}</span>
        <span className="plist__name">{p.name}</span>
        <span className="plist__g">{gender[p.gender]}</span>
      </li>
    ));

  return (
    <div className="participants">
      <button type="button" className="link participants__toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? t('Жасыру') : t('Қатысушылар ({n})', { n: game.registered_count })}
      </button>

      {open && failed && <p className="hint">{t('Тізімді жүктеу мүмкін болмады.')}</p>}
      {open && !failed && !data && <p className="hint">{t('Жүктелуде…')}</p>}

      {open && data && (
        <>
          {data.registered.length === 0 ? (
            <p className="hint">{t('Әзірге ешкім тіркелмеген.')}</p>
          ) : (
            <ol className="plist">{rows(data.registered)}</ol>
          )}

          {data.waitlist.length > 0 && (
            <>
              <h3 className="participants__title">{t('Күту тізімі ({n})', { n: data.waitlist.length })}</h3>
              <ol className="plist plist--wait">{rows(data.waitlist)}</ol>
            </>
          )}
        </>
      )}
    </div>
  );
}
