import type { Company, CompanyStatus } from "./types";

/** Raw cvrapi.dk response (only the fields we use). */
export type CvrApiRaw = {
  vat?: number | string;
  name?: string;
  address?: string;
  zipcode?: string | number;
  city?: string;
  protected?: boolean;
  phone?: string | number | null;
  email?: string | null;
  startdate?: string | null;
  enddate?: string | null;
  employees?: string | number | null;
  industrycode?: number | string | null;
  industrydesc?: string | null;
  companycode?: number | null;
  companydesc?: string | null;
  creditbankrupt?: boolean;
  creditstatus?: number | null;
  owners?: { name?: string }[] | null;
  error?: string;
};

/** "01/02 - 2015" → "2015-02-01". Accepts ISO too. */
export function parseCvrApiDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dk = /^(\d{1,2})\/(\d{1,2})\s*-\s*(\d{4})$/.exec(value.trim());
  if (!dk) return null;
  return `${dk[3]}-${dk[2]!.padStart(2, "0")}-${dk[1]!.padStart(2, "0")}`;
}

/** "10-19" → 10, "5" → 5, "1000+" → 1000. */
export function employeesMin(value: string | null): number | null {
  if (!value) return null;
  const m = /(\d+)/.exec(value);
  return m ? Number(m[1]) : null;
}

export function formatPhone(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const digits = String(value).replace(/\D/g, "").replace(/^45(?=\d{8}$)/, "");
  if (digits.length !== 8) return digits.length ? String(value) : null;
  return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

export function normalizeCvrApi(raw: CvrApiRaw, now = new Date()): Company {
  let status: CompanyStatus = "aktiv";
  if (raw.creditbankrupt) status = "konkurs";
  else if (raw.enddate) status = "ophoert";
  const employees = raw.employees === null || raw.employees === undefined || raw.employees === "" ? null : String(raw.employees);
  return {
    cvr: String(raw.vat ?? "").padStart(8, "0"),
    name: raw.name ?? "Ukendt navn",
    address: raw.address ?? "",
    zip: raw.zipcode === undefined ? "" : String(raw.zipcode),
    city: raw.city ?? "",
    phone: formatPhone(raw.phone),
    email: raw.email || null,
    industryCode: raw.industrycode ? String(raw.industrycode) : null,
    industryText: raw.industrydesc ?? null,
    form: raw.companydesc ?? null,
    employees,
    employeesMin: employeesMin(employees),
    startDate: parseCvrApiDate(raw.startdate),
    status,
    protected: raw.protected === true,
    people: (raw.owners ?? []).map((o) => o.name ?? "").filter(Boolean),
    demo: false,
    fetchedAt: now.toISOString(),
  };
}
