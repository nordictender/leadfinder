import { describe, expect, it } from "vitest";
import { normalizeCvrApi, parseCvrApiDate, formatPhone } from "@/lib/cvr/normalize";
import { checkCall } from "@/lib/compliance";
import { searchCompanies, EMPTY_FILTERS } from "@/lib/search";
import { extractCvrs, toCsv } from "@/lib/csv";
import { generateDemoCompanies, isValidCvr } from "@/lib/demo-data";
import { nextLead, newLead } from "@/lib/store";
import type { Company } from "@/lib/cvr/types";

const base: Company = normalizeCvrApi({
  vat: 12345674, name: "Test ApS", address: "Vej 1", zipcode: "8000", city: "Aarhus C", phone: "+4512345678",
  email: "a@b.dk", startdate: "01/02 - 2015", employees: "10-19", industrycode: 620100, industrydesc: "Computerprogrammering",
  companydesc: "Anpartsselskab", protected: false, owners: [{ name: "Anne" }],
});

describe("normalize", () => {
  it("maps cvrapi fields", () => {
    expect(base).toMatchObject({ cvr: "12345674", phone: "12 34 56 78", startDate: "2015-02-01", employeesMin: 10, status: "aktiv", people: ["Anne"] });
  });
  it("parses dates and phones", () => {
    expect(parseCvrApiDate("5/3 - 1999")).toBe("1999-03-05");
    expect(parseCvrApiDate(null)).toBeNull();
    expect(formatPhone(null)).toBeNull();
    expect(formatPhone("70 20 30 40")).toBe("70 20 30 40");
  });
  it("marks bankrupt and ended companies", () => {
    expect(normalizeCvrApi({ vat: 1, creditbankrupt: true }).status).toBe("konkurs");
    expect(normalizeCvrApi({ vat: 1, enddate: "01/01 - 2020" }).status).toBe("ophoert");
  });
});

describe("compliance", () => {
  it("blocks protected, ended, do-not-call and demo", () => {
    expect(checkCall(base, new Set()).allowed).toBe(true);
    expect(checkCall({ ...base, protected: true }, new Set()).blockers).toContain("Reklamebeskyttet i CVR");
    expect(checkCall(base, new Set([base.cvr])).allowed).toBe(false);
    expect(checkCall({ ...base, status: "ophoert" }, new Set()).allowed).toBe(false);
    expect(checkCall({ ...base, demo: true }, new Set()).allowed).toBe(false);
  });
  it("warns for sole proprietorships", () => {
    const r = checkCall({ ...base, form: "Enkeltmandsvirksomhed" }, new Set());
    expect(r.allowed).toBe(true);
    expect(r.warnings[0]).toMatch(/Robinson/);
  });
});

describe("search", () => {
  const all = generateDemoCompanies(300, 7);
  it("never returns protected companies", () => {
    const r = searchCompanies(all, { ...EMPTY_FILTERS, onlyActive: false, requirePhone: false });
    expect(r.rows.some((c) => c.protected)).toBe(false);
    expect(r.excludedProtected).toBeGreaterThan(0);
    expect(r.rows.length + r.excludedProtected).toBe(all.length);
  });
  it("filters by industry, region and size", () => {
    const r = searchCompanies(all, { ...EMPTY_FILTERS, industries: ["62"], regions: ["midtjylland"], employeeBands: ["10-19", "20-49"] });
    for (const c of r.rows) {
      expect(c.industryCode!.startsWith("62")).toBe(true);
      expect(Number(c.zip)).toBeGreaterThanOrEqual(7000);
      expect(c.employeesMin).toBeGreaterThanOrEqual(10);
      expect(c.phone).not.toBeNull();
    }
  });
});

describe("demo data", () => {
  it("uses CVR numbers that can never be real", () => {
    expect(isValidCvr("12345674")).toBe(true);
    expect(generateDemoCompanies(200).every((c) => !isValidCvr(c.cvr) && c.demo)).toBe(true);
  });
});

describe("csv", () => {
  it("extracts unique CVR numbers", () => {
    expect(extractCvrs("DK12345674; 12345674\n87654321, 123456789")).toEqual(["12345674", "87654321"]);
  });
  it("escapes and neutralises formulas", () => {
    const csv = toCsv([{ ...base, name: '=HYPERLINK("x")' }], { includeEmail: false });
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).not.toContain("a@b.dk");
  });
});

