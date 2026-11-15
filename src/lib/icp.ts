import { z } from "zod";
import { EMPLOYEE_BANDS, FORMS, INDUSTRY_GROUPS, REGIONS } from "./catalog";
import { EMPTY_FILTERS, type SearchFilters } from "./search";

/** Et kundesegment foreslået ud fra en beskrivelse af sælgerens virksomhed. */
const industryCodes = INDUSTRY_GROUPS.map((g) => g.code) as [string, ...string[]];
const regionIds = REGIONS.map((r) => r.id) as [string, ...string[]];
const bandIds = EMPLOYEE_BANDS.map((b) => b.id) as [string, ...string[]];
const forms = FORMS as [string, ...string[]];

export const SegmentSchema = z.object({
  name: z.string().describe("Kort navn på segmentet, fx 'Mellemstore håndværksvirksomheder'"),
  why: z.string().describe("1–2 sætninger: hvorfor de har brug for sælgerens ydelse"),
  pitch: z.string().describe("Åbningsreplik til telefonen, 1–2 sætninger, i du-form på dansk"),
  industries: z.array(z.enum(industryCodes)).describe("Branchekoder (præfikser) fra listen"),
  regions: z.array(z.enum(regionIds)).describe("Tom liste = hele landet"),
  employeeBands: z.array(z.enum(bandIds)),
  forms: z.array(z.enum(forms)).describe("Tom liste = alle virksomhedsformer"),
});

export const IcpSchema = z.object({
  summary: z.string().describe("Én sætning om hvad sælgeren sælger og til hvem"),
  segments: z.array(SegmentSchema).describe("2–4 segmenter, det mest lovende først"),
});

export type Segment = z.infer<typeof SegmentSchema>;
export type Icp = z.infer<typeof IcpSchema>;

export function segmentToFilters(s: Segment): SearchFilters {
  return { ...EMPTY_FILTERS, industries: s.industries, regions: s.regions, employeeBands: s.employeeBands, forms: s.forms };
}

export function catalogPrompt(): string {
  return [
    "Branchegrupper (DB07-præfiks: navn):",
    ...INDUSTRY_GROUPS.map((g) => `- ${g.code}: ${g.label}`),
    "Landsdele (id: navn):",
    ...REGIONS.map((r) => `- ${r.id}: ${r.label}`),
    `Ansatte-intervaller: ${EMPLOYEE_BANDS.map((b) => b.id).join(", ")}`,
    `Virksomhedsformer: ${FORMS.join(", ")}`,
  ].join("\n");
}
