import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  fetchMe,
  getToken,
  loginRequest,
  logoutRequest,
  registerOrganizer,
  setOnUnauthorized,
  setToken,
} from './api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(() => !getToken()); // токен жоқ болса, күтудің қажеті жоқ

  const clear = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setOnUnauthorized(clear);
    if (!getToken()) return;
    fetchMe()
      .then(setUser)
      .catch(clear)
      .finally(() => setReady(true));
  }, [clear]);

  const value = useMemo(
    () => ({
      user,
      ready,
      async login(email, password) {
        const { token, user } = await loginRequest({ email, password });
        setToken(token);
        setUser(user);
      },
      async register(payload) {
        const { token, user } = await registerOrganizer(payload);
        setToken(token);
        setUser(user);
      },
      async logout() {
        try {
          await logoutRequest();
        } catch {
          /* токен бәрібір жергілікті өшіріледі */
        }
        clear();
      },
    }),
    [user, ready, clear]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
