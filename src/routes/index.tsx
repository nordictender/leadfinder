import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Ban, Bookmark, CircleCheck, Download, FileUp, Filter, MapPin, PhoneCall, ShieldCheck, TriangleAlert, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/Compliance";
import { PublicShell } from "@/components/PublicShell";

export const Route = createFileRoute("/")({ component: Landing });

const FEATURES = [
  { icon: Filter, title: "Filtrér som en sælger tænker", text: "Branche, landsdel, postnummer, antal ansatte, virksomhedsform, alder og om der er et telefonnummer. Antallet opdateres, mens du klikker." },
  { icon: PhoneCall, title: "Ringeliste, der styrer dagen", text: "Ét lead ad gangen med stort klik-for-at-ringe-nummer. Registrér udfald med tasterne 1–6, skriv noter og sæt opfølgning." },
  { icon: Users, title: "Ved hvem du skal bede om", text: "Ledelse og ejere fra CVR vises på hvert lead, så du kan spørge efter beslutningstageren ved navn." },
  { icon: FileUp, title: "Find numre på din egen liste", text: "Indsæt eller upload CVR-numre fra en messe, et CRM eller et regneark. Vi finder telefon, adresse og branche." },
  { icon: Bookmark, title: "Gemte søgninger", text: "Gem dit salgsområde og din kundeprofil, og kom tilbage til præcis de samme virksomheder i næste uge." },
  { icon: Download, title: "Eksport til Excel og CRM", text: "CSV med semikolon, klar til dansk Excel, HubSpot eller Pipedrive. Udfald og noter kommer med." },
];

const FAQ = [
  { q: "Hvor kommer data fra?", a: "Fra Det Centrale Virksomhedsregister (CVR), som er offentligt. Telefonnumre og e-mails er dem, virksomhederne selv har registreret." },
  { q: "Må jeg ringe til virksomhederne?", a: "Telefonsalg til virksomheder er som udgangspunkt lovligt uden samtykke. Virksomheder med reklamebeskyttelse i CVR må dog ikke kontaktes på baggrund af CVR-data, så dem sorterer leadfinder altid fra. Enkeltmandsvirksomheder skal tjekkes mod Robinsonlisten." },
  { q: "Kan jeg sende mails til listen?", a: "Markedsføring på mail og SMS kræver forudgående samtykke, også over for virksomheder. Derfor er e-mail udeladt fra eksporten som standard." },
  { q: "Hvad med virksomheder, der har sagt nej tak?", a: "Klik “Ønsker ikke opkald”, så kommer de på jeres ring-ikke-liste og bliver sorteret fra i alle fremtidige søgninger og lister." },
  { q: "Hvad koster det?", a: "leadfinder er gratis, mens vi er i beta. Priser bliver annonceret, før noget koster penge." },
];

