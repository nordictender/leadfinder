# leadfinder.dk – noter til udviklere og agenter

- Hostes i Lovable (TanStack Start-skabelonen, `@lovable.dev/vite-tanstack-config`). Commits til main synkroniseres til Lovable: hold main bygbar, og omskriv aldrig pushet historik.
- Hemmeligheder (`ANTHROPIC_API_KEY`, `CVRAPI_TOKEN`, `CVR_ES_USER`, `CVR_ES_PASSWORD`) sættes som secrets i Lovable.
- Al data normaliseres til `Company` (`src/lib/cvr/types.ts`). Nye kilder får deres egen normalizer.
- Serverkode: `src/lib/*.functions.ts` (createServerFn) og `*.server.ts`, som kun importeres dynamisk inde i handlers.
- Compliance er ikke til forhandling: reklamebeskyttede virksomheder må aldrig vises i søgning, eksport eller ringekø (`src/lib/compliance.ts`, `search.ts`, `cvr/es-query.ts`). Tests skal dække det.
- Farver skal kunne skelnes ved rød-grøn farveblindhed: blå = ok, orange = advarsel, skifer = blokeret, altid med ikon + tekst.
- Kør `bun run test` og `bun run build` før push.
