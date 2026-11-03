import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth.jsx';
import LangSwitch from '../../components/LangSwitch.jsx';
import { useLang } from '../../i18n.jsx';

export default function Login() {
  const { user, ready, login, register } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // login | register
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (ready && user) return <Navigate to="/organizer" replace />;

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const isLogin = mode === 'login';

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (isLogin) await login(form.email, form.password);
      else await register(form);
      navigate('/organizer', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page page--narrow">
      <div className="toprow">
        <Link to="/" className="toprow__link">
          {t('← Ойындарға оралу')}
        </Link>
        <LangSwitch />
      </div>

      <form className="auth" onSubmit={submit}>
        <h1>{isLogin ? t('Кіру') : t('Ұйымдастырушы болу')}</h1>
        <p className="auth__sub">
          {isLogin
            ? t('Ойындарыңызды басқару үшін кіріңіз.')
            : t('Аккаунт жасаңыз. Админ бекіткен соң өз ойындарыңызды қоса аласыз.')}
        </p>

        {!isLogin && (
          <label className="field">
            <span>{t('Аты-жөні')}</span>
            <input value={form.name} onChange={set('name')} required maxLength={100} />
          </label>
        )}

        <label className="field">
          <span>Email</span>
          <input type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
        </label>

        <label className="field">
          <span>{t('Құпия сөз')}</span>
          <input
            type="password"
            value={form.password}
            onChange={set('password')}
            required
            minLength={isLogin ? undefined : 8}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button className="btn btn--wide" disabled={busy}>
          {busy ? t('Күте тұрыңыз…') : isLogin ? t('Кіру') : t('Тіркелу')}
        </button>

        <button
          type="button"
          className="link auth__switch"
          onClick={() => {
            setMode(isLogin ? 'register' : 'login');
            setError('');
          }}
        >
          {isLogin ? t('Аккаунт жоқ па? Тіркелу') : t('Аккаунт бар ма? Кіру')}
        </button>
      </form>
    </div>
  );
}
