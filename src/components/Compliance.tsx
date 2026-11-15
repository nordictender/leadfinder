import { Ban, CircleCheck, TriangleAlert, FlaskConical } from "lucide-react";
import type { CallCheck } from "@/lib/compliance";
import { cn } from "@/lib/utils";

/** Status vises altid med ikon + tekst (ikke kun farve). */
export function CallBadge({ check, compact = false }: { check: CallCheck; compact?: boolean }) {
  const demoOnly = check.blockers.length === 1 && check.blockers[0]!.startsWith("Testdata");
  if (demoOnly) {
    return (
      <Pill tone="block" icon={<FlaskConical className="size-3.5" aria-hidden />}>
        Testdata
      </Pill>
    );
  }
  if (!check.allowed) {
    return (
      <Pill tone="block" icon={<Ban className="size-3.5" aria-hidden />} title={check.blockers.join(" · ")}>
        {compact ? "Må ikke ringes" : check.blockers[0]}
      </Pill>
    );
  }
  if (check.warnings.length) {
    return (
      <Pill tone="warn" icon={<TriangleAlert className="size-3.5" aria-hidden />} title={check.warnings.join(" · ")}>
        {compact ? "Tjek Robinson" : check.warnings[0]}
      </Pill>
    );
  }
  return (
    <Pill tone="ok" icon={<CircleCheck className="size-3.5" aria-hidden />}>
      Kan ringes
    </Pill>
  );
}

export function Pill({ tone, icon, children, title }: { tone: "ok" | "warn" | "block"; icon?: React.ReactNode; children: React.ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
        tone === "ok" && "bg-ok-soft text-ok",
        tone === "warn" && "bg-warn-soft text-warn",
        tone === "block" && "bg-block-soft text-block",
      )}
    >
      {icon}
      {children}
    </span>
  );
}
