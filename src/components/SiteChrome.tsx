import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Demo" },
  { to: "/architecture", label: "Architecture" },
  { to: "/results", label: "Results" },
] as const;

export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg deep-surface font-display text-sm font-bold">
              AG
            </span>
            <span className="font-display text-base font-semibold tracking-tight">AgentGate</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground font-medium" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/70 bg-surface">
        <div className="mx-auto w-full max-w-6xl px-5 py-6 text-xs text-muted-foreground">
          AgentGate · Snapdragon AI Lab Build &amp; Present Challenge · Rehan Arvi
        </div>
      </footer>
    </div>
  );
}
