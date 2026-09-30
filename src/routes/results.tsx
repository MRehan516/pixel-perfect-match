import { createFileRoute } from "@tanstack/react-router";
import { SiteChrome } from "@/components/SiteChrome";
import { VerdictBadge } from "@/components/VerdictBadge";
import { metrics, resultRows } from "@/lib/agentgate";

const title = "Results — AgentGate benchmark run";
const description =
  "AgentGate benchmark results across 18 scenarios: 8/9 attacks contained, 7/9 benign actions auto-allowed, 26.9 µs median decision latency.";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  return (
    <SiteChrome>
      <div className="mx-auto w-full max-w-6xl px-5 py-14">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Results</p>
        <h1 className="mt-1.5 text-3xl font-semibold sm:text-4xl">18 scenarios, measured on device</h1>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="panel p-5">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">{m.label}</dt>
              <dd className="mt-2 font-display text-3xl font-semibold">{m.value}</dd>
              <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{m.note}</p>
            </div>
          ))}
        </dl>

        <div className="panel mt-10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Scenario</th>
                  <th className="px-4 py-3 font-medium">Kind</th>
                  <th className="px-4 py-3 font-medium">Taint</th>
                  <th className="px-4 py-3 font-medium">Verdict</th>
                </tr>
              </thead>
              <tbody>
                {resultRows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.id}</td>
                    <td className="px-4 py-3">{r.scenario}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.kind}</td>
                    <td className="px-4 py-3 font-mono text-xs uppercase text-muted-foreground">{r.taint}</td>
                    <td className="px-4 py-3">
                      <VerdictBadge verdict={r.verdict} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SiteChrome>
  );
}
