import { normalizeCvrApi, type CvrApiRaw } from "./normalize";
import type { Company } from "./types";

// cvrapi.dk requires every request to identify the caller with a descriptive User-Agent.
const USER_AGENT = "leadfinder.dk - kontakt@leadfinder.dk";

export type LookupKind = "search" | "vat" | "name" | "phone";

export class CvrApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

const MESSAGES: Record<string, string> = {
  NOT_FOUND: "Ingen virksomhed fundet.",
  QUOTA_EXCEEDED: "Dagens kvote hos cvrapi.dk er brugt. Prøv igen i morgen eller tilføj en API-nøgle.",
  INVALID_VAT: "Ugyldigt CVR-nummer.",
  BANNED: "cvrapi.dk har blokeret forespørgslen.",
};

export async function cvrApiLookup(kind: LookupKind, query: string): Promise<Company> {
  const url = new URL("https://cvrapi.dk/api");
  url.searchParams.set(kind, query);
  url.searchParams.set("country", "dk");
  const token = process.env["CVRAPI_TOKEN"];
  if (token) url.searchParams.set("token", token);

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
  });
  let body: CvrApiRaw;
  try {
    body = (await res.json()) as CvrApiRaw;
  } catch {
    throw new CvrApiError("BAD_RESPONSE", `cvrapi.dk svarede ${res.status}.`);
  }
  if (body.error) throw new CvrApiError(body.error, MESSAGES[body.error] ?? `cvrapi.dk: ${body.error}`);
  if (!res.ok) throw new CvrApiError("HTTP_" + res.status, `cvrapi.dk svarede ${res.status}.`);
  return normalizeCvrApi(body);
}
