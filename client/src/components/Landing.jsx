// client/src/components/Landing.jsx
//
// The page people see before they sign in. It explains, in plain steps, what the
// app tracks, how each value is judged and where the limits come from.
// The auth form is passed in as `children` and sits next to the headline.
//
// The numbers in the "sample readout" are fixed example values. They were chosen so
// that the real evaluation engine (server/services/evaluationEngine.js) would produce
// exactly this score and these alerts.
import {
  Activity, BedDouble, BellRing, Brain, ClipboardList, Database, Droplet, FileText, FlaskConical,
  Gauge, HeartPulse, ListChecks, Moon, Radiation, Satellite, ShieldCheck, SlidersHorizontal,
  Thermometer, Users, Wind
} from '../icons';
import { HistoryChart, ScoreRing, Sparkline } from './Charts';
import { BASIS_CLS, Logo, STATUS } from '../ui';

const section = 'mx-auto w-full max-w-6xl px-5 sm:px-10';
const card = 'rounded-2xl border border-line bg-panel/80 backdrop-blur-sm';

// ---------- 1. How it works (a real sequence) ----------
const STEPS = [
  { Icon: ClipboardList, title: 'Collect', text: 'Log vitals, cabin readings and sleep in one form. Fill in only what you measured; empty boxes keep the last value.' },
  { Icon: SlidersHorizontal, title: 'Evaluate', text: 'Every value is graded against its limit as Nominal, Advisory, Warning or Critical, then rolled into one 0 to 100 health score.' },
  { Icon: ListChecks, title: 'Act', text: 'The Action center ranks problems by severity, gives plain steps to follow and says when to call the Flight Surgeon.' }
];

