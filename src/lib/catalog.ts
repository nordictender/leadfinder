/** Udvalgte DB07-branchekoder grupperet til filtre. Koden matcher på præfiks, så "62" dækker alle IT-koder. */
export const INDUSTRY_GROUPS: { code: string; label: string }[] = [
  { code: "41", label: "Byggeri – opførelse af bygninger" },
  { code: "43", label: "Håndværk – el, VVS, tømrer, maler" },
  { code: "45", label: "Bilhandel og autoværksteder" },
  { code: "46", label: "Engroshandel" },
  { code: "47", label: "Detailhandel" },
  { code: "49", label: "Transport og vognmænd" },
  { code: "55", label: "Hoteller og overnatning" },
  { code: "56", label: "Restauranter og caféer" },
  { code: "62", label: "IT og software" },
  { code: "68", label: "Ejendomme og udlejning" },
  { code: "69", label: "Revision, bogføring og advokater" },
  { code: "70", label: "Virksomhedsrådgivning" },
  { code: "71", label: "Arkitekter og ingeniører" },
  { code: "73", label: "Reklame og markedsanalyse" },
  { code: "81", label: "Rengøring og ejendomsservice" },
  { code: "86", label: "Sundhed – læger, tandlæger, fysioterapi" },
  { code: "88", label: "Social- og omsorgsinstitutioner" },
  { code: "93", label: "Sport, fitness og fritid" },
  { code: "96", label: "Frisører, skønhed og personlig pleje" },
  { code: "10", label: "Fødevareproduktion" },
  { code: "25", label: "Metalvarer og maskinværksteder" },
];

export const REGIONS: { id: string; label: string; ranges: [number, number][] }[] = [
  { id: "hovedstaden", label: "Hovedstaden", ranges: [[1000, 3699], [3700, 3799]] },
  { id: "sjaelland", label: "Sjælland og øerne", ranges: [[4000, 4999]] },
  { id: "fyn", label: "Fyn", ranges: [[5000, 5999]] },
  { id: "syddanmark", label: "Sønderjylland og Sydvestjylland", ranges: [[6000, 6999]] },
  { id: "midtjylland", label: "Midtjylland", ranges: [[7000, 8999]] },
  { id: "nordjylland", label: "Nordjylland", ranges: [[9000, 9999]] },
];

export const EMPLOYEE_BANDS: { id: string; label: string; min: number; max: number }[] = [
  { id: "0", label: "0 ansatte", min: 0, max: 0 },
  { id: "1-4", label: "1–4", min: 1, max: 4 },
  { id: "5-9", label: "5–9", min: 5, max: 9 },
  { id: "10-19", label: "10–19", min: 10, max: 19 },
  { id: "20-49", label: "20–49", min: 20, max: 49 },
  { id: "50-99", label: "50–99", min: 50, max: 99 },
  { id: "100+", label: "100+", min: 100, max: Number.POSITIVE_INFINITY },
];

export const FORMS = ["ApS", "A/S", "IVS", "Enkeltmandsvirksomhed", "I/S", "Andelsselskab", "Forening"];

export function industryLabel(code: string | null): string | null {
  if (!code) return null;
  return INDUSTRY_GROUPS.find((g) => code.startsWith(g.code))?.label ?? null;
}

export function regionForZip(zip: string): string | null {
  const n = Number(zip);
  if (!Number.isFinite(n)) return null;
  return REGIONS.find((r) => r.ranges.some(([a, b]) => n >= a && n <= b))?.id ?? null;
}
