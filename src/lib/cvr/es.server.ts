import type { SearchFilters } from "../search";
import { buildEsQuery, normalizeEs, type EsSource } from "./es-query";
import type { Company } from "./types";

const ENDPOINT = "http://distribution.virk.dk/cvr-permanent/virksomhed/_search";

export function esConfigured(): boolean {
  return !!(process.env["CVR_ES_USER"] && process.env["CVR_ES_PASSWORD"]);
}

export async function esSearch(filters: SearchFilters, from: number, size: number): Promise<{ total: number; rows: Company[] }> {
  const auth = btoa(`${process.env["CVR_ES_USER"]}:${process.env["CVR_ES_PASSWORD"]}`);
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify(buildEsQuery(filters, from, size)),
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`CVR svarede ${res.status}`);
  const body = (await res.json()) as { hits?: { total?: number | { value: number }; hits?: { _source: EsSource }[] } };
  const t = body.hits?.total;
  const rows = (body.hits?.hits ?? []).map((h) => normalizeEs(h._source)).filter((c) => !c.protected); // dobbelt sikring
  return { total: typeof t === "number" ? t : (t?.value ?? rows.length), rows };
}
