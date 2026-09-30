import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteChrome } from "@/components/SiteChrome";
import { profiles, stages } from "@/lib/agentgate";
import { cn } from "@/lib/utils";

const title = "Architecture — AgentGate action firewall";
const description =
  "The five stages of AgentGate: normalise, taint tracker, deterministic policy, escalate-only intent scorer, and a local audit log.";

export const Route = createFileRoute("/architecture")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: ArchitecturePage,
});

function ArchitecturePage() {
  const [profileId, setProfileId] = useState(profiles[0]!.id);
  const profile = profiles.find((p) => p.id === profileId)!;

  return (
    <SiteChrome>
      <div className="mx-auto w-full max-w-6xl px-5 py-14">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Architecture</p>
        <h1 className="mt-1.5 text-3xl font-semibold sm:text-4xl">Five stages, one direction of travel</h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          A tool call enters at the top and can only get stricter on its way down. That single rule is what makes the
          firewall predictable enough to trust.
        </p>

        <div className="mt-10 grid gap-3 lg:grid-cols-5">
          {stages.map((s) => (
            <section key={s.n} className="panel flex flex-col p-5">
              <span className="grid size-8 place-items-center rounded-lg deep-surface font-mono text-sm font-semibold">
                {s.n}
              </span>
              <h2 className="mt-3 text-base font-semibold">{s.name}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{s.detail}</p>
            </section>
          ))}
        </div>

        <div className="panel mt-6 flex flex-wrap items-center gap-4 p-5">
          <span className="rounded-full border border-primary/30 bg-secondary px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-secondary-foreground">
            Design rule
          </span>
          <p className="text-sm font-medium">The scorer can only make a decision stricter.</p>
          <p className="font-mono text-xs text-muted-foreground">ALLOW → ASK → BLOCK · never the reverse</p>
        </div>

        <div className="mt-16">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Policy explorer</p>
          <h2 className="mt-1.5 text-2xl font-semibold">Profiles scope what the agent may touch</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => setProfileId(p.id)}
                className={cn(
                  "rounded-lg border px-3.5 py-1.5 text-sm transition-colors",
                  p.id === profileId
                    ? "border-primary/40 bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{profile.summary}</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <section className="panel p-5">
              <h3 className="text-sm font-semibold text-allow">Allowlisted</h3>
              <ul className="mt-3 space-y-2">
                {profile.allow.map((item) => (
                  <li key={item} className="flex items-start gap-2 font-mono text-[12px]">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-allow" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
            <section className="panel p-5">
              <h3 className="text-sm font-semibold text-block">Denylisted</h3>
              <ul className="mt-3 space-y-2">
                {profile.deny.map((item) => (
                  <li key={item} className="flex items-start gap-2 font-mono text-[12px]">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-block" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </SiteChrome>
  );
}
