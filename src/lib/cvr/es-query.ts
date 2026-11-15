import { EMPLOYEE_BANDS, REGIONS } from "../catalog";
import type { SearchFilters } from "../search";
import { formatPhone, employeesMin } from "./normalize";
import type { Company, CompanyStatus } from "./types";

/**
 * Oversætter leadfinders filtre til en forespørgsel mod Erhvervsstyrelsens CVR system-til-system
 * (Elasticsearch, distribution.virk.dk/cvr-permanent/virksomhed/_search).
 *
 * Feltnavnene følger Erhvervsstyrelsens dokumenterede datamodel, men skal verificeres mod et
 * rigtigt svar, når adgangen er på plads. De er samlet her, så kun denne fil skal rettes.
 */
const P = "Vrvirksomhed";
const M = `${P}.virksomhedMetadata`;
export const ES_FIELDS = {
  name: `${M}.nyesteNavn.navn`,
  industry: `${M}.nyesteHovedbranche.branchekode`,
  zip: `${M}.nyesteBeliggenhedsadresse.postnummer`,
  status: `${M}.sammensatStatus`,
  form: `${M}.nyesteVirksomhedsform.kortBeskrivelse`,
  employees: `${M}.nyesteMaanedsbeskaeftigelse.intervalKodeAntalAnsatte`,
  founded: `${M}.stiftelsesDato`,
  phone: `${P}.telefonNummer.kontaktoplysning`,
  email: `${P}.elektroniskPost.kontaktoplysning`,
  protected: `${P}.reklamebeskyttet`,
  cvr: `${P}.cvrNummer`,
} as const;

/** leadfinder-form → CVR's korte beskrivelse. */
const FORM_CODES: Record<string, string[]> = {
  ApS: ["APS"],
  "A/S": ["A/S"],
  IVS: ["IVS"],
  Enkeltmandsvirksomhed: ["ENK"],
  "I/S": ["I/S"],
};

/** CVR bruger intervalkoder som ANTAL_10_19. */
export function bandsToEsCodes(ids: string[]): string[] {
  const all = ["ANTAL_0_0", "ANTAL_1_1", "ANTAL_2_4", "ANTAL_5_9", "ANTAL_10_19", "ANTAL_20_49", "ANTAL_50_99", "ANTAL_100_199", "ANTAL_200_499", "ANTAL_500_999", "ANTAL_1000_999999"];
  const bands = EMPLOYEE_BANDS.filter((b) => ids.includes(b.id));
  return all.filter((code) => {
    const [, lo] = code.split("_");
    const n = Number(lo);
    return bands.some((b) => n >= b.min && n <= b.max);
  });
}

type Q = Record<string, unknown>;

export function buildEsQuery(f: SearchFilters, from = 0, size = 50): Q {
  const must: Q[] = [];
  const filter: Q[] = [];
  const mustNot: Q[] = [{ term: { [ES_FIELDS.protected]: true } }];

  const text = f.text.trim();
  if (/^\d{8}$/.test(text)) filter.push({ term: { [ES_FIELDS.cvr]: Number(text) } });
  else if (text) must.push({ match: { [ES_FIELDS.name]: { query: text, operator: "and" } } });

  if (f.industries.length) filter.push({ bool: { should: f.industries.map((code) => ({ prefix: { [ES_FIELDS.industry]: code } })) } });

  const zipRanges: [number, number][] = REGIONS.filter((r) => f.regions.includes(r.id)).flatMap((r) => r.ranges);
  if (zipRanges.length) filter.push({ bool: { should: zipRanges.map(([gte, lte]) => ({ range: { [ES_FIELDS.zip]: { gte, lte } } })) } });
  if (f.zipFrom || f.zipTo) {
    const range: Q = {};
    if (f.zipFrom) range["gte"] = Number(f.zipFrom);
    if (f.zipTo) range["lte"] = Number(f.zipTo);
    filter.push({ range: { [ES_FIELDS.zip]: range } });
  }

  if (f.employeeBands.length) filter.push({ terms: { [ES_FIELDS.employees]: bandsToEsCodes(f.employeeBands) } });

  const forms = f.forms.flatMap((x) => FORM_CODES[x] ?? []);
  if (forms.length) filter.push({ terms: { [ES_FIELDS.form]: forms } });

  if (f.onlyActive) filter.push({ terms: { [ES_FIELDS.status]: ["Aktiv", "NORMAL"] } });
  if (f.requirePhone) filter.push({ exists: { field: ES_FIELDS.phone } });
  if (f.requireEmail) filter.push({ exists: { field: ES_FIELDS.email } });
  if (f.foundedAfter) filter.push({ range: { [ES_FIELDS.founded]: { gte: f.foundedAfter } } });

  return {
    from,
    size,
    _source: [`${P}.cvrNummer`, `${P}.reklamebeskyttet`, `${P}.telefonNummer`, `${P}.elektroniskPost`, `${P}.deltagerRelation`, M],
    // CVR kører Elasticsearch 1.7: filtre skal ligge i en "filtered"-query (bool.filter findes først fra 2.x).
    query: {
      filtered: {
        query: must.length ? { bool: { must } } : { match_all: {} },
        filter: { bool: { must: filter.length ? filter : [{ match_all: {} }], must_not: mustNot } },
      },
    },
    sort: [{ [ES_FIELDS.employees]: { order: "desc", missing: "_last" } }],
  };
}

