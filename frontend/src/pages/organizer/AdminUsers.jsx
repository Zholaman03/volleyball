import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { adminUsers, approveUser, revokeUser } from '../../api';
import { useAuth } from '../../auth.jsx';

export default function AdminUsers() {
  const { user } = useAuth();
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
          <span>{u.email}</span>
        </div>
        <div className="row__meta">Ойын: {u.games_count}</div>
      </div>
      <div className="row__side">
        {u.approved ? (
          <button
            className="link link--danger"
            onClick={() => {
              if (window.confirm(`${u.name} бекітуін алып тастау керек пе? Жаңа ойын қоса алмайды.`)) {
                act(revokeUser, u.id);
              }
            }}
          >
            Бекітуді алу
          </button>
        ) : (
          <button className="btn" onClick={() => act(approveUser, u.id)}>
            Бекіту
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Link to="/organizer" className="back">
        ← Кабинет
      </Link>
      <div className="head">
        <h1>Ұйымдастырушылар</h1>
      </div>

      {error && <p className="state state--error">{error}</p>}
      {!users && !error && <p className="state">Жүктелуде…</p>}
      {users && users.length === 0 && <p className="state">Әзірге ұйымдастырушы жоқ.</p>}

      {pending.length > 0 && (
        <section className="block">
          <h2 className="block__title">Бекітуді күтіп тұр ({pending.length})</h2>
          <div className="rows">{pending.map(row)}</div>
        </section>
      )}

      {approved.length > 0 && (
        <section className="block">
          <h2 className="block__title">Бекітілген</h2>
          <div className="rows">{approved.map(row)}</div>
        </section>
      )}
    </>
  );
}
