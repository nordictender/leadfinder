import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Ban, PhoneCall, Search, ScanSearch, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ title: "leadfinder.dk – app" }, { name: "robots", content: "noindex" }] }),
  component: AppLayout,
});

const NAV = [
  { to: "/app/kunder", label: "Mine kunder", icon: Sparkles, exact: false },
  { to: "/app", label: "Find leads", icon: Search, exact: true },
  { to: "/app/ringeliste", label: "Ringeliste", icon: PhoneCall, exact: false },
  { to: "/app/opslag", label: "Opslag", icon: ScanSearch, exact: false },
  { to: "/app/ring-ikke", label: "Ring ikke", icon: Ban, exact: false },
] as const;

function AppLayout() {
  const { lists, activeListId } = useStore();
  const active = lists.find((l) => l.id === activeListId);
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
          <Logo />
          <nav className="hidden gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.exact }}
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                activeProps={{ className: "bg-accent !text-foreground font-medium" }}
              >
                <n.icon className="size-4" aria-hidden />
                {n.label}
                {n.to === "/app/ringeliste" && active && <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{active.leads.length}</span>}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-background md:hidden">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            activeOptions={{ exact: n.exact }}
            className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground"
            activeProps={{ className: "!text-primary font-medium" }}
          >
            <n.icon className="size-5" aria-hidden />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
