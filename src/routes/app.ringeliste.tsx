import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Ban, CalendarClock, Download, Phone, PhoneOff, SkipForward, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CallBadge, Pill } from "@/components/Compliance";
import { CompanyDetails, formatDate } from "@/components/CompanyDetails";
import { checkCall } from "@/lib/compliance";
import { downloadText, toCsv } from "@/lib/csv";
import { OUTCOMES, addDoNotCall, createList, deleteList, nextLead, removeLead, setActiveList, updateLead, useStore, type Lead, type Outcome } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/ringeliste")({ component: CallListPage });

const label = (o: Outcome) => OUTCOMES.find((x) => x.id === o)!.label;

function CallListPage() {
  const store = useStore();
  const list = store.lists.find((l) => l.id === store.activeListId) ?? store.lists[0];
  const dnc = useMemo(() => new Set(store.doNotCall), [store.doNotCall]);
  const [currentCvr, setCurrentCvr] = useState<string | null>(null);

  const queue = useMemo(() => (list ? list.leads.filter((l) => checkCall(l.company, dnc).allowed || l.company.demo) : []), [list, dnc]);
  const current = list?.leads.find((l) => l.company.cvr === currentCvr) ?? nextLead(queue);

  if (!list) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="text-2xl font-bold">Ingen ringeliste endnu</h1>
        <p className="mt-2 text-muted-foreground">Find virksomheder, eller importér dine egne CVR-numre, og tilføj dem til en ringeliste.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild>
            <Link to="/app">Find leads</Link>
          </Button>
          <Button variant="outline" onClick={() => createList("Min ringeliste")}>
            Opret tom liste
          </Button>
        </div>
      </div>
    );
  }

  const done = list.leads.filter((l) => OUTCOMES.find((o) => o.id === l.outcome)?.done).length;
  const meetings = list.leads.filter((l) => l.outcome === "moede").length;
  const pct = list.leads.length ? Math.round((done / list.leads.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <label className="text-xs text-muted-foreground" htmlFor="list">
            Ringeliste
          </label>
          <select id="list" className="block w-full max-w-md truncate rounded-md border bg-card px-3 py-2 font-display text-lg font-bold" value={list.id} onChange={(e) => { setActiveList(e.target.value); setCurrentCvr(null); }}>
            {store.lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.leads.length})
              </option>
            ))}
          </select>
        </div>
        <Stat label="Leads" value={list.leads.length} />
        <Stat label="Afsluttet" value={`${pct}%`} />
        <Stat label="Møder" value={meetings} />
        <Button variant="outline" size="sm" onClick={() => downloadText(`${list.name}.csv`, toCsv(list.leads.map((l) => ({ ...l.company, outcome: label(l.outcome), note: l.note, followUp: l.followUp })), { includeEmail: false }))}>
          <Download className="size-4" /> CSV
        </Button>
        <Button variant="ghost" size="sm" onClick={() => window.confirm(`Slet "${list.name}"?`) && deleteList(list.id)}>
          <Trash2 className="size-4" /> Slet
        </Button>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {current ? (
          <CallCard key={current.company.cvr} listId={list.id} lead={current} dnc={dnc} onNext={() => setCurrentCvr(null)} onSkip={() => {
            const rest = queue.filter((l) => l.company.cvr !== current.company.cvr);
            setCurrentCvr(nextLead(rest)?.company.cvr ?? null);
          }} />
        ) : (
          <div className="rounded-xl border bg-card p-10 text-center">
            <h2 className="text-xl font-bold">Listen er ringet igennem 🎉</h2>
            <p className="mt-2 text-muted-foreground">Der er ingen leads tilbage at ringe til lige nu. Opfølgninger dukker op igen på deres dato.</p>
          </div>
        )}

        <div className="rounded-xl border bg-card">
          <h2 className="border-b px-4 py-3 font-sans text-sm font-bold">Alle leads</h2>
          <ul className="max-h-[70vh] divide-y overflow-y-auto">
            {list.leads.map((l) => (
              <li key={l.company.cvr}>
                <button className={cn("flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-accent", current?.company.cvr === l.company.cvr && "bg-accent")} onClick={() => setCurrentCvr(l.company.cvr)}>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{l.company.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {label(l.outcome)}
                      {l.followUp && ` · ${formatDate(l.followUp)}`}
                      {l.attempts > 0 && ` · ${l.attempts} forsøg`}
                    </div>
                  </div>
                  <OutcomeMark outcome={l.outcome} />
                </button>
              </li>
            ))}
            {list.leads.length === 0 && (
              <li className="p-6 text-center text-sm text-muted-foreground">
                Listen er tom. <Link to="/app" className="underline">Find leads</Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function CallCard({ listId, lead, dnc, onNext, onSkip }: { listId: string; lead: Lead; dnc: ReadonlySet<string>; onNext: () => void; onSkip: () => void }) {
  const c = lead.company;
  const check = checkCall(c, dnc);
  const [outcome, setOutcome] = useState<Outcome>(lead.outcome === "ny" ? "ingen_svar" : lead.outcome);
  const [note, setNote] = useState(lead.note);
  const [followUp, setFollowUp] = useState(lead.followUp ?? "");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      const idx = Number(e.key) - 1;
      const o = OUTCOMES.filter((x) => x.id !== "ny")[idx];
      if (o) setOutcome(o.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const save = () => {
    if (outcome === "ring_tilbage" && !followUp) {
      toast("Vælg en dato for opfølgning.");
      return;
    }
    updateLead(listId, c.cvr, { outcome, note, followUp: followUp || null }, true);
    toast.success(`${c.name}: ${label(outcome)}`);
    onNext();
  };

  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);

  return (
    <div className="space-y-5 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">{c.name}</h1>
          <p className="text-sm text-muted-foreground">
            {c.industryText} · {c.city} {lead.attempts > 0 && `· ${lead.attempts} tidligere forsøg`}
          </p>
        </div>
        <CallBadge check={check} />
      </div>

      {check.allowed ? (
        <a href={`tel:+45${c.phone!.replace(/\s/g, "")}`} className="flex items-center justify-center gap-3 rounded-xl bg-primary px-6 py-4 text-primary-foreground hover:bg-primary/90">
          <Phone className="size-6" aria-hidden />
          <span className="font-mono text-2xl font-semibold">{c.phone}</span>
        </a>
      ) : (
        <div className="flex items-center justify-center gap-3 rounded-xl bg-block-soft px-6 py-4 text-block">
          <PhoneOff className="size-6" aria-hidden />
          <span className="font-mono text-2xl">{c.phone ?? "Intet nummer"}</span>
          <span className="text-sm">· {check.blockers.join(" · ")}</span>
        </div>
      )}
      {check.warnings.length > 0 && <p className="rounded-md bg-warn-soft px-3 py-2 text-sm text-warn">{check.warnings.join(" · ")}</p>}

      <CompanyDetails c={c} showEmail={false} />

      <div>
        <h3 className="mb-2 font-sans text-xs font-bold uppercase tracking-wide text-muted-foreground">Udfald (tast 1–6)</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {OUTCOMES.filter((o) => o.id !== "ny").map((o, i) => (
            <button key={o.id} type="button" aria-pressed={outcome === o.id} onClick={() => setOutcome(o.id)} className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm", outcome === o.id ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/50")}>
              <kbd className={cn("rounded px-1.5 font-mono text-xs", outcome === o.id ? "bg-white/25" : "bg-muted")}>{i + 1}</kbd>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
        <Textarea placeholder="Noter fra samtalen: hvem talte du med, hvad er næste skridt…" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground" htmlFor="fu">
            <CalendarClock className="size-3.5" /> Opfølgning
          </label>
          <Input id="fu" type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setFollowUp(tomorrow)}>I morgen</Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setFollowUp(new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10))}>Om en uge</Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="lg" onClick={save}>Gem og næste</Button>
        <Button size="lg" variant="outline" onClick={onSkip}>
          <SkipForward className="size-4" /> Spring over
        </Button>
        <Button size="lg" variant="ghost" className="ml-auto" onClick={() => {
          addDoNotCall([c.cvr]);
          updateLead(listId, c.cvr, { outcome: "nej_tak", note }, true);
          toast(`${c.name} er sat på ring-ikke-listen`);
          onNext();
        }}>
          <Ban className="size-4" /> Ønsker ikke opkald
        </Button>
        <Button size="lg" variant="ghost" aria-label="Fjern fra listen" onClick={() => { removeLead(listId, c.cvr); onNext(); }}>
          <Trash2 className="size-4" />
        </Button>
      </div>

      {lead.history.length > 0 && (
        <div>
          <h3 className="mb-2 font-sans text-xs font-bold uppercase tracking-wide text-muted-foreground">Historik</h3>
          <ul className="space-y-1 text-sm">
            {[...lead.history].reverse().map((h) => (
              <li key={h.at} className="flex gap-2">
                <span className="text-muted-foreground tabular-nums">{new Date(h.at).toLocaleString("da-DK", { dateStyle: "short", timeStyle: "short" })}</span>
                <strong>{label(h.outcome)}</strong>
                {h.note && <span className="truncate text-muted-foreground">– {h.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function OutcomeMark({ outcome }: { outcome: Outcome }) {
  if (outcome === "ny") return null;
  if (outcome === "moede" || outcome === "interesseret") return <Pill tone="ok">{label(outcome)}</Pill>;
  if (outcome === "ring_tilbage") return <Pill tone="warn">{label(outcome)}</Pill>;
  return <Pill tone="block">{label(outcome)}</Pill>;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-1.5">
      <div className="font-display text-lg font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
