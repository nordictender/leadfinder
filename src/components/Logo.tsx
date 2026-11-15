import { Link } from "@tanstack/react-router";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
      <img src="/favicon.svg" alt="" className="size-7" />
      leadfinder<span className="text-muted-foreground">.dk</span>
    </Link>
  );
}
