import { useState } from "react";
import { Calendar, Clock, ChevronDown, AlertCircle } from "lucide-react";
import { SidePanel } from "./SidePanel";
import { type OrderSample, technicians, collectionLocations } from "@/data/lims";

interface Props {
  open: boolean;
  onClose: () => void;
  sample: OrderSample | null;
  onConfirm?: (collectedBy: string) => void;
}

export function SampleCollectionDrawer({ open, onClose, sample, onConfirm }: Props) {
  const [tech, setTech] = useState(technicians[0]);
  const [loc, setLoc] = useState(collectionLocations[0]);
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toTimeString().slice(0, 5);

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={`Collect ${sample?.type ?? "Sample"}`}
      subtitle={sample?.id}
      width="md"
      footer={
        <>
          <button onClick={onClose} className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={() => (onConfirm ? onConfirm(tech) : onClose())}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            ✓ Collected
          </button>
        </>
      }
    >
      {!sample ? null : (
        <div className="flex flex-col gap-5">
          <Field label="Collected By">
            <SelectInput value={tech} onChange={setTech} options={technicians} />
          </Field>
          <Field label="Collection Location">
            <SelectInput value={loc} onChange={setLoc} options={collectionLocations} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Collection Date">
              <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <input type="date" defaultValue={today} className="flex-1 bg-transparent text-sm outline-none" />
              </div>
            </Field>
            <Field label="Collection Time">
              <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <input type="time" defaultValue={now} className="flex-1 bg-transparent text-sm outline-none" />
              </div>
            </Field>
          </div>

          <div className="rounded-xl border border-border bg-surface-muted p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <AlertCircle className="h-4 w-4 text-warning" />
              Sample Collection Instructions
            </div>
            <dl className="mt-3 space-y-2 text-xs">
              <Row label="Container" value={sample.container ?? "—"} />
              <Row label="Volume" value={sample.volume ?? "—"} />
              <Row label="Fasting" value={sample.fasting ?? "—"} />
            </dl>
            {sample.instructions && (
              <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-muted-foreground">
                {sample.instructions.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </SidePanel>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium">{label}</div>
      {children}
    </div>
  );
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: readonly string[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-md border border-border bg-surface px-3 py-2 pr-9 text-sm outline-none"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
