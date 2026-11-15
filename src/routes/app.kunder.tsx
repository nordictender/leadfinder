import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Loader2, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EMPLOYEE_BANDS, INDUSTRY_GROUPS, REGIONS } from "@/lib/catalog";
import { matchCustomers } from "@/lib/cvr.functions";
import { DEMO_COMPANIES } from "@/lib/demo-data";
import { segmentToFilters, type Segment } from "@/lib/icp";
import { searchCompanies } from "@/lib/search";
import { saveProfile, setPendingSegment, useStore } from "@/lib/store";

export const Route = createFileRoute("/app/kunder")({ component: CustomersPage });

const EXAMPLE = "Nordic Tender hjælper virksomheder med at vinde offentlige udbud. Vi finder relevante udbud, læser udbudsmaterialet og skriver tilbuddet sammen med kunden. Vores kunder er typisk virksomheder med 10–200 ansatte, der sælger til kommuner og regioner – fx byggeri, rengøring, IT og rådgivning.";

function CustomersPage() {
  const { profile } = useStore();
  const match = useServerFn(matchCustomers);
  const navigate = useNavigate();
  const [text, setText] = useState(profile?.description ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const icp = profile?.icp ?? null;
  // Butikken læses fra localStorage efter første render; hent den gemte beskrivelse ind, når den dukker op.
  useEffect(() => {
    if (profile?.description) setText((t) => t || profile.description);
  }, [profile?.description]);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await match({ data: { description: text } });
      if (r.ok) saveProfile({ description: text, icp: r.icp, updatedAt: new Date().toISOString() });
      else setError(r.message);
    } catch {
      setError("Noget gik galt. Prøv igen.");
    } finally {
      setBusy(false);
    }
  };

  const open = (s: Segment) => {
    setPendingSegment({ filters: segmentToFilters(s), name: s.name, pitch: s.pitch });
    navigate({ to: "/app" });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Sparkles className="size-7 text-primary" aria-hidden /> Hvem skal I sælge til?
        </h1>
        <p className="mt-2 text-muted-foreground">Fortæl kort, hvad din virksomhed sælger, og til hvem. Så foreslår leadfinder de kundesegmenter, I skal ringe til – med filtre og en åbningsreplik til hvert.</p>
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-5">
        <label htmlFor="desc" className="text-sm font-bold">Om din virksomhed</label>
        <Textarea id="desc" rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Fx: Vi sælger … til virksomheder, der … Vores bedste kunder er typisk …" />
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={run} disabled={busy || text.trim().length < 20}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Target className="size-4" />}
            {busy ? "Finder dine kunder…" : icp ? "Find igen" : "Find mine kunder"}
          </Button>
          {!text && (
            <Button variant="ghost" size="sm" onClick={() => setText(EXAMPLE)}>
              Brug eksempel (Nordic Tender)
            </Button>
          )}
          <span className="text-xs text-muted-foreground">Mindst 20 tegn. Gemmes kun i din browser.</span>
        </div>
        {error && <p className="rounded-md bg-block-soft px-3 py-2 text-sm">{error}</p>}
      </div>

      {icp && (
        <div className="space-y-4">
          <p className="text-lg">{icp.summary}</p>
          <div className="grid gap-4 md:grid-cols-2">
            {icp.segments.map((s, i) => (
              <SegmentCard key={s.name} s={s} rank={i + 1} onOpen={() => open(s)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SegmentCard({ s, rank, onOpen }: { s: Segment; rank: number; onOpen: () => void }) {
  const count = useMemo(() => searchCompanies(DEMO_COMPANIES, segmentToFilters(s)).rows.length, [s]);
  const tags = [
    ...s.industries.map((c) => INDUSTRY_GROUPS.find((g) => g.code === c)?.label.split(" –")[0] ?? c),
    s.regions.length ? s.regions.map((r) => REGIONS.find((x) => x.id === r)?.label ?? r).join(", ") : "Hele landet",
    s.employeeBands.length ? `${s.employeeBands.map((b) => EMPLOYEE_BANDS.find((x) => x.id === b)?.label ?? b).join(", ")} ansatte` : null,
    ...s.forms,
  ].filter(Boolean) as string[];
  return (
    <div className="flex flex-col rounded-xl border bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-display font-bold text-primary-foreground">{rank}</span>
        <div>
          <h2 className="text-lg font-bold">{s.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{s.why}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span key={t} className="rounded-full bg-accent px-2.5 py-0.5 text-xs">{t}</span>
        ))}
      </div>
      <blockquote className="mt-3 border-l-4 border-primary pl-3 text-sm italic">“{s.pitch}”</blockquote>
      <div className="mt-auto flex items-center gap-3 pt-4">
        <Button onClick={onOpen}>
          Se virksomhederne <ArrowRight className="size-4" />
        </Button>
        <span className="text-xs text-muted-foreground">{count} i testdata</span>
      </div>
    </div>
  );
}