function HowItWorks() {
  return (
    <section id="how" className={`${section} py-16`} aria-labelledby="how-h">
      <h2 id="how-h" className="max-w-[24ch] text-3xl font-bold leading-tight sm:text-4xl">From a raw number to a clear next step</h2>
      <ol className="relative mt-10 grid gap-5 md:grid-cols-3">
        <span className="pointer-events-none absolute left-[16%] right-[16%] top-7 hidden border-t border-dashed border-accent/40 md:block" aria-hidden="true" />
        {STEPS.map(({ Icon, title, text }, i) => (
          <li key={title} className={`${card} relative p-6`}>
            <span className="relative mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-accent/50 bg-bg2 text-accent">
              <Icon className="h-7 w-7" aria-hidden="true" />
              <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-accent text-xs font-bold text-[#06101f]">{i + 1}</span>
            </span>
            <h3 className="mb-1.5 text-xl font-bold">{title}</h3>
            <p className="text-muted">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ---------- 2. Sample readout (what the astronaut sees) ----------
const SAMPLE_TILES = [
  { label: 'Heart rate', value: '76', unit: 'bpm', status: 'NOMINAL', Icon: HeartPulse, trend: [74, 78, 75, 79, 77, 76] },
  { label: 'Blood oxygen', value: '98', unit: '%', status: 'NOMINAL', Icon: Droplet, trend: [97, 98, 98, 97, 98, 98] },
  { label: 'Cabin CO2', value: '3,200', unit: 'ppm', status: 'ADVISORY', Icon: Wind, trend: [2400, 2600, 2800, 2900, 3100, 3200] },
  { label: 'Sleep, last 24 h', value: '5.6', unit: 'h', status: 'WARNING', Icon: BedDouble, trend: [7.4, 7.0, 6.6, 6.2, 5.9, 5.6] }
];
const SAMPLE_HISTORY = [
  { at: '2026-01-01T06:00:00Z', score: 96, overallStatus: 'NOMINAL' },
  { at: '2026-01-01T09:00:00Z', score: 93, overallStatus: 'NOMINAL' },
  { at: '2026-01-01T12:00:00Z', score: 88, overallStatus: 'ADVISORY' },
  { at: '2026-01-01T15:00:00Z', score: 84, overallStatus: 'ADVISORY' },
  { at: '2026-01-01T18:00:00Z', score: 76, overallStatus: 'WARNING' }
];
const SAMPLE_ALERTS = [
  { status: 'WARNING', title: 'Short sleep', action: 'Postpone complex tasks such as EVA and robotics. Protect a full sleep period tonight.' },
  { status: 'ADVISORY', title: 'Cabin CO2 rising', action: 'Increase cabin air circulation and check the CO2 scrubber. Watch for headaches.' }
];

// A heartbeat trace that redraws itself continuously.
function Ecg() {
  const beat = 'l14 0 l6 -4 l6 4 l12 0 l5 6 l7 -34 l7 40 l6 -12 l12 0 l8 -7 l8 7 l20 0';
  const d = `M0 34 ${beat} ${beat} ${beat}`;
  return (
    <svg viewBox="0 0 520 70" className="h-16 w-full" aria-hidden="true" preserveAspectRatio="none">
      <path d={d} fill="none" stroke="#26335f" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <path d={d} fill="none" stroke="#3ddc97" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" pathLength="1" className="ecg-trace" />
    </svg>
  );
}

function SampleReadout() {
  return (
    <section id="console" className={`${section} py-16`} aria-labelledby="console-h">
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto]">
        <h2 id="console-h" className="max-w-[26ch] text-3xl font-bold leading-tight sm:text-4xl">This is what the astronaut sees</h2>
        <p className="inline-flex items-center gap-2 text-sm text-muted"><FlaskConical className="h-4 w-4 text-advisory" aria-hidden="true" />Sample readout with simulated data</p>
      </div>

      <div className={`${card} mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 p-5 sm:p-7 lg:grid-cols-[auto_minmax(0,1fr)]`}>
        <div className="grid content-start justify-items-center gap-3 border-b border-line pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
          <ScoreRing score={76} status="WARNING" />
          <p className={`flex items-center gap-2 text-xl font-bold ${STATUS.WARNING.text}`}><STATUS.WARNING.Icon className="h-6 w-6" aria-hidden="true" />Warning</p>
          <p className="text-sm text-muted">1 warning · 1 advisory</p>
          <div className="mt-1 w-56 max-w-full">
            <Ecg />
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted"><Activity className="h-3.5 w-3.5 text-nominal" aria-hidden="true" />Live heartbeat trace</p>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {SAMPLE_TILES.map(({ label, value, unit, status, Icon, trend }) => {
              const s = STATUS[status];
              return (
                <div key={label} className={`grid gap-1.5 rounded-xl border border-t-[3px] border-line bg-bg2 p-3 ${s.borderT}`}>
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold text-muted"><Icon className="h-4 w-4 text-accent" aria-hidden="true" />{label}</p>
                  <p className="text-2xl font-bold leading-tight">{value}<span className="text-sm font-medium text-muted"> {unit}</span></p>
                  <Sparkline values={trend} color={s.hex} />
                  <p className={`flex items-center gap-1 text-xs font-bold ${s.text}`}><s.Icon className="h-3.5 w-3.5" aria-hidden="true" />{s.label}</p>
                </div>
              );
            })}
          </div>

          <ul className="grid gap-2.5">
            {SAMPLE_ALERTS.map((a) => {
              const s = STATUS[a.status];
              return (
                <li key={a.title} className={`grid gap-1 rounded-xl border border-l-[5px] border-line bg-bg2 px-4 py-3 ${s.borderL}`}>
                  <p className={`flex items-center gap-2 font-bold ${s.text}`}><s.Icon className="h-4 w-4" aria-hidden="true" />{a.title}</p>
                  <p className="text-[15px]"><b>What to do:</b> <span className="text-muted">{a.action}</span></p>
                </li>
              );
            })}
          </ul>

          <div className="rounded-xl border border-line bg-bg2 p-3">
            <p className="mb-1 text-sm font-semibold text-muted">Health score over the last 12 hours</p>
            <HistoryChart history={SAMPLE_HISTORY} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- 3. What it watches ----------
const WATCH = [
  { title: 'Body vitals', Icon: HeartPulse, items: [['Heart rate', HeartPulse], ['Blood pressure', Gauge], ['Blood oxygen (SpO2)', Droplet], ['Core temperature', Thermometer]] },
  { title: 'Habitat and radiation', Icon: Radiation, items: [['Cabin CO2', Wind], ['Cabin pressure', Gauge], ['Radiation dose rate', Radiation], ['Accumulated mission dose', Database]] },
  { title: 'Sleep and wellbeing', Icon: Moon, items: [['Sleep hours', BedDouble], ['Sleep quality', Moon], ['Fatigue level', Activity], ['Isolation and stress', Brain]] }
];
const TOOLS = [
  [ClipboardList, 'Symptom log', 'Report how you feel and get guidance for each symptom.'],
  [FlaskConical, 'Scenario simulator', 'No sensors? Trigger a solar storm or CO2 leak and watch the app react.'],
  [FileText, 'Health report', 'Every save builds a report you can download as a PDF or an image.'],
  [Users, 'Private by design', 'Only you can see your own health data. Nobody else can open it.']
];

function Watches() {
  return (
    <section id="watch" className={`${section} py-16`} aria-labelledby="watch-h">
      <h2 id="watch-h" className="max-w-[26ch] text-3xl font-bold leading-tight sm:text-4xl">Thirteen indicators across three body-and-habitat groups</h2>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {WATCH.map(({ title, Icon, items }) => (
          <div key={title} className={`${card} p-6`}>
            <h3 className="mb-4 flex items-center gap-2.5 text-lg font-bold">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-accent/50 bg-bg2 text-accent"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              {title}
            </h3>
            <ul className="grid gap-2.5">
              {items.map(([label, ItemIcon]) => (
                <li key={label} className="flex items-center gap-2.5 text-[15px]"><ItemIcon className="h-4 w-4 flex-none text-muted" aria-hidden="true" />{label}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TOOLS.map(([Icon, title, text]) => (
          <li key={title} className="flex gap-3 rounded-xl border border-line bg-bg2/70 p-4 backdrop-blur-sm">
            <Icon className="mt-0.5 h-5 w-5 flex-none text-accent2" aria-hidden="true" />
            <div><p className="font-semibold">{title}</p><p className="text-sm text-muted">{text}</p></div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------- 4. Alert levels ----------
const LEVELS = [
  ['NOMINAL', 'Inside the normal range.', 'Keep the daily routine: exercise, hydration, a full sleep period.'],
  ['ADVISORY', 'Drifting toward the limit.', 'Re-measure and make a small correction.'],
  ['WARNING', 'Outside the limit.', 'Pause risky tasks such as EVA and follow the protocol.'],
  ['CRITICAL', 'Emergency range.', 'Contact the Flight Surgeon or Mission Control now.']
];

function Levels() {
  return (
    <section id="levels" className={`${section} py-16`} aria-labelledby="levels-h">
      <h2 id="levels-h" className="max-w-[24ch] text-3xl font-bold leading-tight sm:text-4xl">Four alert levels, one clear response each</h2>
      <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {LEVELS.map(([key, meaning, response]) => {
          const s = STATUS[key];
          return (
            <li key={key} className={`rounded-2xl border border-t-4 border-line bg-panel/80 p-5 backdrop-blur-sm ${s.borderT}`}>
              <p className={`mb-2 flex items-center gap-2 text-lg font-bold ${s.text}`}><s.Icon className="h-6 w-6" aria-hidden="true" />{s.label}</p>
              <p className="font-medium">{meaning}</p>
              <p className="mt-1.5 text-sm text-muted">{response}</p>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 flex items-start gap-2.5 text-sm text-muted">
        <BellRing className="mt-0.5 h-4 w-4 flex-none text-accent" aria-hidden="true" />
        A background check also runs every few minutes. When email is set up and an account reaches Warning or Critical, the app emails the astronaut, at most once an hour.
      </p>
    </section>
  );
}

// ---------- 5. Where the limits come from ----------
const FACTS = [
  { Icon: Radiation, value: '600 mSv', text: 'NASA career radiation limit. Advisory at 50%, warning at 80% of it.', src: 'NASA-STD-3001' },
  { Icon: Wind, value: '3.0 mmHg', text: 'ISS operating limit for cabin CO2. Critical level is the 5.3 mmHg 180-day maximum.', src: 'NASA NTRS reports' },
  { Icon: Satellite, value: '1.3 mSv/day', text: 'NASA design limit for galactic cosmic rays in free space. A spike above 5 triggers the storm-shelter alert.', src: 'NASA-STD-3001' }
];
const BASIS_TEXT = [
  ['NASA', 'Taken from a NASA standard or technical report.'],
  ['CLINICAL', 'Standard adult reference range (for example heart rate and blood pressure).'],
  ['PROTOTYPE', 'Chosen by this project, because no public NASA number exists. Labelled honestly.']
];

function Sources() {
  return (
    <section id="sources" className={`${section} py-16`} aria-labelledby="sources-h">
      <h2 id="sources-h" className="max-w-[26ch] text-3xl font-bold leading-tight sm:text-4xl">Every limit shows where it came from</h2>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {FACTS.map(({ Icon, value, text, src }) => (
          <div key={value} className={`${card} p-6`}>
            <Icon className="mb-3 h-6 w-6 text-accent" aria-hidden="true" />
            <p className="text-2xl font-bold">{value}</p>
            <p className="mt-1.5 text-muted">{text}</p>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted"><Database className="h-3.5 w-3.5" aria-hidden="true" />{src}</p>
          </div>
        ))}
      </div>

      <div className={`${card} mt-5 grid gap-4 p-5 md:grid-cols-3`}>
        {BASIS_TEXT.map(([tag, text]) => (
          <div key={tag} className="flex items-start gap-3">
            <span className={`mt-0.5 rounded border px-1.5 text-[10px] font-bold tracking-wide ${BASIS_CLS[tag]}`}>{tag}</span>
            <p className="text-sm text-muted">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------- page frame ----------
export default function Landing({ children }) {
  return (
    <div className="relative z-10">
      <header className={`${section} flex items-center justify-between gap-3 pt-6`}>
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-10" />
          <span className="grid leading-tight">
            <strong className="text-lg">Astronaut Health Monitor</strong>
            <span className="text-xs text-muted">NASA Space Apps Challenge · Tripoli 2026</span>
          </span>
        </div>
        <span className="hidden items-center gap-2 rounded-full border border-line bg-panel/70 px-3.5 py-1.5 text-sm text-muted backdrop-blur-sm sm:inline-flex">
          <ShieldCheck className="h-4 w-4 text-nominal" aria-hidden="true" />All data is simulated
        </span>
      </header>

      <main>
        <section className={`${section} grid min-h-[calc(100vh-88px)] items-center gap-10 py-10 lg:grid-cols-[1.15fr_1fr]`} aria-labelledby="hero-h">
          <div>
            <h1 id="hero-h" className="max-w-[16ch] text-5xl font-bold leading-[1.04] tracking-tight sm:text-6xl">
              On a long mission, the astronaut is the first doctor
            </h1>
            <p className="mt-5 max-w-[50ch] text-lg text-muted">
              Months from Earth, nobody can check your pulse for you. Astronaut Health Monitor tracks your body, your habitat
              and your sleep, compares each reading with NASA-referenced limits, and tells you what to do next.
            </p>
            <a href="#how" className="mt-7 inline-flex items-center gap-2 text-accent hover:underline">
              <Activity className="h-4 w-4" aria-hidden="true" />See how it tracks health
            </a>
          </div>
          <div className="w-full max-w-md justify-self-center lg:justify-self-end">{children}</div>
        </section>

        <HowItWorks />
        <SampleReadout />
        <Watches />
        <Levels />
        <Sources />
      </main>

      <footer className={`${section} border-t border-line py-8 text-sm text-muted`}>
        <p>
          Educational prototype for the NASA Space Apps Challenge, Tripoli 2026. All crew data is simulated and the guidance
          is for demonstration, not medical advice. In real operations, limits come from the NASA Flight Surgeon and are
          personalised for each crew member.
        </p>
      </footer>
    </div>
  );
}
