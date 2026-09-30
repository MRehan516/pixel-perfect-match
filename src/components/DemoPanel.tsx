import { useEffect, useRef, useState } from "react";
import { VerdictBadge } from "@/components/VerdictBadge";
import { scenarios, untrustedContent, type ToolCall } from "@/lib/agentgate";
import { cn } from "@/lib/utils";

const taintStyles: Record<string, string> = {
  email: "bg-ask-soft text-ask-foreground border-ask/40",
  web: "bg-block-soft text-block border-block/30",
  none: "bg-secondary text-secondary-foreground border-border",
};

type Row = { call: ToolCall; phase: 0 | 1 | 2 | 3 };

export function DemoPanel() {
  const [active, setActive] = useState(scenarios[0]);
  const [task, setTask] = useState(scenarios[0].task);
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function run(scenarioId: string) {
    const scenario = scenarios.find((s) => s.id === scenarioId)!;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setActive(scenario);
    setTask(scenario.task);
    setRows([]);
    setRunning(true);

    let t = 220;
    scenario.calls.forEach((call, i) => {
      timers.current.push(
        setTimeout(() => setRows((r) => [...r, { call, phase: 0 }]), t),
      );
      [1, 2, 3].forEach((phase, k) => {
        timers.current.push(
          setTimeout(
            () =>
              setRows((r) =>
                r.map((row) => (row.call.id === call.id ? { ...row, phase: phase as 1 | 2 | 3 } : row)),
              ),
            t + 420 * (k + 1),
          ),
        );
      });
      t += 1700;
      if (i === scenario.calls.length - 1) {
        timers.current.push(setTimeout(() => setRunning(false), t));
      }
    });
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
        </div>
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
            {running ? "Running…" : "Run scenario"}
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
            {rows.length === 0 && (
              <div className="panel grid place-items-center p-8 text-center text-sm text-muted-foreground">
                Pick a scenario and run it to watch the firewall decide.
              </div>
            )}
            {rows.map(({ call, phase }) => (
              <article key={call.id} className="panel step-in p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-[13px] font-semibold">{call.tool}</p>
                    <p className="mt-1 break-words font-mono text-[11px] text-muted-foreground">{call.args}</p>
                  </div>
                  {phase >= 3 ? (
                    <VerdictBadge verdict={call.verdict} className="step-in" />
                  ) : (
                    <span className="rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                      …
                    </span>
                  )}
                </div>
                <dl className="mt-3 space-y-1.5 text-[12px]">
                  <div className="flex items-center gap-2">
                    <dt className="w-20 text-muted-foreground">Taint</dt>
                    <dd>
                      {phase >= 1 ? (
                        <span className={cn("rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase", taintStyles[call.taint])}>
                          {call.taint}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">checking…</span>
                      )}
                    </dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <dt className="w-20 text-muted-foreground">Stage</dt>
                    <dd className="font-mono text-[11px]">{phase >= 2 ? call.stage : "…"}</dd>
                  </div>
                </dl>
                {phase >= 3 && (
                  <p className="step-in mt-3 border-t border-border pt-3 text-[12px] leading-relaxed text-muted-foreground">
                    {call.reason}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