// ---- Normalisering af svar ----

type Period = { periode?: { gyldigTil?: string | null } };
type Contact = Period & { kontaktoplysning?: string; hemmelig?: boolean };
export type EsSource = {
  Vrvirksomhed?: {
    cvrNummer?: number;
    reklamebeskyttet?: boolean;
    telefonNummer?: Contact[];
    elektroniskPost?: Contact[];
    deltagerRelation?: {
      deltager?: { navne?: (Period & { navn?: string })[] } | null;
      organisationer?: { hovedtype?: string; medlemsData?: { attributter?: { type?: string; vaerdier?: (Period & { vaerdi?: string })[] }[] }[] }[];
    }[];
    virksomhedMetadata?: {
      nyesteNavn?: { navn?: string };
      nyesteHovedbranche?: { branchekode?: string; branchetekst?: string };
      nyesteBeliggenhedsadresse?: { vejnavn?: string; husnummerFra?: number; bogstavFra?: string; postnummer?: number; postdistrikt?: string };
      nyesteVirksomhedsform?: { kortBeskrivelse?: string; langBeskrivelse?: string };
      nyesteMaanedsbeskaeftigelse?: { intervalKodeAntalAnsatte?: string } | null;
      nyesteAarsbeskaeftigelse?: { intervalKodeAntalAnsatte?: string } | null;
      stiftelsesDato?: string;
      sammensatStatus?: string;
    };
  };
};

const current = <T extends Period>(xs: T[] | undefined) => (xs ?? []).filter((x) => !x.periode?.gyldigTil);

/** ANTAL_10_19 → "10-19", ANTAL_1000_999999 → "1000+". */
export function esEmployees(code: string | undefined): string | null {
  const m = /ANTAL_(\d+)_(\d+)/.exec(code ?? "");
  if (!m) return null;
  if (m[2] === "999999") return `${m[1]}+`;
  return m[1] === m[2] ? m[1]! : `${m[1]}-${m[2]}`;
}

function esStatus(s: string | undefined): CompanyStatus {
  if (!s) return "ukendt";
  if (/konkurs/i.test(s)) return "konkurs";
  if (/aktiv|normal/i.test(s)) return "aktiv";
  return "ophoert";
}

/** Direktion og bestyrelse: deltagere i et LEDELSESORGAN med en gyldig FUNKTION. */
function leaders(rel: NonNullable<EsSource["Vrvirksomhed"]>["deltagerRelation"]): string[] {
  const out: string[] = [];
  for (const r of rel ?? []) {
    const name = current(r.deltager?.navne)[0]?.navn ?? r.deltager?.navne?.at(-1)?.navn;
    if (!name) continue;
    for (const org of r.organisationer ?? []) {
      if (org.hovedtype !== "LEDELSESORGAN") continue;
      const role = org.medlemsData?.flatMap((m) => m.attributter ?? []).find((a) => a.type === "FUNKTION");
      const value = current(role?.vaerdier)[0]?.vaerdi;
      if (value) out.push(`${name} (${value.toLowerCase()})`);
    }
  }
  return [...new Set(out)];
}

export function normalizeEs(src: EsSource, now = new Date()): Company {
  const v = src.Vrvirksomhed ?? {};
  const m = v.virksomhedMetadata ?? {};
  const a = m.nyesteBeliggenhedsadresse ?? {};
  const employees = esEmployees(m.nyesteMaanedsbeskaeftigelse?.intervalKodeAntalAnsatte ?? m.nyesteAarsbeskaeftigelse?.intervalKodeAntalAnsatte);
  const phone = current(v.telefonNummer).find((c) => !c.hemmelig)?.kontaktoplysning;
  return {
    cvr: String(v.cvrNummer ?? "").padStart(8, "0"),
    name: m.nyesteNavn?.navn ?? "Ukendt navn",
    address: [a.vejnavn, [a.husnummerFra, a.bogstavFra].filter(Boolean).join("")].filter(Boolean).join(" "),
    zip: a.postnummer ? String(a.postnummer) : "",
    city: a.postdistrikt ?? "",
    phone: formatPhone(phone),
    email: current(v.elektroniskPost).find((c) => !c.hemmelig)?.kontaktoplysning ?? null,
    industryCode: m.nyesteHovedbranche?.branchekode ?? null,
    industryText: m.nyesteHovedbranche?.branchetekst ?? null,
    form: m.nyesteVirksomhedsform?.langBeskrivelse ?? m.nyesteVirksomhedsform?.kortBeskrivelse ?? null,
    employees,
    employeesMin: employeesMin(employees),
    startDate: m.stiftelsesDato ?? null,
    status: esStatus(m.sammensatStatus),
    protected: v.reklamebeskyttet === true,
    people: leaders(v.deltagerRelation),
    demo: false,
    fetchedAt: now.toISOString(),
  };
}