function Landing() {
  return (
    <PublicShell>
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-accent/60 to-background">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:py-24 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm">
              <ShieldCheck className="size-4 text-primary" aria-hidden /> Reklamebeskyttede sorteres altid fra
            </p>
            <h1 className="text-4xl font-bold leading-[1.05] md:text-6xl">
              Fra “hvem skal jeg ringe til?” til en <span className="text-primary">ringeliste på 30 sekunder</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              leadfinder finder de danske virksomheder, der matcher din kundeprofil — med telefonnummer, ledelse og størrelse — og guider dig igennem opkaldene ét ad gangen.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/app">
                  Find leads nu <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/app/opslag">Slå en virksomhed op</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Gratis i beta · Ingen login nødvendigt</p>
          </div>
          <PreviewCard />
        </div>
      </section>

      <section id="funktioner" className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="max-w-2xl text-3xl font-bold md:text-4xl">Ikke endnu et CVR-opslag. Et værktøj til at få ringet.</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6">
              <f.icon className="size-6 text-primary" aria-hidden />
              <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-3">
          {[
            ["1", "Beskriv din kunde", "Vælg branche, område og størrelse. Se med det samme, hvor mange der matcher."],
            ["2", "Lav en ringeliste", "Ét klik lægger dem i en ringeliste. Dem, der ikke må kontaktes, er allerede væk."],
            ["3", "Ring, notér, følg op", "Klik på nummeret, registrér udfaldet, og leadfinder finder det næste lead — opfølgninger først."],
          ].map(([n, t, d]) => (
            <div key={n}>
              <div className="flex size-10 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">{n}</div>
              <h3 className="mt-4 text-xl font-bold">{t}</h3>
              <p className="mt-2 text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="regler" className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">Bygget til at overholde reglerne</h2>
            <p className="mt-4 text-muted-foreground">Telefonsalg til virksomheder er lovligt — men der er regler. leadfinder tager sig af dem, så du ikke skal huske dem midt i en samtale.</p>
          </div>
          <ul className="space-y-4">
            <Rule tone="block" icon={<Ban className="size-4" />} title="Reklamebeskyttede sorteres fra">Virksomheder med reklamebeskyttelse i CVR vises aldrig i søgninger og eksporter (CVR-lovens § 19).</Rule>
            <Rule tone="warn" icon={<TriangleAlert className="size-4" />} title="Enkeltmandsvirksomheder markeres">De er personer i lovens forstand og skal tjekkes mod Robinsonlisten før opkald (Markedsføringsloven § 10).</Rule>
            <Rule tone="ok" icon={<CircleCheck className="size-4" />} title="Jeres egen ring-ikke-liste">Én knap, når nogen siger “ring ikke igen” — så bliver de væk for altid.</Rule>
            <Rule tone="block" icon={<ShieldCheck className="size-4" />} title="Ingen mail-eksport som standard">Mails og SMS kræver samtykke, også til virksomheder.</Rule>
          </ul>
        </div>
      </section>

      <section id="faq" className="border-t bg-card">
        <div className="mx-auto max-w-3xl px-4 py-20">
          <h2 className="text-3xl font-bold">Spørgsmål og svar</h2>
          <div className="mt-8 divide-y rounded-xl border bg-background">
            {FAQ.map((f) => (
              <details key={f.q} className="group p-5">
                <summary className="cursor-pointer list-none font-medium">
                  <span className="mr-2 inline-block text-primary transition group-open:rotate-90">›</span>
                  {f.q}
                </summary>
                <p className="mt-3 pl-5 text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h2 className="text-3xl font-bold md:text-4xl">Klar til næste salgsdag?</h2>
        <Button asChild size="lg" className="mt-6">
          <Link to="/app">
            Byg din første ringeliste <ArrowRight className="size-4" />
          </Link>
        </Button>
      </section>
    </PublicShell>
  );
}

function Rule({ tone, icon, title, children }: { tone: "ok" | "warn" | "block"; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4 rounded-xl border bg-card p-5">
      <Pill tone={tone} icon={icon}>{""}</Pill>
      <div>
        <h3 className="font-sans font-bold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{children}</p>
      </div>
    </li>
  );
}

function PreviewCard() {
  const rows = [
    ["Fjord Software ApS", "8000 Aarhus C", "10–19", "ok"],
    ["Engvang El ApS", "8200 Aarhus N", "5–9", "ok"],
    ["Birkely Tømrer", "8600 Silkeborg", "1–4", "warn"],
    ["Havblik Digital A/S", "8700 Horsens", "20–49", "ok"],
  ] as const;
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-xl" aria-hidden>
      <div className="flex flex-wrap gap-1.5">
        {["IT og software", "Håndværk", "Midtjylland", "5–49 ansatte"].map((c) => (
          <span key={c} className="rounded-full bg-primary px-2.5 py-1 text-xs text-primary-foreground">{c}</span>
        ))}
      </div>
      <div className="mt-4 flex items-end justify-between border-b pb-3">
        <div>
          <div className="font-display text-3xl font-bold">1.284</div>
          <div className="text-xs text-muted-foreground">virksomheder matcher · 212 reklamebeskyttede udeladt</div>
        </div>
        <span className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground"><PhoneCall className="size-3.5" /> Til ringeliste</span>
      </div>
      <ul className="divide-y">
        {rows.map(([n, city, emp, tone]) => (
          <li key={n} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{n}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" /> {city} · {emp} ansatte</div>
            </div>
            {tone === "ok" ? (
              <Pill tone="ok" icon={<CircleCheck className="size-3.5" />}>Kan ringes</Pill>
            ) : (
              <Pill tone="warn" icon={<TriangleAlert className="size-3.5" />}>Tjek Robinson</Pill>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
