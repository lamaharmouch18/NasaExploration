// client/src/components/Dashboard.jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { HistoryChart, ScoreRing } from './Charts';
import { AlertList, MetricCard, ReadingsForm, ScenarioBar, SourcesPanel, SymptomLogger } from './Panels';
import { BodyMap, EnvironmentPanel, GamificationPanel, IndicatorTrend, RadlabPanel, RemindersPanel, ReportButtons } from './Extras';
import { Activity, BellRing, ClipboardList, Database, FileText, FlaskConical, Globe, HeartPulse, ListChecks, Moon, Radiation, Stethoscope, Trophy, UserRound } from '../icons';
import { STATUS, Spinner, btnPrimary, panelCls } from '../ui';

// Section heading with an icon (used by every panel).
function PanelTitle({ id, Icon, children, className = 'mb-3.5' }) {
  return (
    <h3 id={id} className={`${className} flex items-center gap-2 text-base font-bold`}>
      <Icon className="h-5 w-5 text-accent" aria-hidden="true" />{children}
    </h3>
  );
}

const GROUPS = [
  ['vitals', 'Body vitals', HeartPulse],
  ['environment', 'Habitat & radiation', Radiation],
  ['wellbeing', 'Sleep & wellbeing', Moon]
];

// ---------- logic: loads data, handles actions ----------
export default function Dashboard({ user, onFlash, onSignOut }) {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [symptoms, setSymptoms] = useState([]);
  const [references, setReferences] = useState([]);
  const [radlab, setRadlab] = useState(null);
  const [reportReady, setReportReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [health, hist, sym, refs] = await Promise.all([
          api('/astronaut/health'), api('/astronaut/history'), api('/astronaut/symptoms'), api('/nasa-references')
        ]);
        if (cancelled) return;
        api('/nasa-radlab').then((r) => !cancelled && setRadlab(r.radlab)).catch(() => !cancelled && setRadlab({ available: false, sourceUrl: 'https://visualization.osdr.nasa.gov/radlab/' }));
        setData(health); setHistory(hist.history); setSymptoms(sym.symptoms); setReferences(refs.nasaDatasets);
      } catch (err) {
        if (!cancelled) setLoadError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // The server returns the new evaluation after a save; refresh the history too.
  const applySnapshot = useCallback((res) => {
    setData((d) => ({
      ...d, crew: res.crew, telemetry: res.telemetry, evaluation: res.evaluation,
      reminders: res.reminders, gamification: res.gamification, lastUpdated: res.lastUpdated
    }));
    setReportReady(true);
    onFlash(res.message);
    api('/astronaut/history').then((h) => setHistory(h.history)).catch(() => {});
  }, [onFlash]);

  const refreshAfterSymptom = useCallback(() => {
    api('/astronaut/symptoms').then((s) => setSymptoms(s.symptoms)).catch(() => {});
    api('/astronaut/health').then((h) => setData((d) => ({ ...d, gamification: h.gamification }))).catch(() => {});
  }, []);

  const changeEnvironment = useCallback((environment, message) => {
    setData((d) => ({ ...d, environment }));
    onFlash(message);
  }, [onFlash]);

  if (loading) return <div className="grid min-h-[60vh] place-content-center justify-items-center gap-3 text-muted"><Spinner className="h-6 w-6" />Connecting to Mission Control…</div>;
  if (!data) {
    return (
      <div className="grid min-h-[60vh] place-content-center justify-items-center gap-3 text-center">
        <p className="text-muted">Could not load the health data.</p>
        {loadError && <p className="text-critical">{loadError}</p>}
        <button className={btnPrimary} onClick={onSignOut}>Back to sign in</button>
      </div>
    );
  }

  return (
    <DashboardView
      data={data} history={history} symptoms={symptoms} references={references} radlab={radlab} reportReady={reportReady}
      onSnapshot={applySnapshot} onSymptomLogged={refreshAfterSymptom} onEnvironment={changeEnvironment}
      onError={(m) => onFlash(m, 'error')}
    />
  );
}

// ---------- view: everything comes in as props (easy to test and preview) ----------
export function DashboardView({
  data, history, symptoms, references, radlab, reportReady,
  onSnapshot, onSymptomLogged, onEnvironment, onError
}) {
  const evaluation = data.evaluation;
  const s = STATUS[evaluation.overallStatus];

  const counts = useMemo(() => {
    const c = { CRITICAL: 0, WARNING: 0, ADVISORY: 0 };
    evaluation.alerts.forEach((a) => { if (c[a.severity] !== undefined) c[a.severity] += 1; });
    return c;
  }, [evaluation]);

  const metricsByGroup = (g) => evaluation.metrics.filter((m) => m.group === g);
  const summary = [
    counts.CRITICAL && `${counts.CRITICAL} critical`,
    counts.WARNING && `${counts.WARNING} warning${counts.WARNING > 1 ? 's' : ''}`,
    counts.ADVISORY && `${counts.ADVISORY} advisor${counts.ADVISORY > 1 ? 'ies' : 'y'}`
  ].filter(Boolean).join(' · ') || 'All indicators in range';
  const dueCount = data.reminders.filter((r) => r.due).length;
  const reportData = { crew: data.crew, evaluation, environment: data.environment };

  return (
    <main className="grid w-full gap-4 px-3 pb-16 pt-5 sm:px-5 lg:px-8">
      <section className={`flex flex-wrap items-center gap-5 rounded-2xl border border-l-[6px] border-line bg-panel px-5 py-4 ${s.borderL}`}>
        <ScoreRing score={evaluation.score} status={evaluation.overallStatus} />
        <div className="grid min-w-[200px] flex-1 gap-0.5">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-accent">Your private health status · {data.crew.name}</p>
          <h2 className={`flex items-center gap-2.5 text-3xl font-bold ${s.text}`}><s.Icon className="h-8 w-8" aria-hidden="true" />{s.label}</h2>
          <p>{summary}</p>
          <p className="text-xs text-muted">
            {data.environment.label} · {data.environment.gravity} · Mission {data.mission.missionId} · updated {new Date(data.lastUpdated).toLocaleString()}
          </p>
        </div>
        <div className="grid gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Download your health report</p>
          <ReportButtons data={reportData} onError={onError} />
        </div>
      </section>

      {reportReady && (
        <section role="status" className="flex flex-wrap items-center gap-3 rounded-2xl border border-nominal/60 bg-nominal/10 px-5 py-3">
          <FileText className="h-6 w-6 flex-none text-nominal" aria-hidden="true" />
          <p className="min-w-[200px] flex-1"><b>Your health report is ready.</b> It contains your readings, findings and what to do. Save it on your computer:</p>
          <ReportButtons data={reportData} onError={onError} highlight />
        </section>
      )}

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <section className={panelCls} aria-labelledby="remind-h">
          <PanelTitle id="remind-h" Icon={BellRing}>
            Routine checks {dueCount > 0 && <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs text-warning">{dueCount} due</span>}
          </PanelTitle>
          <RemindersPanel reminders={data.reminders} />
        </section>
        <section className={panelCls} aria-labelledby="game-h">
          <PanelTitle id="game-h" Icon={Trophy}>Daily health challenge</PanelTitle>
          <GamificationPanel game={data.gamification} />
        </section>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <section className={panelCls} aria-labelledby="body-h">
          <PanelTitle id="body-h" Icon={UserRound}>Body map</PanelTitle>
          <BodyMap metrics={evaluation.metrics} />
        </section>
        <section className={panelCls} aria-labelledby="actions-h">
          <PanelTitle id="actions-h" Icon={ListChecks}>Action center</PanelTitle>
          <AlertList alerts={evaluation.alerts} />
        </section>
      </div>

      {GROUPS.map(([g, title, Icon]) => (
        <section className={panelCls} key={g} aria-labelledby={`${g}-h`}>
          <PanelTitle id={`${g}-h`} Icon={Icon}>{title}</PanelTitle>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] items-start gap-3">
            {metricsByGroup(g).map((m) => <MetricCard key={m.key} metric={m} history={history} guide={data.guides?.[m.key]} />)}
          </div>
        </section>
      ))}

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <section className={panelCls} aria-labelledby="trend-h">
          <PanelTitle id="trend-h" Icon={Activity}>Health score over time</PanelTitle>
          <HistoryChart history={history} />
        </section>
        <section className={panelCls} aria-labelledby="ind-h">
          <PanelTitle id="ind-h" Icon={Activity}>Indicator trends</PanelTitle>
          <IndicatorTrend metrics={evaluation.metrics} history={history} />
        </section>
      </div>

      <section className={panelCls} aria-labelledby="radlab-h">
        <PanelTitle id="radlab-h" Icon={Radiation}>Real NASA data: ISS radiation (OSDR RadLab)</PanelTitle>
        <RadlabPanel radlab={radlab} dailyRadiation={data.telemetry.environment.dailyRadiationRateMSv} />
      </section>

      <section className={panelCls} aria-labelledby="env-h">
        <PanelTitle id="env-h" Icon={Globe}>Mission environment</PanelTitle>
        <EnvironmentPanel environment={data.environment} environments={data.environments} onChanged={onEnvironment} onError={onError} />
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[1.4fr_1fr]">
        <section className={panelCls} id="log-readings" aria-labelledby="log-h">
          <PanelTitle id="log-h" Icon={ClipboardList}>Log new readings</PanelTitle>
          <ReadingsForm telemetry={data.telemetry} disabled={false} onSaved={onSnapshot} onError={onError} />
        </section>

        <div className="grid gap-4">
          <section className={panelCls} aria-labelledby="sym-h">
            <PanelTitle id="sym-h" Icon={Stethoscope}>Symptoms</PanelTitle>
            <SymptomLogger options={data.symptomGuide} symptoms={symptoms} disabled={false} onLogged={onSymptomLogged} onError={onError} />
          </section>

          <section className={panelCls} aria-labelledby="sim-h">
            <PanelTitle id="sim-h" Icon={FlaskConical} className="mb-1.5">Scenario simulator</PanelTitle>
            <p className="text-sm text-muted">No sensors attached? Apply a scenario to see how the evaluation and the action center react.</p>
            <ScenarioBar scenarios={data.scenarios} disabled={false} onApplied={onSnapshot} onError={onError} />
          </section>
        </div>
      </div>

      <section className={panelCls} aria-labelledby="src-h">
        <PanelTitle id="src-h" Icon={Database}>NASA data &amp; references</PanelTitle>
        <SourcesPanel references={references} />
      </section>
    </main>
  );
}
