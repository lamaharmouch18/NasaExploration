// client/src/ui.jsx
// Shared Tailwind class strings, icons and small helpers.
// Tailwind only generates classes it can find as complete strings, so every
// class below is written out in full (never built with string concatenation).
import { CircleCheck, Info, LoaderCircle, OctagonAlert, TriangleAlert } from './icons';

// Each status has an icon component (never an emoji or a text symbol).
export const STATUS = {
  NOMINAL: { label: 'Nominal', Icon: CircleCheck, hex: '#3ddc97', text: 'text-nominal', border: 'border-nominal', borderL: 'border-l-nominal', borderT: 'border-t-nominal', bg: 'bg-nominal/10' },
  ADVISORY: { label: 'Advisory', Icon: Info, hex: '#ffd166', text: 'text-advisory', border: 'border-advisory', borderL: 'border-l-advisory', borderT: 'border-t-advisory', bg: 'bg-advisory/10' },
  WARNING: { label: 'Warning', Icon: TriangleAlert, hex: '#ff9f43', text: 'text-warning', border: 'border-warning', borderL: 'border-l-warning', borderT: 'border-t-warning', bg: 'bg-warning/10' },
  CRITICAL: { label: 'Critical', Icon: OctagonAlert, hex: '#ff5d73', text: 'text-critical', border: 'border-critical', borderL: 'border-l-critical', borderT: 'border-t-critical', bg: 'bg-critical/10' }
};

export const BASIS_CLS = {
  NASA: 'border-accent text-accent',
  CLINICAL: 'border-nominal text-nominal',
  PROTOTYPE: 'border-advisory text-advisory'
};

export const inputCls =
  'w-full rounded-lg border border-line bg-bg2 px-3 py-2 text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none disabled:opacity-60 read-only:opacity-70';
export const labelCls = 'mb-3 grid gap-1 text-sm';
export const panelCls = 'rounded-2xl border border-line bg-panel/90 p-5 backdrop-blur-sm';
export const fieldsetCls = 'mb-4 min-w-0 rounded-xl border border-line px-4 pb-1 pt-2';
export const legendCls = 'px-1.5 text-sm font-bold text-accent';

const btnBase = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold transition hover:enabled:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50';
export const btnPrimary = `${btnBase} bg-gradient-to-br from-accent to-accent2 text-[#06101f]`;
export const btnGhost = `${btnBase} border border-line text-ink hover:enabled:border-accent`;
export const btnLink = 'cursor-pointer text-accent underline disabled:opacity-50';

export const noticeCls = 'mb-3 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm';
export const errorCls = 'mb-3 rounded-lg border border-critical/40 bg-critical/10 px-3 py-2 text-sm text-critical';

export const initials = (name) =>
  String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'A';

// Small spinning icon for buttons that are busy.
export function Spinner({ className = 'h-4 w-4' }) {
  return <LoaderCircle className={`${className} animate-spin`} aria-hidden="true" />;
}

// App logo: a planet ring crossed by a heartbeat line.
export function Logo({ className = 'h-9 w-9' }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="logo-g" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4cc9f0" />
          <stop offset="1" stopColor="#7b8cff" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="15" stroke="url(#logo-g)" strokeWidth="2.6" />
      <ellipse cx="24" cy="24" rx="22" ry="7" transform="rotate(-24 24 24)" stroke="url(#logo-g)" strokeWidth="1.6" opacity="0.55" />
      <path d="M9 25h8l3-8 5 15 3-9 2 2h9" stroke="#e8edff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
