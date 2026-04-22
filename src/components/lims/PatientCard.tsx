import { type Patient } from "@/data/lims";

export function PatientAvatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-success-soft font-semibold text-success"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
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
      <div className="flex items-center gap-3 px-1">
        <PatientAvatar name={patient.name} />
        <div>
          <div className="text-[15px] font-semibold text-foreground">{patient.name}</div>
          <div className="text-[12px] text-muted-foreground">{patient.age} yr · {patient.gender}</div>
        </div>
      </div>
      {expanded && (
        <dl className="mt-5 space-y-4 text-sm">
          <Row label="Patient ID" value={<span className="text-info">{patient.id}</span>} />
          <Row label="Phone" value={patient.phone} />
          <Row label="Email" value={patient.email} />
        </dl>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <dt className="text-[12px] text-muted-foreground">{label}</dt>
      <dd className="text-right text-[12px] font-medium text-foreground">{value}</dd>
    </div>
  );
}
