import { Link, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth.jsx';

export default function OrganizerLayout() {
  const { user, ready, logout } = useAuth();

  if (!ready) return <p className="state">Жүктелуде…</p>;
  if (!user) return <Navigate to="/organizer/login" replace />;

  return (
    <div className="page">
      <header className="topbar">
        <Link to="/organizer" className="topbar__brand">
          Кабинет
        </Link>
        <div className="topbar__right">
          {user.is_admin && (
            <Link to="/organizer/admin" className="link">
              Админ
            </Link>
          )}
          <span>{user.name}</span>
          <button className="link" onClick={logout}>
            Шығу
          </button>
        </div>
      </header>

      {user.approved ? (
        <Outlet />
      ) : (
        <div className="state">
          <h2>Аккаунт бекітуді күтуде</h2>
          <p>
            Админ аккаунтыңызды бекіткен соң ойын қоса аласыз. Бекітілгенде бетті жаңартыңыз немесе қайта кіріңіз.
          </p>
        </div>
      )}
    </div>
  );
}
