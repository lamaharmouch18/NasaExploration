// client/src/components/SpaceBackground.jsx
//
// A full-screen canvas that sits behind the page.
//   variant="hero"  -> parallax stars, a ringed planet, shooting stars and rockets
//                      that fly across the screen with a flickering flame and exhaust.
//   variant="calm"  -> stars only (used behind the dashboard so data stays readable).
//
// Everything is drawn with plain canvas paths: no images, no libraries.
// It stops drawing while the browser tab is hidden and shows a still frame when the
// visitor has "reduce motion" turned on.
import { useEffect, useRef } from 'react';

const rand = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;

// ---------- stars ----------
function makeStars(w, h, density) {
  const count = Math.round((w * h) / density);
  return Array.from({ length: count }, () => ({
    x: rand(0, w),
    y: rand(0, h),
    depth: rand(0.15, 1),           // 1 = near (big, fast), 0.15 = far (tiny, slow)
    phase: rand(0, TAU),
    tint: Math.random() < 0.18 ? '#9fd8ff' : Math.random() < 0.1 ? '#ffd9a8' : '#ffffff'
  }));
}

function drawStars(ctx, stars, w, h, t, dt, drift) {
  stars.forEach((s) => {
    s.x -= s.depth * drift * dt;
    if (s.x < -2) { s.x = w + 2; s.y = rand(0, h); }
    const twinkle = 0.55 + 0.45 * Math.sin(t * (0.8 + s.depth * 1.6) + s.phase);
    ctx.globalAlpha = (0.25 + s.depth * 0.75) * twinkle;
    ctx.fillStyle = s.tint;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 0.35 + s.depth * 1.15, 0, TAU);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

// ---------- planet with a ring ----------
function drawPlanet(ctx, w, h, t) {
  const r = Math.min(w, h) * 0.17;
  const cx = w * 0.92;
  const cy = h * 0.14 + Math.sin(t * 0.05) * 6;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.38);

  // back half of the ring
  ctx.strokeStyle = 'rgba(123,140,255,0.28)';
  ctx.lineWidth = r * 0.16;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.75, r * 0.5, 0, Math.PI, TAU);
  ctx.stroke();

  // glow
  const glow = ctx.createRadialGradient(0, 0, r * 0.9, 0, 0, r * 1.7);
  glow.addColorStop(0, 'rgba(76,201,240,0.16)');
  glow.addColorStop(1, 'rgba(76,201,240,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.7, 0, TAU);
  ctx.fill();

  // planet body
  const body = ctx.createRadialGradient(-r * 0.4, -r * 0.45, r * 0.1, 0, 0, r);
  body.addColorStop(0, '#5b6fd6');
  body.addColorStop(0.55, '#2b3a8f');
  body.addColorStop(1, '#0d1535');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();

  // cloud bands
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.clip();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = '#9fd8ff';
  [-0.45, -0.1, 0.28].forEach((y, i) => ctx.fillRect(-r, r * y, r * 2, r * (0.07 + i * 0.03)));
  ctx.restore();

  // front half of the ring
  ctx.strokeStyle = 'rgba(159,216,255,0.42)';
  ctx.lineWidth = r * 0.16;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.75, r * 0.5, 0, 0, Math.PI);
  ctx.stroke();
  ctx.restore();
}

// ---------- shooting stars ----------
function spawnShootingStar(w, h) {
  const fromTop = Math.random() < 0.7;
  return {
    x: fromTop ? rand(w * 0.3, w) : w + 20,
    y: fromTop ? -20 : rand(0, h * 0.4),
    vx: -rand(420, 640),
    vy: rand(160, 280),
    life: 0,
    max: rand(0.7, 1.1)
  };
}

