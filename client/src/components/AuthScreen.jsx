// client/src/components/AuthScreen.jsx
import { useState } from 'react';
import { api, setToken } from '../api';
import { KeyRound, LogIn, Mail, UserPlus } from '../icons';
import { Spinner, btnLink, btnPrimary, errorCls, inputCls, labelCls, noticeCls } from '../ui';
import Landing from './Landing';
import SpaceBackground from './SpaceBackground';

const ROLES = ['Flight Specialist', 'Commander', 'Pilot', 'Flight Engineer', 'Mission Specialist'];

const TITLES = {
  signin: 'Sign in to Mission Control',
  signup: 'Create your astronaut account',
  forgot: 'Reset your password',
  reset: 'Choose a new password'
};
const SUBMIT_LABEL = { signin: 'Sign in', signup: 'Create account', forgot: 'Send reset code', reset: 'Update password' };

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('signin'); // signin | signup | forgot | reset
  const [form, setForm] = useState({ name: '', email: '', password: '', role: ROLES[0], otp: '', newPassword: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function go(nextMode, message = '') {
    setMode(nextMode);
    setError('');
    setNotice(message);
  }

  function finishLogin(res) {
    setToken(res.token);
    onAuth(res.user, res.message);
  }

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'signin') {
        finishLogin(await api('/auth/login', { method: 'POST', body: { email: form.email, password: form.password } }));
      } else if (mode === 'signup') {
        finishLogin(await api('/auth/signup', { method: 'POST', body: { name: form.name, email: form.email, password: form.password, role: form.role } }));
      } else if (mode === 'forgot') {
        const res = await api('/auth/forgot-password', { method: 'POST', body: { email: form.email } });
        go('reset', res.message);
      } else if (mode === 'reset') {
        const res = await api('/auth/reset-password', { method: 'POST', body: { email: form.email, otp: form.otp, newPassword: form.newPassword } });
        setForm((f) => ({ ...f, password: '', otp: '', newPassword: '' }));
        go('signin', res.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const SubmitIcon = { signin: LogIn, signup: UserPlus, forgot: Mail, reset: KeyRound }[mode];

  return (
    <>
      <SpaceBackground variant="hero" />
      <Landing>
        <section aria-labelledby="auth-title" className="w-full rounded-2xl border border-line bg-panel/90 p-7 shadow-2xl shadow-black/50 backdrop-blur-md">
          <h2 id="auth-title" className="mb-5 text-xl font-bold">{TITLES[mode]}</h2>

          <form onSubmit={submit} noValidate>
            {mode === 'signup' && (
              <>
                <label className={labelCls}><span>Full name</span><input className={inputCls} value={form.name} onChange={update('name')} autoComplete="name" required /></label>
                <label className={labelCls}>
                  <span>Mission role</span>
                  <select className={inputCls} value={form.role} onChange={update('role')}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
                </label>
              </>
            )}

            <label className={labelCls}>
              <span>Email</span>
              <input className={inputCls} type="email" value={form.email} onChange={update('email')} autoComplete="email" required readOnly={mode === 'reset'} />
            </label>

            {(mode === 'signin' || mode === 'signup') && (
              <label className={labelCls}>
                <span>Password{mode === 'signup' && <em className="text-xs not-italic text-muted"> (min. 8 characters)</em>}</span>
                <input className={inputCls} type="password" value={form.password} onChange={update('password')} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required />
              </label>
            )}

            {mode === 'reset' && (
              <>
                <label className={labelCls}>
                  <span>6-digit reset code</span>
                  <input className={`${inputCls} text-center text-2xl tracking-[.4em]`} value={form.otp} onChange={update('otp')} inputMode="numeric" maxLength={6} pattern="[0-9]*" autoComplete="one-time-code" required />
                </label>
                <label className={labelCls}>
                  <span>New password <em className="text-xs not-italic text-muted">(min. 8 characters)</em></span>
                  <input className={inputCls} type="password" value={form.newPassword} onChange={update('newPassword')} autoComplete="new-password" required />
                </label>
              </>
            )}

            {notice && <p className={noticeCls} role="status">{notice}</p>}
            {error && <p className={errorCls} role="alert">{error}</p>}

            <button className={`${btnPrimary} mt-2 w-full`} type="submit" disabled={busy}>
              {busy ? <Spinner /> : <SubmitIcon className="h-4 w-4" aria-hidden="true" />}{busy ? 'Please wait…' : SUBMIT_LABEL[mode]}
            </button>
          </form>

          <div className="mt-3.5 flex flex-wrap justify-between gap-3">
            {mode === 'signin' && (
              <>
                <button type="button" className={btnLink} onClick={() => go('signup')}>Create an account</button>
                <button type="button" className={btnLink} onClick={() => go('forgot')}>Forgot password?</button>
              </>
            )}
            {mode === 'signup' && <button type="button" className={btnLink} onClick={() => go('signin')}>I already have an account</button>}
            {(mode === 'forgot' || mode === 'reset') && <button type="button" className={btnLink} onClick={() => go('signin')}>Back to sign in</button>}
          </div>
        </section>
      </Landing>
    </>
  );
}
