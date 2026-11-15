import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { searchLeads } from "@/lib/cvr.functions";
import { toast } from "sonner";
import { Bookmark, ChevronDown, Download, FlaskConical, PhoneCall, RotateCcw, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CallBadge } from "@/components/Compliance";
import { CompanyDetails } from "@/components/CompanyDetails";
import { EMPLOYEE_BANDS, FORMS, INDUSTRY_GROUPS, REGIONS } from "@/lib/catalog";
import { checkCall } from "@/lib/compliance";
import { downloadText, toCsv } from "@/lib/csv";
import { DEMO_COMPANIES } from "@/lib/demo-data";
import { EMPTY_FILTERS, searchCompanies, type SearchFilters } from "@/lib/search";
import { addToList, createList, deleteSavedSearch, saveSearch, takePendingSegment, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/")({ component: SearchPage });

const PAGE = 50;

function SearchPage() {
  const store = useStore();
  const [segment] = useState(() => takePendingSegment());
  const [f, setF] = useState<SearchFilters>(segment?.filters ?? EMPTY_FILTERS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [showFilters, setShowFilters] = useState(false);
  const dnc = useMemo(() => new Set(store.doNotCall), [store.doNotCall]);

  const live = useServerFn(searchLeads);
  const [debounced, setDebounced] = useState(f);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(f), 300);
    return () => clearTimeout(t);
  }, [f]);
  const remote = useQuery({
    queryKey: ["leads", debounced, limit],
    queryFn: () => live({ data: { filters: debounced, from: 0, size: Math.min(limit, 200) } }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
  const isLive = remote.data?.source === "cvr";
  const demo = useMemo(() => searchCompanies(DEMO_COMPANIES, f), [f]);
  const rows = remote.data?.source === "cvr" ? remote.data.rows : demo.rows;
  const total = remote.data?.source === "cvr" ? remote.data.total : demo.rows.length;
  const excludedProtected = isLive ? null : demo.excludedProtected;
  const callable = rows.filter((c) => !dnc.has(c.cvr));
  const visible = rows.slice(0, limit);

  const update = (patch: Partial<SearchFilters>) => {
    setF((prev) => ({ ...prev, ...patch }));
    setLimit(PAGE);
  };
  const toggle = (key: "industries" | "regions" | "employeeBands" | "forms", value: string) =>
    update({ [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value] });

  const chosen = () => {
    const set = selected.size ? rows.filter((r) => selected.has(r.cvr)) : callable;
    return set.filter((c) => !dnc.has(c.cvr));
  };

  const addToCallList = () => {
    const companies = chosen();
    if (!companies.length) {
      toast("Ingen virksomheder at tilføje.");
      return;
    }
    const active = store.lists.find((l) => l.id === store.activeListId);
    if (active) {
      const n = addToList(active.id, companies);
      toast.success(`${n} tilføjet til "${active.name}"`, { description: n < companies.length ? `${companies.length - n} var der allerede.` : undefined });
    } else {
      createList(segment?.name ?? (describe(f) || "Min ringeliste"), companies, segment?.pitch);
      toast.success(`Ringeliste oprettet med ${companies.length} virksomheder`);
    }
    setSelected(new Set());
  };

  const newList = () => {
    const companies = chosen();
    const name = window.prompt("Navn på den nye ringeliste", segment?.name ?? (describe(f) || "Ny ringeliste"));
    if (!name) return;
    createList(name, companies, segment?.pitch);
    toast.success(`"${name}" oprettet med ${companies.length} virksomheder`);
    setSelected(new Set());
  };

  const exportCsv = () => {
    const companies = chosen();
    downloadText(`leadfinder-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(companies, { includeEmail: false }));
    toast(`${companies.length} virksomheder eksporteret`, { description: "Reklamebeskyttede og ring-ikke er udeladt. Email er udeladt, da mails kræver samtykke." });
  };

  const active = Object.entries(f).some(([k, v]) => (Array.isArray(v) ? v.length : typeof v === "string" ? v : v !== EMPTY_FILTERS[k as keyof SearchFilters]));

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <aside className={cn("space-y-5 lg:block", showFilters ? "block" : "hidden")}>
        <FilterGroup title="Branche">
          <div className="flex flex-wrap gap-1.5">
            {INDUSTRY_GROUPS.map((g) => (
              <Chip key={g.code} on={f.industries.includes(g.code)} onClick={() => toggle("industries", g.code)}>
                {g.label}
              </Chip>
            ))}
          </div>
        </FilterGroup>
        <FilterGroup title="Landsdel">
          <div className="flex flex-wrap gap-1.5">
            {REGIONS.map((r) => (
              <Chip key={r.id} on={f.regions.includes(r.id)} onClick={() => toggle("regions", r.id)}>
                {r.label}
              </Chip>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Input inputMode="numeric" placeholder="Postnr. fra" value={f.zipFrom} onChange={(e) => update({ zipFrom: e.target.value.replace(/\D/g, "").slice(0, 4) })} />
            <span className="text-muted-foreground">–</span>
            <Input inputMode="numeric" placeholder="til" value={f.zipTo} onChange={(e) => update({ zipTo: e.target.value.replace(/\D/g, "").slice(0, 4) })} />
          </div>
        </FilterGroup>
        <FilterGroup title="Antal ansatte">
          <div className="flex flex-wrap gap-1.5">
            {EMPLOYEE_BANDS.map((b) => (
              <Chip key={b.id} on={f.employeeBands.includes(b.id)} onClick={() => toggle("employeeBands", b.id)}>
                {b.label}
              </Chip>
            ))}
          </div>
        </FilterGroup>
        <FilterGroup title="Virksomhedsform">
          <div className="flex flex-wrap gap-1.5">
            {FORMS.slice(0, 4).map((x) => (
              <Chip key={x} on={f.forms.includes(x)} onClick={() => toggle("forms", x)}>
                {x}
              </Chip>
            ))}
          </div>
        </FilterGroup>
        <FilterGroup title="Stiftet efter">
          <Input type="date" value={f.foundedAfter} onChange={(e) => update({ foundedAfter: e.target.value })} />
        </FilterGroup>
        <FilterGroup title="Kontakt og status">
          <Toggle checked={f.requirePhone} onChange={(v) => update({ requirePhone: v })} label="Har telefonnummer" />
          <Toggle checked={f.requireEmail} onChange={(v) => update({ requireEmail: v })} label="Har email" />
          <Toggle checked={f.onlyActive} onChange={(v) => update({ onlyActive: v })} label="Kun aktive virksomheder" />
          <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Reklamebeskyttede virksomheder er altid sorteret fra.
          </p>
        </FilterGroup>
      </aside>

      <section className="min-w-0 space-y-4">
        {segment && (
          <div className="rounded-lg border bg-card px-3 py-2 text-sm">
            <span className="text-muted-foreground">Segment:</span> <strong>{segment.name}</strong>
          </div>
        )}
        {remote.data?.source === "error" && <p className="rounded-lg bg-block-soft px-3 py-2 text-sm">{remote.data.message}</p>}
        {!isLive && <div className="flex items-start gap-2 rounded-lg border border-warn/30 bg-warn-soft px-3 py-2 text-sm">
          <FlaskConical className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
          <p>
            <strong>Testdata.</strong> Filtersøgningen kører på fiktive virksomheder, indtil adgangen til hele CVR-registret er koblet på. Rigtige opslag og telefonnumre finder du under{" "}
            <Link to="/app/opslag" className="font-medium underline">
              Opslag & import
            </Link>
            .
          </p>
        </div>}

        <div className="flex flex-wrap items-center gap-2">
          <Input className="max-w-sm flex-1" placeholder="Søg i navn, by eller CVR…" value={f.text} onChange={(e) => update({ text: e.target.value })} />
          <Button variant="outline" className="lg:hidden" onClick={() => setShowFilters((s) => !s)}>
            Filtre <ChevronDown className={cn("size-4 transition", showFilters && "rotate-180")} />
          </Button>
          {active && (
            <Button variant="ghost" size="sm" onClick={() => update(EMPTY_FILTERS)}>
              <RotateCcw className="size-4" /> Nulstil
            </Button>
          )}
        </div>

        {store.savedSearches.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">Gemte:</span>
            {store.savedSearches.map((s) => (
              <span key={s.id} className="inline-flex items-center rounded-full border bg-card">
                <button className="py-0.5 pl-3 pr-1 hover:underline" onClick={() => update(s.filters)}>
                  {s.name}
                </button>
                <button aria-label={`Slet ${s.name}`} className="px-1.5 text-muted-foreground hover:text-foreground" onClick={() => deleteSavedSearch(s.id)}>
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="sticky top-14 z-20 -mx-4 flex flex-wrap items-center gap-3 border-y bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
          <div>
            <div className="font-display text-2xl font-bold tabular-nums">{total.toLocaleString("da-DK")}</div>
            <div className="text-xs text-muted-foreground">
              virksomheder matcher · {excludedProtected === null ? "reklamebeskyttede er udeladt" : `${excludedProtected.toLocaleString("da-DK")} reklamebeskyttede udeladt`}{isLive && " · live fra CVR"}
            </div>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              const name = window.prompt("Navn på søgningen", describe(f) || "Min søgning");
              if (name) { saveSearch(name, f); toast.success("Søgning gemt"); }
            }}>
              <Bookmark className="size-4" /> Gem søgning
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="size-4" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={newList}>
              Ny liste
            </Button>
            <Button size="sm" onClick={addToCallList}>
              <PhoneCall className="size-4" />
              {selected.size ? `Tilføj ${selected.size} valgte` : `Tilføj ${isLive && total > callable.length ? `de første ${callable.length}` : `alle ${callable.length}`}`} til ringeliste
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="hidden grid-cols-[32px_1fr_130px_90px_120px] gap-3 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground md:grid">
            <input
              type="checkbox"
              aria-label="Vælg alle viste"
              checked={visible.length > 0 && visible.every((r) => selected.has(r.cvr))}
              onChange={(e) => setSelected(e.target.checked ? new Set([...selected, ...visible.map((r) => r.cvr)]) : new Set())}
            />
            <span>Virksomhed</span>
            <span>Telefon</span>
            <span>Ansatte</span>
            <span>Status</span>
          </div>
          {visible.length === 0 && <p className="p-8 text-center text-muted-foreground">Ingen virksomheder matcher. Prøv at fjerne et filter.</p>}
          <ul className="divide-y">
            {visible.map((c) => {
              const check = checkCall(c, dnc);
              const isOpen = open === c.cvr;
              return (
                <li key={c.cvr}>
                  <div className="grid grid-cols-[32px_1fr_auto] items-center gap-3 px-3 py-2.5 md:grid-cols-[32px_1fr_130px_90px_120px]">
                    <input
                      type="checkbox"
                      aria-label={`Vælg ${c.name}`}
                      checked={selected.has(c.cvr)}
                      onChange={(e) => {
                        const s = new Set(selected);
                        if (e.target.checked) s.add(c.cvr);
                        else s.delete(c.cvr);
                        setSelected(s);
                      }}
                    />
                    <button className="min-w-0 text-left" onClick={() => setOpen(isOpen ? null : c.cvr)} aria-expanded={isOpen}>
                      <div className="truncate font-medium">{c.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {c.industryText} · {c.zip} {c.city}
                      </div>
                    </button>
                    <span className="hidden font-mono text-sm md:block">{c.phone ?? "–"}</span>
                    <span className="hidden text-sm md:block">{c.employees ?? "–"}</span>
                    <CallBadge check={check} compact />
                  </div>
                  {isOpen && (
                    <div className="border-t bg-muted/30 px-3 py-4 md:pl-14">
                      <CompanyDetails c={c} />
                      {check.warnings.length > 0 && <p className="mt-3 text-sm text-warn">{check.warnings.join(" · ")}</p>}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {(isLive ? total > rows.length && limit < 200 : rows.length > limit) && (
            <div className="border-t p-3 text-center">
              <Button variant="ghost" onClick={() => setLimit((l) => l + PAGE)}>
                Vis flere ({((isLive ? total : rows.length) - Math.min(limit, rows.length)).toLocaleString("da-DK")} tilbage)
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function describe(f: SearchFilters): string {
  const parts = [
    ...f.industries.map((c) => INDUSTRY_GROUPS.find((g) => g.code === c)?.label.split(" –")[0]),
    ...f.regions.map((r) => REGIONS.find((x) => x.id === r)?.label),
    f.employeeBands.length ? `${f.employeeBands.join("/")} ansatte` : null,
  ].filter(Boolean);
  return parts.join(", ").slice(0, 60);
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 font-sans text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs transition",
        on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary/50",
      )}
    >
      {children}
    </button>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 py-1 text-sm">
      <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
