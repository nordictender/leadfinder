import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { IcpSchema, catalogPrompt, type Icp } from "./icp";

const SYSTEM = `Du hjælper danske B2B-sælgere med at finde ud af, hvilke virksomheder de skal ringe til.
Ud fra sælgerens beskrivelse af sin egen virksomhed foreslår du 2–4 konkrete kundesegmenter, som kan findes i CVR-registret.
Brug kun koder fra kataloget nedenfor. Vælg få, præcise brancher pr. segment frem for mange brede.
Vælg virksomhedsstørrelse ud fra hvem der realistisk har budget og behov. Lad landsdele være tomme, medmindre sælgeren nævner et område.
Undlad enkeltmandsvirksomheder, medmindre de er den oplagte målgruppe.
Skriv på dansk.

${catalogPrompt()}`;

export class IcpError extends Error {}

export async function suggestSegments(description: string): Promise<Icp> {
  if (!process.env["ANTHROPIC_API_KEY"]) throw new IcpError("AI-matchning er ikke slået til endnu (mangler ANTHROPIC_API_KEY).");
  const client = new Anthropic();
  try {
    const res = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(IcpSchema) },
      system: SYSTEM,
      messages: [{ role: "user", content: `Min virksomhed:\n\n${description}` }],
    });
    if (res.stop_reason === "refusal") throw new IcpError("Beskrivelsen kunne ikke behandles. Prøv at omformulere den.");
    if (!res.parsed_output) throw new IcpError("Svaret kunne ikke læses. Prøv igen.");
    return res.parsed_output;
  } catch (e) {
    if (e instanceof IcpError) throw e;
    if (e instanceof Anthropic.RateLimitError) throw new IcpError("Der er travlt lige nu. Prøv igen om et øjeblik.");
    if (e instanceof Anthropic.AuthenticationError) throw new IcpError("AI-nøglen er ugyldig.");
    if (e instanceof Anthropic.APIError) {
      console.error("Claude API", e.status, e.message);
      throw new IcpError("AI-tjenesten svarede ikke. Prøv igen.");
    }
    throw e;
  }
}
