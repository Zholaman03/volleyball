import { getLang, tr } from './i18n.jsx';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';
const TOKEN_KEY = 'vb_token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* localStorage қолжетімсіз болуы мүмкін */
  }
}

let onUnauthorized = () => {};
export function setOnUnauthorized(fn) {
  onUnauthorized = fn;
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json', 'Accept-Language': getLang() };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(tr('Серверге қосыла алмадық. Интернетті тексеріңіз.'));
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized(); // токен ескірген — шығарып жібереміз
    const firstFieldError = data.errors ? Object.values(data.errors)[0]?.[0] : null;
    const error = new Error(firstFieldError || data.message || tr('Қате орын алды. Қайта көріңіз.'));
    error.status = res.status;
    throw error;
  }

  return data;
}

/* ---- Қонақтар ---- */
export const fetchGames = async (date) =>
  (await request(`/games${date ? `?date=${date}` : ''}`)).data;

export const fetchGame = async (id) => (await request(`/games/${id}`)).data;

export const fetchParticipants = async (id) => (await request(`/games/${id}/participants`)).data;

export const registerToGame = (gameId, payload) =>
  request(`/games/${gameId}/register`, { method: 'POST', body: payload });

/* ---- Ойыншының өз тіркеуі (құпия сілтеме бойынша) ---- */
export const fetchMyRegistration = async (token) => (await request(`/registrations/${token}`)).data;
export const cancelMyRegistration = (token) => request(`/registrations/${token}/cancel`, { method: 'POST' });

/* ---- Аккаунт ---- */
export const loginRequest = (payload) => request('/auth/login', { method: 'POST', body: payload });
export const registerOrganizer = (payload) => request('/auth/register', { method: 'POST', body: payload });
export const fetchMe = () => request('/auth/me');
export const updateProfileRequest = (whatsapp_group_url) =>
  request('/auth/profile', { method: 'PUT', body: { whatsapp_group_url } });
export const logoutRequest = () => request('/auth/logout', { method: 'POST' });

/* ---- Ұйымдастырушы ---- */
export const orgGames = async () => (await request('/organizer/games')).data;
export const orgGame = async (id) => (await request(`/organizer/games/${id}`)).data;
// Жауап: { data: бірінші ойын, meta: { created: қосылған ойын саны } }
export const createGame = (payload) => request('/organizer/games', { method: 'POST', body: payload });
export const updateGame = async (id, payload) =>
  (await request(`/organizer/games/${id}`, { method: 'PUT', body: payload })).data;
export const deleteGame = (id) => request(`/organizer/games/${id}`, { method: 'DELETE' });

export const addParticipant = (gameId, payload) =>
  request(`/organizer/games/${gameId}/registrations`, { method: 'POST', body: payload });
export const setPaid = (gameId, registrationId, paid) =>
  request(`/organizer/games/${gameId}/registrations/${registrationId}`, {
    method: 'PATCH',
    body: { paid },
  });
export const promoteParticipant = (gameId, registrationId) =>
  request(`/organizer/games/${gameId}/registrations/${registrationId}/promote`, { method: 'POST' });
export const removeParticipant = (gameId, registrationId) =>
  request(`/organizer/games/${gameId}/registrations/${registrationId}`, { method: 'DELETE' });

/* ---- Админ ---- */
export const adminUsers = async () => (await request('/admin/users')).data;
export const approveUser = (id) => request(`/admin/users/${id}/approve`, { method: 'POST' });
export const revokeUser = (id) => request(`/admin/users/${id}/revoke`, { method: 'POST' });
