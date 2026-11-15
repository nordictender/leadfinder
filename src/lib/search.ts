import { EMPLOYEE_BANDS, regionForZip } from "./catalog";
import type { Company } from "./cvr/types";

export type SearchFilters = {
  text: string;
  industries: string[];
  regions: string[];
  zipFrom: string;
  zipTo: string;
  employeeBands: string[];
  forms: string[];
  onlyActive: boolean;
  requirePhone: boolean;
  requireEmail: boolean;
  foundedAfter: string;
  /** Reklamebeskyttede er altid udeladt; kan ikke slås fra. */
};

export const EMPTY_FILTERS: SearchFilters = {
  text: "",
  industries: [],
  regions: [],
  zipFrom: "",
  zipTo: "",
  employeeBands: [],
  forms: [],
  onlyActive: true,
  requirePhone: true,
  requireEmail: false,
  foundedAfter: "",
};

export type SearchResult = { rows: Company[]; excludedProtected: number };

export function searchCompanies(all: readonly Company[], f: SearchFilters): SearchResult {
  const text = f.text.trim().toLowerCase();
  const bands = EMPLOYEE_BANDS.filter((b) => f.employeeBands.includes(b.id));
  const zipFrom = f.zipFrom ? Number(f.zipFrom) : null;
  const zipTo = f.zipTo ? Number(f.zipTo) : null;
  let excludedProtected = 0;
  const rows = all.filter((c) => {
    if (text && !`${c.name} ${c.cvr} ${c.city} ${c.industryText ?? ""}`.toLowerCase().includes(text)) return false;
    if (f.industries.length && !f.industries.some((code) => c.industryCode?.startsWith(code))) return false;
    if (f.regions.length) {
      const r = regionForZip(c.zip);
      if (!r || !f.regions.includes(r)) return false;
    }
    const zip = Number(c.zip);
    if (zipFrom !== null && !(zip >= zipFrom)) return false;
    if (zipTo !== null && !(zip <= zipTo)) return false;
    if (bands.length) {
      if (c.employeesMin === null) return false;
      const n = c.employeesMin;
      if (!bands.some((b) => n >= b.min && n <= b.max)) return false;
    }
    if (f.forms.length && !f.forms.some((form) => c.form?.toLowerCase().includes(form.toLowerCase()))) return false;
    if (f.onlyActive && c.status !== "aktiv") return false;
    if (f.requirePhone && !c.phone) return false;
    if (f.requireEmail && !c.email) return false;
    if (f.foundedAfter && (!c.startDate || c.startDate < f.foundedAfter)) return false;
    if (c.protected) {
      excludedProtected++;
      return false;
    }
    return true;
  });
  return { rows, excludedProtected };
}
