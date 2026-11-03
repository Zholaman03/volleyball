import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { adminUsers, approveUser, revokeUser } from '../../api';
import { useAuth } from '../../auth.jsx';
import { useLang } from '../../i18n.jsx';

export default function AdminUsers() {
  const { user } = useAuth();
  const { t } = useLang();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    adminUsers()
      .then(setUsers)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (user?.is_admin) load();
  }, [user, load]);

  if (!user?.is_admin) return <Navigate to="/organizer" replace />;

  async function act(fn, id) {
    setError('');
    try {
      await fn(id);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  const pending = (users ?? []).filter((u) => !u.approved);
  const approved = (users ?? []).filter((u) => u.approved);

  const row = (u) => (
    <div key={u.id} className="row">
      <div className="row__main">
        <div className="row__time">
          <strong>{u.name}</strong>
          <span className="row__email">{u.email}</span>
        </div>
        <div className="row__meta">{t('Ойын: {n}', { n: u.games_count })}</div>
      </div>
      <div className="row__side">
        {u.approved ? (
          <button
            className="link link--danger"
            onClick={() => {
              if (window.confirm(t('{name} бекітуін алып тастау керек пе? Жаңа ойын қоса алмайды.', { name: u.name }))) {
                act(revokeUser, u.id);
              }
            }}
          >
            {t('Бекітуді алу')}
          </button>
        ) : (
          <button className="btn" onClick={() => act(approveUser, u.id)}>
            {t('Бекіту')}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Link to="/organizer" className="back">
        {t('← Кабинет')}
      </Link>
      <div className="head">
        <h1>{t('Ұйымдастырушылар')}</h1>
      </div>

      {error && <p className="state state--error">{error}</p>}
      {!users && !error && <p className="state">{t('Жүктелуде…')}</p>}
      {users && users.length === 0 && <p className="state">{t('Әзірге ұйымдастырушы жоқ.')}</p>}

      {pending.length > 0 && (
        <section className="block">
          <h2 className="block__title">{t('Бекітуді күтіп тұр ({n})', { n: pending.length })}</h2>
          <div className="rows">{pending.map(row)}</div>
        </section>
      )}

      {approved.length > 0 && (
        <section className="block">
          <h2 className="block__title">{t('Бекітілген')}</h2>
          <div className="rows">{approved.map(row)}</div>
        </section>
      )}
    </>
  );
}
