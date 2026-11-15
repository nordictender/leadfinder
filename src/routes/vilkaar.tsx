import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";

export const Route = createFileRoute("/vilkaar")({
  head: () => ({ meta: [{ title: "Vilkår – leadfinder.dk" }] }),
  component: () => (
    <PublicShell>
      <article className="mx-auto max-w-3xl space-y-4 px-4 py-16 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold">
        <h1 className="text-3xl font-bold">Vilkår</h1>
        <p className="rounded-md bg-warn-soft px-3 py-2 text-sm">Udkast – skal gennemgås før lancering.</p>
        <h2>Brug af data</h2>
        <p>Du er selv ansvarlig for, at din markedsføring overholder markedsføringsloven, CVR-loven og databeskyttelsesreglerne. Det indebærer blandt andet, at du ikke kontakter reklamebeskyttede virksomheder, at du tjekker enkeltmandsvirksomheder mod Robinsonlisten, og at du ikke sender markedsføring på mail eller SMS uden samtykke.</p>
        <h2>Videresalg</h2>
        <p>Data fra leadfinder må ikke videresælges eller genudgives som en selvstændig database.</p>
        <h2>Ansvar</h2>
        <p>Data stammer fra CVR og kan være forældede eller mangelfulde. leadfinder leveres i beta uden garanti.</p>
      </article>
    </PublicShell>
  ),
});
