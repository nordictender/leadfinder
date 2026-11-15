# leadfinder.dk – noter til udviklere og agenter

- Selvstændig app (TanStack Start + Vite + Nitro). Ingen Lovable-afhængigheder; hold det sådan.
- Al data normaliseres til `Company` (`src/lib/cvr/types.ts`). Nye kilder får deres egen normalizer.
- Serverkode: `src/lib/*.functions.ts` (createServerFn) og `*.server.ts`, som kun importeres dynamisk inde i handlers.
- Compliance er ikke til forhandling: reklamebeskyttede virksomheder må aldrig vises i søgning, eksport eller ringekø (`src/lib/compliance.ts`, `search.ts`, `cvr/es-query.ts`). Tests skal dække det.
- Farver skal kunne skelnes ved rød-grøn farveblindhed: blå = ok, orange = advarsel, skifer = blokeret, altid med ikon + tekst.
- Kør `bun run test` og `bun run build` før push.