function drawShootingStars(ctx, list, dt) {
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const s = list[i];
    s.life += dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    if (s.life > s.max) { list.splice(i, 1); continue; }
    const a = Math.sin((s.life / s.max) * Math.PI);
    const tail = 90;
    const len = Math.hypot(s.vx, s.vy);
    const g = ctx.createLinearGradient(s.x, s.y, s.x - (s.vx / len) * tail, s.y - (s.vy / len) * tail);
    g.addColorStop(0, `rgba(255,255,255,${0.9 * a})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - (s.vx / len) * tail, s.y - (s.vy / len) * tail);
    ctx.stroke();
  }
}

// ---------- rockets ----------
// A rocket is spawned just outside the screen and flies toward a point in the upper
// part of the screen, then keeps going until it leaves again.
function spawnRocket(w, h) {
  const depth = rand(0.45, 1.25);               // size / speed / brightness
  const side = Math.random();
  let x; let y;
  if (side < 0.55) { x = rand(-0.05 * w, w * 0.9); y = h + 90; }           // from the bottom
  else if (side < 0.8) { x = -90; y = rand(h * 0.45, h * 1.0); }           // from the left
  else { x = w + 90; y = rand(h * 0.55, h * 1.0); }                        // from the right
  const tx = rand(w * 0.1, w * 0.9);
  const ty = rand(-h * 0.2, h * 0.35);
  const ang = Math.atan2(ty - y, tx - x);
  const speed = rand(95, 160) * (0.6 + depth * 0.5);
  return {
    x, y, depth, ang,
    vx: Math.cos(ang) * speed,
    vy: Math.sin(ang) * speed,
    wobble: rand(0, TAU),
    flicker: rand(0, TAU),
    hue: Math.random() < 0.5 ? '#4cc9f0' : '#7b8cff'   // stripe colour
  };
}

function drawRocketBody(ctx, hue) {
  // The rocket points along +x. Length is about 52 units.
  // fins (behind the body)
  ctx.fillStyle = '#b8c4e8';
  [-1, 1].forEach((s) => {
    ctx.beginPath();
    ctx.moveTo(-6, 6.5 * s);
    ctx.lineTo(-20, 16 * s);
    ctx.lineTo(-19, 6.5 * s);
    ctx.closePath();
    ctx.fill();
  });

  // main body
  const g = ctx.createLinearGradient(0, -8, 0, 8);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.55, '#d7def5');
  g.addColorStop(1, '#8c98c4');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(27, 0);
  ctx.bezierCurveTo(20, -7.5, 11, -8, 4, -8);
  ctx.lineTo(-18, -7);
  ctx.lineTo(-18, 7);
  ctx.lineTo(4, 8);
  ctx.bezierCurveTo(11, 8, 20, 7.5, 27, 0);
  ctx.closePath();
  ctx.fill();

  // nose tint and stripe
  ctx.fillStyle = hue;
  ctx.beginPath();
  ctx.moveTo(27, 0);
  ctx.bezierCurveTo(23, -4.4, 19, -6, 16, -6.4);
  ctx.lineTo(16, 6.4);
  ctx.bezierCurveTo(19, 6, 23, 4.4, 27, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(-12, -7.4, 4, 14.8);

  // window
  ctx.fillStyle = '#0b1230';
  ctx.beginPath();
  ctx.arc(6, 0, 3.4, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#7fe0ff';
  ctx.beginPath();
  ctx.arc(5.4, -0.6, 1.6, 0, TAU);
  ctx.fill();

  // nozzle
  ctx.fillStyle = '#4a5580';
  ctx.fillRect(-21, -3.6, 3.4, 7.2);
}

function drawFlame(ctx, t, r) {
  const len = 20 + 9 * Math.sin(t * 38 + r.flicker) + 5 * Math.sin(t * 61 + r.flicker * 2);
  const g = ctx.createLinearGradient(-21, 0, -21 - len, 0);
  g.addColorStop(0, 'rgba(255,248,220,0.98)');
  g.addColorStop(0.35, 'rgba(255,190,90,0.92)');
  g.addColorStop(1, 'rgba(255,90,40,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-21, -3.4);
  ctx.quadraticCurveTo(-21 - len * 0.55, -4.6, -21 - len, 0);
  ctx.quadraticCurveTo(-21 - len * 0.55, 4.6, -21, 3.4);
  ctx.closePath();
  ctx.fill();

  const glow = ctx.createRadialGradient(-24, 0, 1, -24, 0, 24);
  glow.addColorStop(0, 'rgba(255,170,80,0.38)');
  glow.addColorStop(1, 'rgba(255,170,80,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(-24, 0, 24, 0, TAU);
  ctx.fill();
}

function drawRocket(ctx, r, t) {
  ctx.save();
  ctx.translate(r.x, r.y);
  ctx.rotate(r.ang + Math.sin(t * 1.4 + r.wobble) * 0.035); // a tiny bit of drift
  ctx.scale(r.depth, r.depth);
  ctx.globalAlpha = Math.min(1, 0.45 + r.depth * 0.5);
  drawFlame(ctx, t, r);
  drawRocketBody(ctx, r.hue);
  ctx.restore();
}

// ---------- exhaust particles ----------
function emitExhaust(parts, r, dt) {
  const back = r.ang + Math.PI;
  const nozzleX = r.x + Math.cos(back) * 22 * r.depth;
  const nozzleY = r.y + Math.sin(back) * 22 * r.depth;
  const n = Math.max(1, Math.round(dt * 90));
  for (let i = 0; i < n; i += 1) {
    if (parts.length > 260) parts.shift();
    const spread = rand(-0.28, 0.28);
    const sp = rand(18, 60) * r.depth;
    parts.push({
      x: nozzleX + rand(-1.5, 1.5), y: nozzleY + rand(-1.5, 1.5),
      vx: Math.cos(back + spread) * sp + r.vx * 0.15,
      vy: Math.sin(back + spread) * sp + r.vy * 0.15,
      life: 0, max: rand(0.55, 1.15),
      size: rand(1.4, 3.4) * r.depth
    });
  }
}

function drawParticles(ctx, parts, dt) {
  ctx.globalCompositeOperation = 'lighter';
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    const p = parts[i];
    p.life += dt;
    if (p.life >= p.max) { parts.splice(i, 1); continue; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const k = p.life / p.max;
    const rr = p.size * (1 + k * 1.8);
    // orange at first, then a dim blue-grey smoke
    const color = k < 0.35 ? `255,${Math.round(190 - k * 200)},90` : '120,140,200';
    ctx.fillStyle = `rgba(${color},${(1 - k) * (k < 0.35 ? 0.55 : 0.22)})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, rr, 0, TAU);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
}

