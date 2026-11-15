// client/src/api.js
// One small helper for every call to the backend.
// In development the "proxy" setting in package.json forwards /api to port 5000.
// In production the Express server hosts this app, so the same origin is used.
// If you host the frontend somewhere else, set REACT_APP_API_URL at build time.

const BASE = process.env.REACT_APP_API_URL || '';
const TOKEN_KEY = 'ahm_token';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) =>
  token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);

export async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (err) {
    throw new ApiError('Cannot reach the server. Please check that the backend is running.', 0);
  }

  let data = {};
  let isJson = true;
  try {
    data = await res.json();
  } catch (err) {
    isJson = false; // empty or non-JSON response (for example a dev-proxy error page)
  }

  if (!res.ok || data.success === false) {
    if (res.status === 401 && token && path !== '/auth/login') {
      window.dispatchEvent(new Event('ahm-auth-expired'));
    }
    let message = data.message || `Request failed (${res.status})`;
    if (!isJson && res.status >= 500) {
      message = 'The backend did not answer properly. Check that it is running (cd server && npm run dev).';
    } else if (res.status === 404 && data.message === 'Unknown API route.') {
      // The server answered, but it does not know this route: it is an older copy of the backend.
      message = 'The running backend is out of date and does not know this feature. Stop it and start it again (cd server && npm run dev).';
    }
    const error = new ApiError(message, res.status);
    error.data = data;
    throw error;
  }
  return data;
}

// Downloads a file (PDF) from the backend with the login token and saves it on the computer.
export async function downloadFile(path, fallbackName) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  } catch (err) {
    throw new ApiError('Cannot reach the server. Please check that the backend is running.', 0);
  }
  if (!res.ok) throw new ApiError(`Could not create the report (${res.status}).`, res.status);
  const match = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') || '');
  saveBlob(await res.blob(), match ? match[1] : fallbackName);
}

export function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
