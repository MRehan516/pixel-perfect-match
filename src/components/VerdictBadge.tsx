import { verdictLabel, verdictStyles, type Verdict } from "@/lib/agentgate";
import { cn } from "@/lib/utils";

export function VerdictBadge({ verdict, className }: { verdict: Verdict; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide",
        verdictStyles[verdict],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {verdictLabel[verdict]}
    </span>
  );
}
