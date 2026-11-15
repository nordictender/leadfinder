import type { Company } from "./cvr/types";

function cell(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? "" : String(v);
  // Semikolon er standard i dansk Excel. Neutraliser formler (CSV-injection).
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[";\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export type ExportRow = Company & { outcome?: string; note?: string; followUp?: string | null };

export function toCsv(rows: readonly ExportRow[], { includeEmail }: { includeEmail: boolean }): string {
  const head = ["CVR", "Navn", "Adresse", "Postnr", "By", "Telefon", ...(includeEmail ? ["Email"] : []), "Branchekode", "Branche", "Virksomhedsform", "Ansatte", "Stiftet", "Ledelse/ejere", "Udfald", "Note", "Opfølgning"];
  const lines = rows.map((r) =>
    [r.cvr, r.name, r.address, r.zip, r.city, r.phone, ...(includeEmail ? [r.email] : []), r.industryCode, r.industryText, r.form, r.employees, r.startDate, r.people.join(", "), r.outcome, r.note, r.followUp]
      .map(cell)
      .join(";"),
  );
  return "﻿" + [head.join(";"), ...lines].join("\r\n");
}

/** Finder alle 8-cifrede CVR-numre i indsat tekst eller en CSV-fil. Ignorerer dubletter. */
export function extractCvrs(text: string): string[] {
  const found = text.match(/(?<!\d)(?:DK[-\s]?)?(\d{8})(?!\d)/gi) ?? [];
  return [...new Set(found.map((m) => m.replace(/\D/g, "")))];
}

export function downloadText(filename: string, text: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
