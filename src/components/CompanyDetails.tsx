import { Building2, Calendar, Mail, MapPin, Phone, Users, UserRound } from "lucide-react";
import type { Company } from "@/lib/cvr/types";

const STATUS: Record<Company["status"], string> = { aktiv: "Aktiv", ophoert: "Ophørt", konkurs: "Under konkurs", ukendt: "Ukendt" };

export function formatDate(iso: string | null) {
  if (!iso) return "–";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export function CompanyDetails({ c, showEmail = true }: { c: Company; showEmail?: boolean }) {
  return (
    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
      <Row icon={<Building2 />} label="CVR">
        <span className="font-mono">{c.cvr}</span> · {c.form ?? "Ukendt form"} · {STATUS[c.status]}
      </Row>
      <Row icon={<MapPin />} label="Adresse">
        {c.address}, {c.zip} {c.city}
      </Row>
      <Row icon={<Phone />} label="Telefon">
        {c.phone ? <span className="font-mono">{c.phone}</span> : "Ikke registreret"}
      </Row>
      {showEmail && (
        <Row icon={<Mail />} label="Email">
          {c.email ?? "Ikke registreret"}
        </Row>
      )}
      <Row icon={<Users />} label="Ansatte">
        {c.employees ?? "Ukendt"}
      </Row>
      <Row icon={<Calendar />} label="Stiftet">
        {formatDate(c.startDate)}
      </Row>
      <Row icon={<Building2 />} label="Branche">
        {c.industryText ?? "–"} {c.industryCode && <span className="font-mono text-muted-foreground">({c.industryCode})</span>}
      </Row>
      <Row icon={<UserRound />} label="Ledelse/ejere">
        {c.people.length ? c.people.join(", ") : "–"}
      </Row>
    </dl>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground [&>svg]:size-4" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="break-words">{children}</dd>
      </div>
    </div>
  );
}
