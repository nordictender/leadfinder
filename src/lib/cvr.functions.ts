import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Company } from "./cvr/types";

export type LookupResult = { ok: true; company: Company } | { ok: false; code: string; message: string };

function guessKind(q: string): "vat" | "phone" | "search" {
  const digits = q.replace(/\s|-/g, "");
  if (/^\d{8}$/.test(digits)) return "search"; // 8 cifre kan være både CVR og telefon — lad cvrapi.dk afgøre
  if (/^\+?\d{8,11}$/.test(digits)) return "phone";
  return "search";
}

async function lookupOne(query: string): Promise<LookupResult> {
  const { cvrApiLookup, CvrApiError } = await import("./cvr/cvrapi.server");
  try {
    return { ok: true, company: await cvrApiLookup(guessKind(query), query.trim()) };
  } catch (e) {
    if (e instanceof CvrApiError) return { ok: false, code: e.code, message: e.message };
    console.error(e);
    return { ok: false, code: "NETWORK", message: "Kunne ikke kontakte cvrapi.dk." };
  }
}

export const lookupCompany = createServerFn({ method: "POST" })
  .inputValidator(z.object({ query: z.string().trim().min(2).max(120) }))
  .handler(({ data }) => lookupOne(data.query));

/** Beriger en importeret liste af CVR-numre. Begrænset pr. kald for at skåne kvoten. */
export const enrichCvrs = createServerFn({ method: "POST" })
  .inputValidator(z.object({ cvrs: z.array(z.string().regex(/^\d{8}$/)).min(1).max(25) }))
  .handler(async ({ data }) => {
    const { cvrApiLookup, CvrApiError } = await import("./cvr/cvrapi.server");
    const results: { cvr: string; result: LookupResult }[] = [];
    for (const cvr of data.cvrs) {
      try {
        results.push({ cvr, result: { ok: true, company: await cvrApiLookup("vat", cvr) } });
      } catch (e) {
        const result: LookupResult =
          e instanceof CvrApiError
            ? { ok: false, code: e.code, message: e.message }
            : { ok: false, code: "NETWORK", message: "Kunne ikke kontakte cvrapi.dk." };
        results.push({ cvr, result });
        if (result.code === "QUOTA_EXCEEDED") break;
      }
    }
    return results;
  });

const filtersSchema = z.object({
  text: z.string().max(120),
  industries: z.array(z.string().regex(/^\d{2,6}$/)).max(30),
  regions: z.array(z.string().max(20)).max(10),
  zipFrom: z.string().regex(/^\d{0,4}$/),
  zipTo: z.string().regex(/^\d{0,4}$/),
  employeeBands: z.array(z.string().max(10)).max(10),
  forms: z.array(z.string().max(40)).max(10),
  onlyActive: z.boolean(),
  requirePhone: z.boolean(),
  requireEmail: z.boolean(),
  foundedAfter: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/),
});

export type LiveSearch = { source: "demo" } | { source: "cvr"; total: number; rows: Company[] } | { source: "error"; message: string };

/** Søger i hele CVR-registret, når CVR_ES_USER/CVR_ES_PASSWORD er sat; ellers bruger klienten testdata. */
export const searchLeads = createServerFn({ method: "POST" })
  .inputValidator(z.object({ filters: filtersSchema, from: z.number().int().min(0).max(9950), size: z.number().int().min(1).max(200) }))
  .handler(async ({ data }): Promise<LiveSearch> => {
    const { esConfigured, esSearch } = await import("./cvr/es.server");
    if (!esConfigured()) return { source: "demo" };
    try {
      return { source: "cvr", ...(await esSearch(data.filters, data.from, data.size)) };
    } catch (e) {
      console.error(e);
      return { source: "error", message: "CVR-registret svarede ikke. Prøv igen om lidt." };
    }
  });

export type MatchResult = { ok: true; icp: import("./icp").Icp } | { ok: false; message: string };

/** Foreslår kundesegmenter ud fra en beskrivelse af brugerens egen virksomhed. */
export const matchCustomers = createServerFn({ method: "POST" })
  .inputValidator(z.object({ description: z.string().trim().min(20).max(4000) }))
  .handler(async ({ data }): Promise<MatchResult> => {
    const { suggestSegments, IcpError } = await import("./icp.server");
    try {
      return { ok: true, icp: await suggestSegments(data.description) };
    } catch (e) {
      if (e instanceof IcpError) return { ok: false, message: e.message };
      console.error(e);
      return { ok: false, message: "Noget gik galt. Prøv igen." };
    }
  });
