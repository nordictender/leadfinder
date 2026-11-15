import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "./ui/button";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Logo />
          <nav className="ml-auto flex items-center gap-1 text-sm">
            <a href="/#funktioner" className="hidden rounded-md px-3 py-2 text-muted-foreground hover:text-foreground sm:block">Funktioner</a>
            <a href="/#regler" className="hidden rounded-md px-3 py-2 text-muted-foreground hover:text-foreground sm:block">Regler</a>
            <a href="/#faq" className="hidden rounded-md px-3 py-2 text-muted-foreground hover:text-foreground sm:block">FAQ</a>
            <Button asChild size="sm">
              <Link to="/app">Find leads</Link>
            </Button>
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t py-8 text-sm text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-2 px-4">
          <span>© {new Date().getFullYear()} leadfinder.dk</span>
          <span>Data fra Det Centrale Virksomhedsregister (CVR)</span>
          <Link to="/privatliv" className="hover:text-foreground">Privatlivspolitik</Link>
          <Link to="/vilkaar" className="hover:text-foreground">Vilkår</Link>
          <a href="mailto:kontakt@leadfinder.dk" className="hover:text-foreground">kontakt@leadfinder.dk</a>
        </div>
      </footer>
    </div>
  );
}
