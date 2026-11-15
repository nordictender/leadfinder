import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";

export const Route = createFileRoute("/privatliv")({
  head: () => ({ meta: [{ title: "Privatlivspolitik – leadfinder.dk" }] }),
  component: () => (
    <PublicShell>
      <article className="mx-auto max-w-3xl space-y-4 px-4 py-16 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold">
        <h1 className="text-3xl font-bold">Privatlivspolitik</h1>
        <p className="rounded-md bg-warn-soft px-3 py-2 text-sm">Udkast – skal gennemgås før lancering. Dataansvarlig: [virksomhedsnavn, CVR og adresse indsættes].</p>
        <h2>Hvilke data viser vi?</h2>
        <p>leadfinder viser offentlige oplysninger fra Det Centrale Virksomhedsregister (CVR): navn, adresse, telefon, branche, størrelse og ledelse. For enkeltmandsvirksomheder og personer i ledelsen er det personoplysninger. Vi behandler dem på grundlag af legitim interesse (GDPR art. 6, stk. 1, litra f) for at gøre det muligt at kontakte virksomheder om erhvervsmæssige tilbud.</p>
        <h2>Reklamebeskyttelse</h2>
        <p>Virksomheder, der har reklamebeskyttelse i CVR, vises ikke i søgninger og eksporter.</p>
        <h2>Dine rettigheder</h2>
        <p>Du kan gøre indsigelse, bede om indsigt eller sletning ved at skrive til kontakt@leadfinder.dk. Ønsker du ikke at blive kontaktet, kan du også registrere reklamebeskyttelse på virk.dk.</p>
        <h2>Data i din browser</h2>
        <p>Ringelister, noter og ring-ikke-lister gemmes indtil videre kun lokalt i din browser og sendes ikke til os.</p>
      </article>
    </PublicShell>
  ),
});