// ---------- the component ----------
export default function SpaceBackground({ variant = 'hero' }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
    if (!ctx) return undefined; // e.g. test environment without canvas support

    const hero = variant === 'hero';
    const reduced = Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    let w = 0; let h = 0; let dpr = 1;
    let stars = [];
    const rockets = [];
    const parts = [];
    const shooters = [];
    let raf = 0;
    let last = 0;
    let clock = 0;
    let nextRocket = 0.4;
    let nextShooter = rand(2, 5);

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = makeStars(w, h, hero ? 4200 : 9000);
    }

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      clock += dt;
      ctx.clearRect(0, 0, w, h);

      drawStars(ctx, stars, w, h, clock, dt, hero ? 7 : 2.5);

      if (hero) {
        drawPlanet(ctx, w, h, clock);

        nextShooter -= dt;
        if (nextShooter <= 0) { shooters.push(spawnShootingStar(w, h)); nextShooter = rand(4, 9); }
        drawShootingStars(ctx, shooters, dt);

        nextRocket -= dt;
        const maxRockets = w < 700 ? 2 : 4;
        if (nextRocket <= 0 && rockets.length < maxRockets) {
          rockets.push(spawnRocket(w, h));
          nextRocket = rand(2.2, 5);
        }

        for (let i = rockets.length - 1; i >= 0; i -= 1) {
          const r = rockets[i];
          r.x += r.vx * dt;
          r.y += r.vy * dt;
          emitExhaust(parts, r, dt);
          if (r.x < -200 || r.x > w + 200 || r.y < -200 || r.y > h + 200) rockets.splice(i, 1);
        }
        drawParticles(ctx, parts, dt);
        // far rockets first so near ones overlap them
        [...rockets].sort((a, b) => a.depth - b.depth).forEach((r) => drawRocket(ctx, r, clock));
      }
      raf = window.requestAnimationFrame(frame);
    }

    function still() {
      // One calm frame for "reduce motion": stars plus two parked rockets.
      ctx.clearRect(0, 0, w, h);
      drawStars(ctx, stars, w, h, 0, 0, 0);
      if (hero) {
        drawPlanet(ctx, w, h, 0);
        [[0.18, 0.78, -0.9, 0.8], [0.62, 0.9, -1.15, 0.6]].forEach(([fx, fy, ang, depth]) => {
          drawRocket(ctx, { x: w * fx, y: h * fy, ang, depth, wobble: 0, flicker: 0, hue: '#4cc9f0' }, 0);
        });
      }
    }

    function start() {
      if (reduced) { still(); return; }
      last = performance.now();
      raf = window.requestAnimationFrame(frame);
    }
    function onVisibility() {
      if (reduced) return;
      if (document.hidden) window.cancelAnimationFrame(raf);
      else { last = performance.now(); raf = window.requestAnimationFrame(frame); }
    }
    function onResize() {
      resize();
      if (reduced) still();
    }

    resize();
    start();
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [variant]);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 h-full w-full" />;
}
