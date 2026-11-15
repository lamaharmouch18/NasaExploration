// client/src/App.jsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, getToken, setToken } from './api';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import ProfilePage from './components/ProfilePage';
import SpaceBackground from './components/SpaceBackground';
import { Logo, Spinner } from './ui';

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(getToken()));
  const [view, setView] = useState('dashboard'); // dashboard | profile
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const flash = useCallback((text, type = 'ok') => {
    setToast({ text, type });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 5000);
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
    setView('dashboard');
  }, []);

  // Restore the session after a page refresh.
  useEffect(() => {
    if (!getToken()) return;
    api('/auth/me')
      .then((res) => setUser(res.user))
      .catch(() => setToken(null))
      .finally(() => setChecking(false));
  }, []);

  // The API helper fires this when a token expires.
  useEffect(() => {
    window.addEventListener('ahm-auth-expired', signOut);
    return () => window.removeEventListener('ahm-auth-expired', signOut);
  }, [signOut]);

  if (checking) {
    return (
      <div className="grid min-h-screen place-content-center justify-items-center gap-4 text-muted">
        <Logo className="h-14 w-14" />
        <p className="inline-flex items-center gap-2"><Spinner />Connecting to Mission Control…</p>
      </div>
    );
  }
  if (!user) return <AuthScreen onAuth={(u, msg) => { setUser(u); setView('dashboard'); if (msg) flash(msg); }} />;

  return (
    <div className="relative min-h-screen">
      <SpaceBackground variant="calm" />
      <div className="relative z-10">
        <Navbar user={user} view={view} onHome={() => setView('dashboard')} onProfile={() => setView('profile')} onSignOut={signOut} />

        <div aria-live="polite" className="pointer-events-none fixed right-4 top-20 z-40 max-w-[min(420px,calc(100vw-32px))]">
          {toast && (
            <div className={`rounded-xl border px-4 py-2.5 shadow-2xl shadow-black/40 ${toast.type === 'error' ? 'border-critical bg-[#35131c]' : 'border-nominal bg-[#0f2b27]'}`}>
              {toast.text}
            </div>
          )}
        </div>

        {view === 'profile'
          ? <ProfilePage user={user} onUserUpdate={setUser} onFlash={flash} onBack={() => setView('dashboard')} />
          // key makes the dashboard reload from scratch when a different person signs in
          : <Dashboard key={user.id} user={user} onFlash={flash} onSignOut={signOut} />}
      </div>
    </div>
  );
}
