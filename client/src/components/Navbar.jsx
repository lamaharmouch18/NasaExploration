// client/src/components/Navbar.jsx
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LayoutDashboard, LogOut, UserRound } from '../icons';
import { Logo, initials } from '../ui';

export default function Navbar({ user, view = 'dashboard', onHome, onProfile, onSignOut, initialMenuOpen = false }) {
  const [open, setOpen] = useState(initialMenuOpen);
  const box = useRef(null);

  // Close the menu on outside click or Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (fn) => () => { setOpen(false); fn(); };
  const item = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-panel2';

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-bg/85 px-4 py-3 backdrop-blur-md sm:px-8">
      <button type="button" onClick={onHome} className="flex items-center gap-3 text-left">
        <Logo />
        <span className="grid leading-tight">
          <strong>Astronaut Health Monitor</strong>
          <span className="text-xs text-muted">NASA Space Apps · Tripoli 2026 · simulated data</span>
        </span>
      </button>

      <div className="relative" ref={box}>
        <button
          type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}
          aria-label="Open astronaut profile menu"
          className={`flex items-center gap-2.5 rounded-full border bg-panel py-1 pl-1 pr-3 transition hover:border-accent ${view === 'profile' ? 'border-accent' : 'border-line'}`}
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-accent to-accent2 text-sm font-bold text-[#06101f]">{initials(user.name)}</span>
          <span className="hidden text-sm sm:block">{user.name}</span>
          <ChevronDown className={`h-4 w-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>

        {open && (
          <div role="menu" className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-line bg-panel p-2 shadow-2xl shadow-black/50">
            <div className="border-b border-line px-3 pb-2 pt-1">
              <p className="font-semibold">{user.name}{user.demo ? ' (demo)' : ''}</p>
              <p className="text-xs text-muted">{user.role}</p>
              {user.email && <p className="truncate text-xs text-muted">{user.email}</p>}
            </div>
            <button role="menuitem" className={`${item} mt-1`} onClick={choose(onProfile)}><UserRound className="h-4 w-4 text-accent" aria-hidden="true" />My astronaut profile</button>
            <button role="menuitem" className={item} onClick={choose(onHome)}><LayoutDashboard className="h-4 w-4 text-accent" aria-hidden="true" />Dashboard</button>
            <button role="menuitem" className={`${item} text-critical`} onClick={choose(onSignOut)}><LogOut className="h-4 w-4" aria-hidden="true" />Sign out</button>
          </div>
        )}
      </div>
    </header>
  );
}
