import { useState } from "react";
import { Plus, X, Calculator } from "lucide-react";
import { Modal } from "./Modal";
import { type ParameterType, type TestParameter } from "@/data/lims";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (p: TestParameter) => void;
}

const types: { key: ParameterType; label: string }[] = [
  { key: "numeric", label: "Numeric" },
  { key: "dropdown", label: "Dropdown" },
  { key: "descriptive", label: "Descriptive" },
  { key: "formula", label: "Formula" },
  { key: "file", label: "File/Image Upload" },
];

export function ParameterModal({ open, onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<ParameterType>("numeric");
  const [unit, setUnit] = useState("");
  const [units, setUnits] = useState<string[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState("");
  const [multi, setMulti] = useState(false);
  const [allowDecimal, setAllowDecimal] = useState(true);
  const [allowNeg, setAllowNeg] = useState(false);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [ranges, setRanges] = useState<Array<{ gender: string; from: string; to: string; type: string; value: string; label: string }>>([]);
  const [formula, setFormula] = useState("");
  const [allowed, setAllowed] = useState<Record<string, boolean>>({ PDF: true, JPG: true, PNG: false, Word: false });
  const [rt, setRt] = useState("");

  const reset = () => {
    setName(""); setCode(""); setType("numeric"); setUnit(""); setUnits([]); setOptions([]);
    setMulti(false); setAllowDecimal(true); setAllowNeg(false); setMin(""); setMax(""); setRanges([]);
    setFormula(""); setRt("");
  };

  const handleSave = () => {
    if (!name) return;
    onSave({
      id: `P${Date.now()}`,
      code: code || name.slice(0, 3).toUpperCase(),
      name,
      type,
      unit: units[0] ?? unit,
      range: type === "numeric" && min && max ? { low: Number(min), high: Number(max) } : undefined,
    });
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Create Parameter — ${types.find((t) => t.key === type)?.label}`}
      width="xl"
      footer={
        <>
          <button onClick={onClose} className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
          <button onClick={handleSave} className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Save</button>
        </>
      }
    >
      <div className="space-y-5 p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="Parameter Name *">
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
          </Field>
          <Field label="Code">
            <input value={code} onChange={(e) => setCode(e.target.value)} className="input" />
          </Field>
          <Field label="Type">
            <select value={type} onChange={(e) => setType(e.target.value as ParameterType)} className="input">
              {types.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </Field>
        </div>

        {/* Numeric */}
        {type === "numeric" && (
          <>
            <UnitsField unit={unit} setUnit={setUnit} units={units} setUnits={setUnits} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Min Value"><input value={min} onChange={(e) => setMin(e.target.value)} className="input" /></Field>
              <Field label="Max Value"><input value={max} onChange={(e) => setMax(e.target.value)} className="input" /></Field>
            </div>
            <div className="flex flex-wrap gap-6">
              <Toggle label="Allow Decimal Values" on={allowDecimal} setOn={setAllowDecimal} />
              <Toggle label="Allow Negative Values" on={allowNeg} setOn={setAllowNeg} />
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold">Reference Ranges</div>
                <button
                  onClick={() => setRanges((arr) => [...arr, { gender: "All", from: "0", to: "100", type: "Range", value: "", label: "Normal" }])}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
                >
                  <Plus className="h-3 w-3" /> New Range
                </button>
              </div>
              {ranges.length === 0 && <div className="py-3 text-center text-xs text-muted-foreground">No ranges added.</div>}
              {ranges.map((r, i) => (
                <div key={i} className="mt-2 grid grid-cols-12 gap-2 text-xs">
                  <select className="input col-span-2" defaultValue={r.gender}><option>All</option><option>Male</option><option>Female</option></select>
                  <input className="input col-span-2" placeholder="Age from" defaultValue={r.from} />
                  <input className="input col-span-2" placeholder="Age to" defaultValue={r.to} />
                  <select className="input col-span-2" defaultValue={r.type}><option>Range</option><option>Less than</option><option>Greater than</option></select>
                  <input className="input col-span-2" placeholder="Value" defaultValue={r.value} />
                  <input className="input col-span-1" placeholder="Label" defaultValue={r.label} />
                  <button onClick={() => setRanges((arr) => arr.filter((_, k) => k !== i))} className="col-span-1 inline-flex items-center justify-center rounded-md border border-border text-danger hover:bg-danger-soft">
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="col-span-12 px-1 italic text-muted-foreground">
                    Preview: {r.gender}, age {r.from}-{r.to}: {r.type === "Range" ? `${min}–${max}` : `${r.type} ${r.value}`} → <span className="text-foreground">{r.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Dropdown */}
        {type === "dropdown" && (
          <>
            <Toggle label="Allow Multi Selection" on={multi} setOn={setMulti} />
            <UnitsField unit={unit} setUnit={setUnit} units={units} setUnits={setUnits} />
            <Field label="Dropdown Options">
              <div className="flex gap-2">
                <input
                  value={optionInput}
                  onChange={(e) => setOptionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && optionInput.trim()) {
                      setOptions((arr) => [...arr, optionInput.trim()]);
                      setOptionInput("");
                    }
                  }}
                  placeholder="Type and press Enter…"
                  className="input flex-1"
                />
                <button
                  onClick={() => {
                    if (optionInput.trim()) {
                      setOptions((arr) => [...arr, optionInput.trim()]);
                      setOptionInput("");
                    }
                  }}
                  className="rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
                >
                  Enter
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {options.map((o, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
                    {o}
                    <button onClick={() => setOptions((arr) => arr.filter((_, k) => k !== i))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </Field>
            <div className="rounded-lg border border-border p-3">
              <div className="mb-2 text-sm font-semibold">Applicability</div>
              <div className="grid grid-cols-3 gap-2">
                <select className="input"><option>All Genders</option><option>Male</option><option>Female</option></select>
                <input className="input" placeholder="Age (from)" />
                <input className="input" placeholder="Age (to)" />
              </div>
              <button className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                <Plus className="h-3 w-3" /> New Range
              </button>
            </div>
          </>
        )}

        {/* Descriptive */}
        {type === "descriptive" && (
          <Field label="Default Template">
            <textarea value={rt} onChange={(e) => setRt(e.target.value)} rows={6} className="input !h-auto py-2" placeholder="Free-text observation template…" />
          </Field>
        )}

        {/* Formula */}
        {type === "formula" && (
          <>
            <UnitsField unit={unit} setUnit={setUnit} units={units} setUnits={setUnits} />
            <Field label="Formula">
              <div className="flex gap-2">
                <input value={formula} onChange={(e) => setFormula(e.target.value)} className="input flex-1 font-mono" placeholder="e.g. (Hb / Hct) * 100" />
                <button className="rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">Enter</button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {["+", "-", "×", "÷", "^", "(", ")"].map((op) => (
                  <button key={op} onClick={() => setFormula((f) => f + ` ${op} `)} className="h-8 w-8 rounded-md border border-border bg-surface text-sm font-semibold hover:bg-muted">
                    {op}
                  </button>
                ))}
              </div>
              <div className="mt-3 text-xs font-medium text-muted-foreground">Available Test Components</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {["HB", "HCT", "RBC", "MCV", "MCH"].map((c) => (
                  <button key={c} onClick={() => setFormula((f) => f + ` ${c} `)} className="rounded-full border border-border px-2.5 py-0.5 text-xs font-mono hover:border-primary hover:text-primary">
                    {c}
                  </button>
                ))}
              </div>
              <div className="mt-3 rounded-md border border-dashed border-border bg-surface-muted p-3 text-xs">
                <div className="flex items-center gap-1 text-muted-foreground"><Calculator className="h-3 w-3" /> Preview Result</div>
                <div className="mt-1 font-mono">{formula || "—"}</div>
              </div>
            </Field>
          </>
        )}

        {/* File */}
        {type === "file" && (
          <>
            <Field label="Allowed File Types">
              <div className="flex flex-wrap gap-3">
                {Object.keys(allowed).map((k) => (
                  <label key={k} className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={allowed[k]} onChange={(e) => setAllowed((a) => ({ ...a, [k]: e.target.checked }))} className="h-4 w-4 accent-primary" />
                    {k}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Maximum File Size (MB)">
              <input className="input" defaultValue="10" />
            </Field>
          </>
        )}
      </div>

      <style>{`.input{height:2.25rem;width:100%;border-radius:0.375rem;border:1px solid var(--color-border);background:var(--color-surface);padding:0 0.625rem;font-size:0.8125rem;outline:none}.input:focus{border-color:var(--color-primary)}`}</style>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium">{label}</div>
      {children}
    </div>
  );
}

function Toggle({ label, on, setOn }: { label: string; on: boolean; setOn: (v: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <button
        type="button"
        onClick={() => setOn(!on)}
        className={cn("relative h-5 w-9 rounded-full transition-colors", on ? "bg-primary" : "bg-border-strong")}
      >
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform", on ? "translate-x-4" : "translate-x-0.5")} />
      </button>
      {label}
    </label>
  );
}

function UnitsField({ unit, setUnit, units, setUnits }: { unit: string; setUnit: (s: string) => void; units: string[]; setUnits: (a: string[]) => void }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium">Unit</div>
      <div className="flex gap-2">
        <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. g/dL" className="input flex-1" />
        <button onClick={() => { if (unit) { setUnits([...units, unit]); setUnit(""); } }} className="rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">Add</button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {units.map((u, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
            {u}
            <button onClick={() => setUnits(units.filter((_, k) => k !== i))}><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
    </div>
  );
}