describe("call queue", () => {
  it("prioritises due follow-ups, then new leads", () => {
    const a = { ...newLead({ ...base, cvr: "1" }), outcome: "ingen_svar" as const, attempts: 1 };
    const b = newLead({ ...base, cvr: "2" });
    const c = { ...newLead({ ...base, cvr: "3" }), outcome: "ring_tilbage" as const, followUp: "2026-11-01" };
    const d = { ...newLead({ ...base, cvr: "4" }), outcome: "moede" as const };
    const now = new Date("2026-11-15T10:00:00Z");
    expect(nextLead([a, b, c, d], now)?.company.cvr).toBe("3");
    expect(nextLead([a, b, d], now)?.company.cvr).toBe("2");
    expect(nextLead([a, d], now)?.company.cvr).toBe("1");
    expect(nextLead([d], now)).toBeNull();
  });
});

import { buildEsQuery, bandsToEsCodes, esEmployees, normalizeEs } from "@/lib/cvr/es-query";

describe("CVR Elasticsearch", () => {
  it("always excludes protected companies and maps filters", () => {
    const q = buildEsQuery({ ...EMPTY_FILTERS, industries: ["62"], regions: ["fyn"], employeeBands: ["10-19"], text: "byg" }) as any;
    const f = q.query.filtered;
    expect(f.filter.bool.must_not[0].term["Vrvirksomhed.reklamebeskyttet"]).toBe(true);
    const json = JSON.stringify(f);
    expect(json).toContain('"prefix"');
    expect(json).toContain('"gte":5000');
    expect(json).toContain("ANTAL_10_19");
    expect(f.query.bool.must[0].match).toBeDefined();
  });
  it("maps employee bands and codes", () => {
    expect(bandsToEsCodes(["1-4"])).toEqual(["ANTAL_1_1", "ANTAL_2_4"]);
    expect(bandsToEsCodes(["100+"])).toContain("ANTAL_1000_999999");
    expect(esEmployees("ANTAL_10_19")).toBe("10-19");
    expect(esEmployees("ANTAL_1000_999999")).toBe("1000+");
  });
  it("normalizes a CVR document, skipping hidden and expired contacts", () => {
    const c = normalizeEs({
      Vrvirksomhed: {
        cvrNummer: 12345674,
        reklamebeskyttet: false,
        telefonNummer: [{ kontaktoplysning: "11111111", periode: { gyldigTil: "2020-01-01" } }, { kontaktoplysning: "22334455", periode: { gyldigTil: null } }],
        elektroniskPost: [{ kontaktoplysning: "skjult@x.dk", hemmelig: true }],
        deltagerRelation: [{ deltager: { navne: [{ navn: "Anne Holm", periode: { gyldigTil: null } }] }, organisationer: [{ hovedtype: "LEDELSESORGAN", medlemsData: [{ attributter: [{ type: "FUNKTION", vaerdier: [{ vaerdi: "DIREKTØR", periode: { gyldigTil: null } }] }] }] }] }],
        virksomhedMetadata: {
          nyesteNavn: { navn: "Holm ApS" },
          nyesteHovedbranche: { branchekode: "620100", branchetekst: "Computerprogrammering" },
          nyesteBeliggenhedsadresse: { vejnavn: "Vej", husnummerFra: 3, bogstavFra: "B", postnummer: 8000, postdistrikt: "Aarhus C" },
          nyesteVirksomhedsform: { kortBeskrivelse: "APS", langBeskrivelse: "Anpartsselskab" },
          nyesteMaanedsbeskaeftigelse: { intervalKodeAntalAnsatte: "ANTAL_5_9" },
          stiftelsesDato: "2010-04-01",
          sammensatStatus: "Aktiv",
        },
      },
    });
    expect(c).toMatchObject({ cvr: "12345674", phone: "22 33 44 55", email: null, address: "Vej 3B", employees: "5-9", employeesMin: 5, status: "aktiv", people: ["Anne Holm (direktør)"] });
  });
});

import { IcpSchema, segmentToFilters, catalogPrompt } from "@/lib/icp";

describe("customer matching", () => {
  it("accepts a valid suggestion and rejects unknown codes", () => {
    const seg = { name: "Byg", why: "x", pitch: "Hej", industries: ["41", "43"], regions: [], employeeBands: ["10-19"], forms: ["ApS"] };
    expect(IcpSchema.safeParse({ summary: "s", segments: [seg] }).success).toBe(true);
    expect(IcpSchema.safeParse({ summary: "s", segments: [{ ...seg, industries: ["99"] }] }).success).toBe(false);
  });
  it("turns a segment into search filters with protection still enforced", () => {
    const f = segmentToFilters({ name: "IT", why: "", pitch: "", industries: ["62"], regions: ["fyn"], employeeBands: [], forms: [] });
    expect(f).toMatchObject({ industries: ["62"], regions: ["fyn"], onlyActive: true, requirePhone: true });
    const r = searchCompanies(generateDemoCompanies(500, 3), f);
    expect(r.rows.every((c) => !c.protected && c.industryCode!.startsWith("62"))).toBe(true);
  });
  it("lists the catalog for the model", () => {
    expect(catalogPrompt()).toContain("62: IT og software");
  });
});
