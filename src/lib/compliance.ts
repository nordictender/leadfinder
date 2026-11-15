import type { Company } from "./cvr/types";

export type CallCheck = {
  /** false = må ikke ringes op. */
  allowed: boolean;
  blockers: string[];
  warnings: string[];
};

export function isSoleProprietorship(c: Pick<Company, "form">): boolean {
  return !!c.form && /enkeltmand|personligt ejet/i.test(c.form);
}

/**
 * Afgør om en virksomhed må ringes op i salgsøjemed.
 * - Reklamebeskyttede virksomheder må ikke kontaktes på baggrund af CVR-data (CVR-lovens § 19).
 * - Ophørte virksomheder og numre på kundens egen "ring ikke"-liste blokeres.
 * - Enkeltmandsvirksomheder skal tjekkes mod Robinsonlisten (Markedsføringsloven § 10).
 */
export function checkCall(c: Company, doNotCall: ReadonlySet<string>): CallCheck {
  const blockers: string[] = [];
  const warnings: string[] = [];
  if (c.protected) blockers.push("Reklamebeskyttet i CVR");
  if (c.status === "ophoert" || c.status === "konkurs") blockers.push(c.status === "konkurs" ? "Under konkurs" : "Ophørt");
  if (doNotCall.has(c.cvr)) blockers.push("På jeres ring-ikke-liste");
  if (!c.phone) blockers.push("Intet telefonnummer");
  if (c.demo) blockers.push("Testdata – fiktivt nummer");
  if (isSoleProprietorship(c)) warnings.push("Enkeltmandsvirksomhed: tjek Robinsonlisten før opkald");
  return { allowed: blockers.length === 0, blockers, warnings };
}
