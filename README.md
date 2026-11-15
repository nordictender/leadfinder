# leadfinder.dk

Find danske virksomheder at ringe til, byg ringelister og ring dem igennem. Reklamebeskyttede virksomheder er altid sorteret fra.


## Stak
TanStack Start + React 19 + Tailwind 4, bygget med Vite og Nitro. Ingen afhængighed af Lovable.

```bash
bun install
bun run dev      # http://localhost:3000
bun run test     # vitest
bun run build    # .output/
bun run start    # kør den byggede server (Node)
```

## Hosting
Nitro vælger selv preset ud fra hvor den bygges, så samme kode kører på:
- **Vercel** (anbefalet): "Add New Project" → importér `nordictender/leadfinder` → Deploy. Ingen opsætning nødvendig.
- **Netlify** eller **Cloudflare**: importér repoet; build-kommando `bun run build`.
- **Egen server**: `bun run build && bun run start` (Node 22, port via `PORT`).

Miljøvariabler (sættes hos hostingudbyderen):

| Navn | Formål |
|---|---|
| `CVRAPI_TOKEN` | Valgfri nøgle til cvrapi.dk (højere kvote) |
| `CVR_ES_USER`, `CVR_ES_PASSWORD` | Erhvervsstyrelsens CVR system-til-system; slår live-filtersøgning til |

**Domæne:** tilføj `leadfinder.dk` og `www.leadfinder.dk` hos hostingudbyderen og indtast de DNS-records, den viser, under DNS hos GoDaddy.

## Sider
| Rute | Indhold |
|---|---|
| `/` | Forside (prerenderet) |
| `/app` | Find leads: filtre, live-antal, gem søgning, CSV, tilføj til ringeliste |
| `/app/ringeliste` | Ringekø: klik-for-at-ringe, udfald (tast 1–6), noter, opfølgning, historik |
| `/app/opslag` | Live-opslag via cvrapi.dk + import af egne CVR-numre (beriges med telefon m.m.) |
| `/app/ring-ikke` | Kundens egen ring-ikke-liste |

## Data
- **cvrapi.dk** (`src/lib/cvr/cvrapi.server.ts`): live-opslag og berigelse. Valgfri nøgle i secret `CVRAPI_TOKEN`. Kalder med User-Agent `leadfinder.dk - kontakt@leadfinder.dk`.
- **Testdata** (`src/lib/demo-data.ts`): 4.000 fiktive virksomheder til filtersøgningen. CVR-numrene fejler modulus-11, så de aldrig er rigtige, og opkald er spærret.
- **CVR system-til-system** (`src/lib/cvr/es-query.ts`, `es.server.ts`): filtersøgning i hele registret via Erhvervsstyrelsens Elasticsearch (1.7-syntaks). Slås til automatisk, når secrets `CVR_ES_USER` og `CVR_ES_PASSWORD` er sat; ellers bruges testdata. Feltnavne er samlet i `ES_FIELDS` og skal verificeres mod det første rigtige svar.
- Alle kilder normaliseres til `Company` i `src/lib/cvr/types.ts`.
- Ringelister, noter, gemte søgninger og ring-ikke gemmes i browserens localStorage (`src/lib/store.ts`) indtil der kommer login/database.

## Regler (håndhævet i `src/lib/compliance.ts`)
- Reklamebeskyttede (CVR-lovens § 19) vises aldrig i søgning og eksport og kan ikke ringes op.
- Ophørte/konkursramte og ring-ikke blokeres.
- Enkeltmandsvirksomheder får advarsel om Robinsonlisten (Markedsføringsloven § 10).
- CSV-eksport udelader email som standard (mails kræver samtykke) og neutraliserer Excel-formler.

## Farver
Rød-grøn-sikker palet: blå = kan ringes, orange = advarsel, grå/skifer = blokeret. Status vises altid med ikon og tekst.
