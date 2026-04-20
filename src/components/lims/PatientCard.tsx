import { type Patient } from "@/data/lims";

export function PatientAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("");
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-success-soft font-semibold text-success"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {initials}
    </div>
  );
}

interface PatientCardProps {
  patient: Patient;
  expanded?: boolean;
}

export function PatientCard({ patient, expanded = true }: PatientCardProps) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <PatientAvatar name={patient.name} />
        <div>
          <div className="text-sm font-semibold">{patient.name}</div>
          <div className="text-xs text-muted-foreground">{patient.age} yr · {patient.gender}</div>
        </div>
      </div>
      {expanded && (
        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Patient ID" value={<span className="text-info">{patient.id}</span>} />
          <Row label="Phone" value={patient.phone} />
          <Row label="Email" value={patient.email} />
          <Row label="Address" value={<span className="text-right text-xs">{patient.address}</span>} />
        </dl>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
