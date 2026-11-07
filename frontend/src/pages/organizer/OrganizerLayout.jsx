import { Link, Navigate, Outlet } from 'react-router-dom';
import LangSwitch from '../../components/LangSwitch.jsx';
import { useAuth } from '../../auth.jsx';
import { useLang } from '../../i18n.jsx';

export default function OrganizerLayout() {
  const { user, ready, logout } = useAuth();
  const { t } = useLang();

  if (!ready) return <p className="state">{t('Жүктелуде…')}</p>;
  if (!user) return <Navigate to="/organizer/login" replace />;

  return (
    <div className="page">
      <header className="topbar">
        <Link to="/organizer" className="topbar__brand">
          {t('Кабинет')}
        </Link>
        <div className="topbar__right">
          {user.is_admin && (
            <Link to="/organizer/admin" className="link">
              {t('Админ')}
            </Link>
          )}
          <Link to="/organizer/profile" className="link">
            {t('Профиль')}
          </Link>
          <span>{user.name}</span>
          <button className="link" onClick={logout}>
            {t('Шығу')}
          </button>
          <LangSwitch />
        </div>
      </header>

      {user.approved ? (
        <Outlet />
      ) : (
        <div className="state">
          <h2>{t('Аккаунт бекітуді күтуде')}</h2>
          <p>{t('Админ аккаунтыңызды бекіткен соң ойын қоса аласыз. Бекітілгенде бетті жаңартыңыз немесе қайта кіріңіз.')}</p>
        </div>
      )}
    </div>
  );
}
