import { useEffect, useRef, useState } from "react";
import { VerdictBadge } from "@/components/VerdictBadge";
import { scenarios, untrustedContent, type Scenario, type ToolCall } from "@/lib/agentgate";
import { cn } from "@/lib/utils";

const taintStyles: Record<string, string> = {
  email: "bg-ask-soft text-ask-foreground border-ask/40",
  web: "bg-block-soft text-block border-block/30",
  none: "bg-secondary text-secondary-foreground border-border",
};

const STAGES = ["Normalising", "Checking Taint", "Running Policy", "Intent Scorer", "Final Verdict"] as const;
const STAGE_MS = 450;
const BETWEEN_CALLS_MS = 500;
const TEST_SEQUENCE = ["credentials", "git", "pip"];

// phase: -1 = queued, 0..4 = current stage index, 5 = done
type Row = { call: ToolCall; phase: number };
type Summary = { scenario: string; total: number; block: number; ask: number; allow: number };

class Cancelled extends Error {}

export function DemoPanel() {
  const [active, setActive] = useState<Scenario>(scenarios[0]!);
  const [task, setTask] = useState(scenarios[0]!.task);
  const [rows, setRows] = useState<Row[]>([]);
  const [stage, setStage] = useState<number>(-1);
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [testLabel, setTestLabel] = useState<string | null>(null);
  const runToken = useRef(0);

  useEffect(() => () => void runToken.current++, []);

  function sleep(ms: number, token: number) {
    return new Promise<void>((resolve, reject) =>
      setTimeout(() => (token === runToken.current ? resolve() : reject(new Cancelled())), ms),
    );
  }

  async function simulate(scenario: Scenario, token: number) {
    setActive(scenario);
    setTask(scenario.task);
    setRows([]);
    setSummary(null);
    setStage(-1);
    await sleep(250, token);
    for (const call of scenario.calls) {
      setRows((r) => [...r, { call, phase: 0 }]);
      for (let s = 0; s < STAGES.length; s++) {
        setStage(s);
        setRows((r) => r.map((row) => (row.call.id === call.id ? { ...row, phase: s } : row)));
        await sleep(STAGE_MS, token);
      }
      setRows((r) => r.map((row) => (row.call.id === call.id ? { ...row, phase: 5 } : row)));
      await sleep(BETWEEN_CALLS_MS, token);
    }
    setStage(-1);
    const c = scenario.calls;
    setSummary({
      scenario: scenario.label,
      total: c.length,
      block: c.filter((x) => x.verdict === "BLOCK").length,
      ask: c.filter((x) => x.verdict === "ASK").length,
      allow: c.filter((x) => x.verdict === "ALLOW").length,
    });
  }

  async function run(id: string) {
    const token = ++runToken.current;
    setTestLabel(null);
    setRunning(true);
    try {
      await simulate(scenarios.find((s) => s.id === id)!, token);
      setRunning(false);
    } catch (e) {
      if (!(e instanceof Cancelled)) throw e;
    }
  }

  async function runTest() {
    const token = ++runToken.current;
    setRunning(true);
    try {
      for (let i = 0; i < TEST_SEQUENCE.length; i++) {
        const sc = scenarios.find((s) => s.id === TEST_SEQUENCE[i]) ?? scenarios[i]!;
        setTestLabel(`Test run ${i + 1}/${TEST_SEQUENCE.length}: ${sc.label}`);
        await simulate(sc, token);
        if (i < TEST_SEQUENCE.length - 1) await sleep(2200, token);
      }
      setTestLabel("Test complete — 3 scenarios ran live");
      setRunning(false);
    } catch (e) {
      if (!(e instanceof Cancelled)) throw e;
    }
  }

  return (
    <div id="demo" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-14">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Live demo</p>
          <h2 className="mt-1.5 text-2xl font-semibold sm:text-3xl">Judge every tool call</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => run(s.id)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                active.id === s.id
                  ? "border-primary/40 bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
          <button
            onClick={runTest}
            className="rounded-lg deep-surface px-3 py-1.5 text-sm font-medium hover:opacity-90"
          >
            Test Real-time Mode
          </button>
        </div>
      </div>

      {/* Live Simulation indicator */}
      <div className="panel mb-4 p-4" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className={cn("size-2 rounded-full", running ? "animate-pulse bg-primary" : "bg-muted-foreground/40")} />
            Live Simulation
            <span className="font-mono text-xs font-normal text-muted-foreground">
              {running ? (stage >= 0 ? STAGES[stage] : "starting…") : "idle"}
            </span>
          </div>
          {testLabel && <span className="font-mono text-xs text-muted-foreground">{testLabel}</span>}
        </div>
        <ol className="mt-3 grid grid-cols-5 gap-1.5">
          {STAGES.map((s, i) => (
            <li
              key={s}
              className={cn(
                "rounded-md border px-2 py-1.5 text-center font-mono text-[10px] transition-colors sm:text-[11px]",
                running && i === stage
                  ? "border-primary bg-primary text-primary-foreground"
                  : running && i < stage
                    ? "border-primary/30 bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground",
              )}
            >
              {s}
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <section className="panel p-5 lg:col-span-4">
          <h3 className="text-sm font-semibold">User task</h3>
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            rows={3}
            className="mt-3 w-full resize-none rounded-lg border border-input bg-background p-3 font-mono text-[13px] leading-relaxed outline-none focus:ring-2 focus:ring-ring/50"
          />
          <p className="mt-3 text-xs text-muted-foreground">{active.blurb}</p>
          <button
            onClick={() => run(active.id)}
            className="mt-4 w-full rounded-lg deep-surface px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
          >
            {running ? "Running… (click to restart)" : "Run scenario"}
          </button>
        </section>

        <section className="space-y-3 lg:col-span-4">
          <h3 className="text-sm font-semibold">Untrusted content</h3>
          {untrustedContent.map((c) => (
            <article key={c.title} className="panel p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{c.title}</span>
                <span className={cn("rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase", taintStyles[c.source])}>
                  {c.source}
                </span>
              </div>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">{c.from}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{c.body}</p>
            </article>
          ))}
        </section>

        <section className="lg:col-span-4">
          <h3 className="text-sm font-semibold">Agent tool calls</h3>
          <div className="mt-3 space-y-3">
            {rows.length === 0 && !running && (
              <div className="panel grid place-items-center p-8 text-center text-sm text-muted-foreground">
                Pick a scenario and run it to watch the firewall decide.
              </div>
            )}
            {rows.map(({ call, phase }) => (
              <article key={call.id} data-testid="tool-call" className="panel step-in p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-[13px] font-semibold">{call.tool}</p>
                    <p className="mt-1 break-words font-mono text-[11px] text-muted-foreground">{call.args}</p>
                  </div>
                  {phase >= 5 ? (
                    <VerdictBadge verdict={call.verdict} className="step-in" />
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                      <span className="size-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      {STAGES[phase]}
                    </span>
                  )}
                </div>
                <dl className="mt-3 space-y-1.5 text-[12px]">
                  <div className="flex items-center gap-2">
                    <dt className="w-20 text-muted-foreground">Taint</dt>
                    <dd>
                      {phase >= 2 ? (
                        <span className={cn("rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase", taintStyles[call.taint])}>
                          {call.taint}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">checking…</span>
                      )}
                    </dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <dt className="w-20 text-muted-foreground">Decided by</dt>
                    <dd className="font-mono text-[11px]">{phase >= 5 ? call.stage : "…"}</dd>
                  </div>
                </dl>
                {phase >= 5 && (
                  <p className="step-in mt-3 border-t border-border pt-3 text-[12px] leading-relaxed text-muted-foreground">
                    {call.reason}
                  </p>
                )}
              </article>
            ))}

            {summary && (
              <article data-testid="summary" className="panel step-in border-primary/40 p-4">
                <p className="text-sm font-semibold">Summary — {summary.scenario}</p>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  {[
                    ["Total", summary.total, "text-foreground"],
                    ["Blocked", summary.block, "text-block"],
                    ["Ask", summary.ask, "text-ask-foreground"],
                    ["Allow", summary.allow, "text-primary"],
                  ].map(([l, v, c]) => (
                    <div key={l as string} className="rounded-md border border-border p-2">
                      <p className={cn("font-mono text-lg font-semibold", c as string)}>{v}</p>
                      <p className="text-[10px] uppercase text-muted-foreground">{l}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[12px] text-muted-foreground">
                  {summary.allow > 0
                    ? `${summary.allow} allowed action${summary.allow > 1 ? "s" : ""} reached the OS${summary.ask ? `; ${summary.ask} held for a human` : ""}. No blocked action reached the OS.`
                    : summary.ask > 0
                      ? "Nothing reached the OS without a human approving it first."
                      : "No action reached the OS — every call was stopped."}
                </p>
              </article>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
