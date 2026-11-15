import { INDUSTRY_GROUPS } from "./catalog";
import type { Company } from "./cvr/types";

/**
 * Fiktive testvirksomheder, så søgning og ringeliste kan afprøves før der er adgang til
 * hele CVR-registret. CVR-numrene fejler bevidst modulus-11-kontrollen, så de aldrig er rigtige.
 */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const WEIGHTS = [2, 7, 6, 5, 4, 3, 2, 1];
export function isValidCvr(cvr: string): boolean {
  if (!/^\d{8}$/.test(cvr)) return false;
  return [...cvr].reduce((s, d, i) => s + Number(d) * WEIGHTS[i]!, 0) % 11 === 0;
}

const FIRST = ["Nordlys", "Fjord", "Kystens", "Lindegaard", "Bøgely", "Havblik", "Granly", "Solsikke", "Stenbro", "Engvang", "Østervold", "Vestkyst", "Skovbryn", "Ålekær", "Klitgaard", "Møllevang", "Birkely", "Højager", "Tværvej", "Søndermark"];
const TRADE: Record<string, string[]> = {
  "41": ["Byg", "Entreprise", "Byggeservice"], "43": ["El", "VVS", "Tømrer", "Malerfirma", "Tag"], "45": ["Auto", "Bilcenter"],
  "46": ["Engros", "Import"], "47": ["Butik", "Shop", "Handel"], "49": ["Transport", "Vognmand", "Logistik"], "55": ["Hotel", "Kro"],
  "56": ["Café", "Bistro", "Pizzeria"], "62": ["Software", "IT", "Digital"], "68": ["Ejendomme", "Udlejning"], "69": ["Revision", "Bogføring", "Advokater"],
  "70": ["Consulting", "Rådgivning"], "71": ["Arkitekter", "Ingeniører"], "73": ["Reklame", "Kommunikation"], "81": ["Rengøring", "Facility"],
  "86": ["Klinik", "Fysioterapi", "Tandklinik"], "88": ["Omsorg", "Dagtilbud"], "93": ["Fitness", "Sport"], "96": ["Frisør", "Skønhed"], "10": ["Bageri", "Fødevarer"], "25": ["Maskinværksted", "Metal"],
};
const CITIES: [string, string][] = [["1150", "København K"], ["2100", "København Ø"], ["2300", "København S"], ["2605", "Brøndby"], ["2800", "Kongens Lyngby"], ["3000", "Helsingør"], ["3400", "Hillerød"], ["4000", "Roskilde"], ["4700", "Næstved"], ["5000", "Odense C"], ["5700", "Svendborg"], ["6000", "Kolding"], ["6700", "Esbjerg"], ["7100", "Vejle"], ["7400", "Herning"], ["8000", "Aarhus C"], ["8200", "Aarhus N"], ["8600", "Silkeborg"], ["8700", "Horsens"], ["8900", "Randers C"], ["9000", "Aalborg"], ["9800", "Hjørring"]];
const STREETS = ["Industrivej", "Hovedgaden", "Strandvejen", "Erhvervsparken", "Østergade", "Banegårdspladsen", "Havnevej", "Teknikervej", "Skolevej", "Fabriksvej"];
const NAMES = ["Anne Holm", "Mikkel Bech", "Sofie Kragh", "Jens Lund", "Mette Bak", "Rasmus Juhl", "Louise Friis", "Henrik Dahl", "Camilla Vang", "Peter Krog"];
const BANDS = ["0", "1-4", "1-4", "2-4", "5-9", "5-9", "10-19", "10-19", "20-49", "50-99", "100-199"];

function fakeCvr(r: () => number): string {
  for (;;) {
    const cvr = String(10000000 + Math.floor(r() * 89999999));
    if (!isValidCvr(cvr)) return cvr;
  }
}

function pick<T>(r: () => number, list: readonly T[]): T {
  return list[Math.floor(r() * list.length)]!;
}

export function generateDemoCompanies(count = 600, seed = 42): Company[] {
  const r = rng(seed);
  const out: Company[] = [];
  for (let i = 0; i < count; i++) {
    const group = pick(r, INDUSTRY_GROUPS);
    const trade = pick(r, TRADE[group.code] ?? ["Service"]);
    const [zip, city] = pick(r, CITIES);
    const sole = r() < 0.18;
    const form = sole ? "Enkeltmandsvirksomhed" : r() < 0.75 ? "Anpartsselskab (ApS)" : "Aktieselskab (A/S)";
    const suffix = sole ? "" : form.includes("ApS") ? " ApS" : " A/S";
    const employees = sole ? pick(r, ["0", "1-4"]) : pick(r, BANDS);
    const year = 1975 + Math.floor(r() * 51);
    const startDate = `${year}-${String(1 + Math.floor(r() * 12)).padStart(2, "0")}-${String(1 + Math.floor(r() * 28)).padStart(2, "0")}`;
    const name = `${pick(r, FIRST)} ${trade}${suffix}`;
    const slug = name.toLowerCase().replace(/[^a-zæøå]+/g, "").replace(/æ/g, "ae").replace(/ø/g, "oe").replace(/å/g, "aa");
    const statusRoll = r();
    out.push({
      cvr: fakeCvr(r),
      name,
      address: `${pick(r, STREETS)} ${1 + Math.floor(r() * 120)}`,
      zip,
      city,
      phone: r() < 0.82 ? `${20 + Math.floor(r() * 70)} ${String(Math.floor(r() * 100)).padStart(2, "0")} ${String(Math.floor(r() * 100)).padStart(2, "0")} ${String(Math.floor(r() * 100)).padStart(2, "0")}` : null,
      email: r() < 0.6 ? `kontakt@${slug}.example` : null,
      industryCode: `${group.code}${String(Math.floor(r() * 9999)).padStart(4, "0")}`,
      industryText: group.label,
      form,
      employees,
      employeesMin: Number(/\d+/.exec(employees)![0]),
      startDate,
      status: statusRoll < 0.9 ? "aktiv" : statusRoll < 0.97 ? "ophoert" : "konkurs",
      protected: r() < 0.14,
      people: Array.from({ length: 1 + Math.floor(r() * 2) }, () => pick(r, NAMES)),
      demo: true,
      fetchedAt: "2026-11-15T00:00:00.000Z",
    });
  }
  return out;
}

export const DEMO_COMPANIES = generateDemoCompanies(4000);
