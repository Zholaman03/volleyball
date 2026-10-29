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
          <span>{user.name}</span>
          <button className="link" onClick={logout}>
            Шығу
          </button>
        </div>
      </header>

      <Outlet />
    </div>
  );
}
