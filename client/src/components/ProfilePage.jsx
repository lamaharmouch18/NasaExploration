// client/src/components/ProfilePage.jsx
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { ArrowLeft, KeyRound, Save } from '../icons';
import {
  Spinner, btnGhost, btnPrimary, errorCls, inputCls, initials, labelCls, panelCls
} from '../ui';

const DEFAULT_ROLES = ['Flight Specialist', 'Commander', 'Pilot', 'Flight Engineer', 'Mission Specialist'];

// The server may send null / missing values; inputs must always get a string.
const text = (v) => (v === null || v === undefined ? '' : v);

export default function ProfilePage({ user, onUserUpdate, onFlash, onBack, initialProfile = null, initialRoles = DEFAULT_ROLES }) {
  const [form, setForm] = useState(initialProfile);
  const [roles, setRoles] = useState(initialRoles);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  const load = useCallback(() => {
    setLoadError('');
    api('/astronaut/profile')
      .then((res) => { setForm(res.profile); setRoles(res.roles?.length ? res.roles : DEFAULT_ROLES); })
      .catch((err) => setLoadError(err.message));
  }, []);

  useEffect(() => {
    if (!initialProfile) load();
  }, [initialProfile, load]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await api('/astronaut/profile', { method: 'PUT', body: form });
      setForm(res.profile);
      onUserUpdate({ ...user, name: res.profile.name, role: res.profile.role });
      onFlash(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setPwError('');
    if (pw.newPassword !== pw.confirm) return setPwError('The new passwords do not match.');
    setPwBusy(true);
    try {
      const res = await api('/auth/change-password', { method: 'POST', body: { currentPassword: pw.currentPassword, newPassword: pw.newPassword } });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      onFlash(res.message);
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwBusy(false);
    }
  }

  const backButton = (
    <button type="button" onClick={onBack} className="inline-flex w-fit items-center gap-1.5 text-sm text-accent hover:underline">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to dashboard
    </button>
  );

  // Loading and error states always keep a way out.
  if (!form) {
    return (
      <main className="mx-auto grid max-w-3xl gap-5 px-4 pb-16 pt-6 sm:px-8">
        {backButton}
        <section className={`${panelCls} grid justify-items-start gap-3`}>
          {loadError ? (
            <>
              <p className={`${errorCls} mb-0`} role="alert">{loadError}</p>
              <button type="button" className={btnGhost} onClick={load}>Try again</button>
            </>
          ) : (
            <p className="inline-flex items-center gap-2 text-muted"><Spinner />Loading profile…</p>
          )}
        </section>
      </main>
    );
  }

  const bmi = form.heightCm && form.weightKg ? (Number(form.weightKg) / ((Number(form.heightCm) / 100) ** 2)).toFixed(1) : null;

  return (
    <main className="mx-auto grid max-w-3xl gap-5 px-4 pb-16 pt-6 sm:px-8">
      {backButton}

      <section className={`${panelCls} flex flex-wrap items-center gap-5`}>
        <span className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-accent to-accent2 text-3xl font-bold text-[#06101f]">{initials(form.name)}</span>
        <div className="grid flex-1 gap-0.5">
          <h1 className="text-2xl font-bold">{text(form.name)}</h1>
          <p className="text-muted">{form.role}{form.demo ? ' · demo session' : ''}</p>
          <p className="text-xs text-muted">ID {form.id}{form.email ? ` · ${form.email}` : ''}</p>
        </div>
        {bmi && <div className="rounded-xl border border-line bg-bg2 px-4 py-2 text-center"><p className="text-xl font-bold">{bmi}</p><p className="text-xs text-muted">BMI</p></div>}
      </section>

      <form onSubmit={save} className={panelCls}>
        <h2 className="mb-4 text-lg font-bold">Edit profile</h2>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <label className={labelCls}><span>Full name</span><input className={inputCls} value={text(form.name)} onChange={set('name')} required /></label>
          <label className={labelCls}>
            <span>Mission role</span>
            <select className={inputCls} value={text(form.role)} onChange={set('role')}>{roles.map((r) => <option key={r}>{r}</option>)}</select>
          </label>
          <label className={labelCls}><span>Email <em className="text-xs not-italic text-muted">(cannot be changed)</em></span><input className={inputCls} value={form.email || 'Demo sessions have no email'} readOnly /></label>
          <label className={labelCls}><span>Age</span><input className={inputCls} type="number" min="18" max="90" value={text(form.age)} onChange={set('age')} /></label>
          <label className={labelCls}><span>Height <em className="text-xs not-italic text-muted">(cm)</em></span><input className={inputCls} type="number" min="120" max="230" value={text(form.heightCm)} onChange={set('heightCm')} /></label>
          <label className={labelCls}><span>Weight <em className="text-xs not-italic text-muted">(kg)</em></span><input className={inputCls} type="number" min="35" max="200" value={text(form.weightKg)} onChange={set('weightKg')} /></label>
          <label className={labelCls}><span>Emergency contact name</span><input className={inputCls} value={text(form.emergencyName)} onChange={set('emergencyName')} maxLength={60} /></label>
          <label className={labelCls}><span>Emergency contact phone</span><input className={inputCls} value={text(form.emergencyPhone)} onChange={set('emergencyPhone')} inputMode="tel" placeholder="+961 …" /></label>
        </div>
        <label className={labelCls}><span>Medical notes <em className="text-xs not-italic text-muted">(allergies, conditions - optional, max 300)</em></span>
          <textarea className={`${inputCls} min-h-[84px]`} maxLength={300} value={text(form.notes)} onChange={set('notes')} />
        </label>
        {error && <p className={errorCls} role="alert">{error}</p>}
        <button className={btnPrimary} type="submit" disabled={saving}>
          {saving ? <Spinner /> : <Save className="h-4 w-4" aria-hidden="true" />}{saving ? 'Saving…' : 'Save profile'}
        </button>
        <p className="mt-3 text-xs text-muted">Prototype note: this is demo data. Do not enter real medical information.</p>
      </form>

      {!form.demo && (
        <form onSubmit={changePassword} className={panelCls}>
          <h2 className="mb-4 text-lg font-bold">Change password</h2>
          <div className="grid gap-x-4 sm:grid-cols-3">
            <label className={labelCls}><span>Current password</span><input className={inputCls} type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required /></label>
            <label className={labelCls}><span>New password <em className="text-xs not-italic text-muted">(min. 8)</em></span><input className={inputCls} type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required /></label>
            <label className={labelCls}><span>Repeat new password</span><input className={inputCls} type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required /></label>
          </div>
          {pwError && <p className={errorCls} role="alert">{pwError}</p>}
          <button className={btnGhost} type="submit" disabled={pwBusy}>
            {pwBusy ? <Spinner /> : <KeyRound className="h-4 w-4" aria-hidden="true" />}{pwBusy ? 'Updating…' : 'Update password'}
          </button>
        </form>
      )}
    </main>
  );
}
