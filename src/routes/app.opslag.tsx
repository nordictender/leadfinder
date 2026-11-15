import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileUp, Loader2, PhoneCall, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CallBadge } from "@/components/Compliance";
import { CompanyDetails } from "@/components/CompanyDetails";
import { checkCall } from "@/lib/compliance";
import { enrichCvrs, lookupCompany } from "@/lib/cvr.functions";
import { extractCvrs } from "@/lib/csv";
import type { Company } from "@/lib/cvr/types";
import { addToList, createList, useStore } from "@/lib/store";

export const Route = createFileRoute("/app/opslag")({ component: LookupPage });

const BATCH = 10;
const MAX_IMPORT = 500;

function LookupPage() {
  const store = useStore();
  const dnc = useMemo(() => new Set(store.doNotCall), [store.doNotCall]);
  const lookup = useServerFn(lookupCompany);
  const enrich = useServerFn(enrichCvrs);

  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState<Company | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [paste, setPaste] = useState("");
  const cvrs = useMemo(() => extractCvrs(paste).slice(0, MAX_IMPORT), [paste]);
  const [progress, setProgress] = useState<{ done: number; ok: Company[]; failed: string[] } | null>(null);

  const addOne = (c: Company) => {
    const active = store.lists.find((l) => l.id === store.activeListId);
    if (active) {
      const n = addToList(active.id, [c]);
      toast(n ? `Tilføjet til "${active.name}"` : "Står allerede på listen");
    } else {
      createList("Min ringeliste", [c]);
      toast.success("Ringeliste oprettet");
    }
  };

  const doLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim().length < 2) return;
    setBusy(true);
    setError(null);
    setFound(null);
    try {
      const r = await lookup({ data: { query: q } });
      if (r.ok) setFound(r.company);
      else setError(r.message);
    } catch {
      setError("Opslaget fejlede. Prøv igen.");
    } finally {
      setBusy(false);
    }
  };

  const runImport = async () => {
    const state = { done: 0, ok: [] as Company[], failed: [] as string[] };
    setProgress({ ...state });
    for (let i = 0; i < cvrs.length; i += BATCH) {
      const chunk = cvrs.slice(i, i + BATCH);
      try {
        const res = await enrich({ data: { cvrs: chunk } });
        for (const r of res) {
          if (r.result.ok) state.ok.push(r.result.company);
          else state.failed.push(`${r.cvr}: ${r.result.message}`);
          if (!r.result.ok && r.result.code === "QUOTA_EXCEEDED") {
            setProgress({ ...state, done: cvrs.length });
            toast.error(r.result.message);
            return finishImport(state.ok);
          }
        }
        state.done += chunk.length;
      } catch {
        state.failed.push(...chunk.map((c) => `${c}: netværksfejl`));
        state.done += chunk.length;
      }
      setProgress({ ...state });
    }
    finishImport(state.ok);
  };

  const finishImport = (companies: Company[]) => {
    if (!companies.length) return;
    createList(`Import ${new Date().toLocaleDateString("da-DK")}`, companies);
    const blocked = companies.filter((c) => !checkCall(c, dnc).allowed).length;
    toast.success(`${companies.length} virksomheder importeret til en ny ringeliste`, { description: blocked ? `${blocked} må ikke ringes op (reklamebeskyttet, ophørt eller uden nummer) og springes over i ringekøen.` : undefined });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Slå en virksomhed op</h1>
          <p className="text-sm text-muted-foreground">Søg på navn, CVR-nummer eller telefonnummer. Data hentes live fra CVR via cvrapi.dk.</p>
        </div>
        <form onSubmit={doLookup} className="flex gap-2">
          <Input autoFocus placeholder="Fx Novo Nordisk, 24256790 eller 44448888" value={q} onChange={(e) => setQ(e.target.value)} />
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />} Søg
          </Button>
        </form>
        {error && <p className="rounded-md bg-block-soft px-3 py-2 text-sm">{error}</p>}
        {found && (
          <div className="space-y-4 rounded-xl border bg-card p-5">
            <div className="flex flex-wrap items-start gap-2">
              <h2 className="min-w-0 flex-1 text-xl font-bold">{found.name}</h2>
              <CallBadge check={checkCall(found, dnc)} />
            </div>
            <CompanyDetails c={found} />
            <Button onClick={() => addOne(found)} disabled={!checkCall(found, dnc).allowed}>
              <PhoneCall className="size-4" /> Tilføj til ringeliste
            </Button>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Find telefonnumre på din egen liste</h2>
          <p className="text-sm text-muted-foreground">Indsæt CVR-numre, eller upload en CSV/Excel-eksport. Vi finder telefon, adresse, branche og ledelse og laver en ringeliste. Reklamebeskyttede markeres automatisk.</p>
        </div>
        <Textarea rows={8} placeholder={"12345678\n87654321\nDK11223344 …"} value={paste} onChange={(e) => setPaste(e.target.value)} />
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
            <FileUp className="size-4" /> Upload CSV
            <input type="file" accept=".csv,.txt,text/csv,text/plain" className="sr-only" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) setPaste(await file.text());
            }} />
          </label>
          <span className="text-sm text-muted-foreground">{cvrs.length} CVR-numre fundet{cvrs.length === MAX_IMPORT && ` (maks. ${MAX_IMPORT} pr. import)`}</span>
          <Button className="ml-auto" disabled={!cvrs.length || (progress !== null && progress.done < cvrs.length)} onClick={runImport}>
            Hent data
          </Button>
        </div>
        {progress && (
          <div className="space-y-2 rounded-lg border bg-card p-4 text-sm">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${cvrs.length ? (progress.done / cvrs.length) * 100 : 0}%` }} />
            </div>
            <p>
              {progress.done} af {cvrs.length} behandlet · {progress.ok.length} fundet · {progress.ok.filter((c) => c.phone).length} med telefonnummer
            </p>
            {progress.failed.length > 0 && (
              <details>
                <summary className="cursor-pointer text-muted-foreground">{progress.failed.length} kunne ikke hentes</summary>
                <ul className="mt-1 max-h-40 overflow-y-auto font-mono text-xs">
                  {progress.failed.map((f) => <li key={f}>{f}</li>)}
                </ul>
              </details>
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground">Den gratis adgang til cvrapi.dk har et dagligt loft. Med en API-nøgle kan der hentes flere.</p>
      </section>
    </div>
  );
}
