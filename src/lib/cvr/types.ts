/** Normalised company record shared by every data source (cvrapi.dk, demo data, later CVR system-til-system). */
export type CompanyStatus = "aktiv" | "ophoert" | "konkurs" | "ukendt";

export type Company = {
  cvr: string;
  name: string;
  address: string;
  zip: string;
  city: string;
  phone: string | null;
  email: string | null;
  industryCode: string | null;
  industryText: string | null;
  /** Virksomhedsform, fx "ApS", "A/S", "Enkeltmandsvirksomhed". */
  form: string | null;
  /** Antal ansatte som interval-tekst, fx "10-19". */
  employees: string | null;
  /** Første tal i intervallet (til filtrering). */
  employeesMin: number | null;
  /** ISO-dato (YYYY-MM-DD) eller null. */
  startDate: string | null;
  status: CompanyStatus;
  /** Reklamebeskyttet i CVR — må ikke kontaktes med direkte markedsføring (CVR-lovens § 19). */
  protected: boolean;
  /** Ejere / ledelse som cvrapi.dk returnerer dem. */
  people: string[];
  /** Testdata: numre er fiktive og må ikke ringes op. */
  demo: boolean;
  fetchedAt: string;
};
