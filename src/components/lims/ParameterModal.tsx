import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  X,
  Search,
  GripVertical,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Minus,
  AlignLeft,
  AlignCenter,
  Image as ImageIcon,
  Table as TableIcon,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";
import { Modal } from "./Modal";
import { type ParameterType, type TestParameter } from "@/data/lims";
import { cn } from "@/lib/utils";

/* ---------- types ---------- */

type Gender = "All" | "Male" | "Female";
type RangeType = "Range" | "Less-than" | "Greater-than";

interface RefRange {
  id: string;
  gender: Gender;
  ageFrom: string;
  ageTo: string;
  type: RangeType;
  min: string;
  max: string;
  value: string;
  label: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (p: TestParameter) => void;
  initial?: TestParameter | null;
  /** test components available for the formula builder */
  components?: { code: string; name: string }[];
}

const types: { key: ParameterType; label: string }[] = [
  { key: "numeric", label: "Numeric" },
  { key: "dropdown", label: "Dropdown" },
  { key: "descriptive", label: "Descriptive" },
  { key: "formula", label: "Formula" },
  { key: "file", label: "File/Image Upload" },
];

const defaultComponents = [
  { code: "HB", name: "Haemoglobin" },
  { code: "RBC", name: "RBC" },
  { code: "HCT", name: "Hematocrit" },
  { code: "MCV", name: "MCV" },
];

const newRange = (): RefRange => ({
  id: `r${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
  gender: "All",
  ageFrom: "",
  ageTo: "",
  type: "Range",
  min: "",
  max: "",
  value: "",
  label: "",
});

/* ---------- main ---------- */

export function ParameterModal({ open, onClose, onSave, initial, components = defaultComponents }: Props) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<ParameterType>("numeric");

  const [unit, setUnit] = useState("");
  const [units, setUnits] = useState<string[]>([]);

  // numeric
  const [allowDecimal, setAllowDecimal] = useState(true);
  const [allowNeg, setAllowNeg] = useState(false);
  const [ranges, setRanges] = useState<RefRange[]>([]);

  // dropdown
  const [multi, setMulti] = useState(false);
  const [optionInput, setOptionInput] = useState("");
  const [options, setOptions] = useState<string[]>([]);

  // descriptive
  const [descHtml, setDescHtml] = useState("");

  // formula
  const [formula, setFormula] = useState("");

  // file
  const [allowed, setAllowed] = useState<Record<string, boolean>>({ PDF: true, JPG: false, PNG: false, Word: false });
  const [maxSize, setMaxSize] = useState("10");

  /* prefill on open / when initial changes */
  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name ?? "");
      setCode(initial.code ?? "");
      setType(initial.type ?? "numeric");
      setUnits(initial.unit ? [initial.unit] : []);
    } else {
      setName(""); setCode(""); setType("numeric");
      setUnit(""); setUnits([]);
      setAllowDecimal(true); setAllowNeg(false); setRanges([newRange()]);
      setMulti(false); setOptionInput(""); setOptions([]);
      setDescHtml(""); setFormula("");
      setAllowed({ PDF: true, JPG: false, PNG: false, Word: false });
      setMaxSize("10");
    }
  }, [open, initial]);

  const titleLabel = useMemo(() => "Create Parameter", []);

  const addUnit = () => {
    const v = unit.trim();
    if (!v || units.includes(v)) { setUnit(""); return; }
    setUnits((arr) => [...arr, v]);
    setUnit("");
  };
  const addOption = () => {
    const v = optionInput.trim();
    if (!v || options.includes(v)) { setOptionInput(""); return; }
    setOptions((arr) => [...arr, v]);
    setOptionInput("");
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: initial?.id ?? `P${Date.now()}`,
      code: code.trim() || name.slice(0, 3).toUpperCase(),
      name: name.trim(),
      type,
      unit: units[0],
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={titleLabel}
      width="2xl"
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg bg-muted px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-border"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-primary px-8 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Save
          </button>
        </>
      }
    >
      <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-7">
        {/* common fields */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.6fr_1fr_1fr]">
          <Field label="Parameter Name">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Hemoglobin"
                className="pm-input pm-input-with-icon"
              />
            </div>
          </Field>
          <Field label="Code">
            <input value={code} onChange={(e) => setCode(e.target.value)} className="pm-input" placeholder="HGB" />
          </Field>
          <Field label="Type">
            <div className="relative">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ParameterType)}
                className="pm-input appearance-none pr-9"
              >
                {types.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </Field>
        </div>

        {/* type-specific */}
        {(type === "numeric" || type === "formula" || type === "dropdown") && type !== "dropdown" && (
          <UnitField unit={unit} setUnit={setUnit} units={units} setUnits={setUnits} addUnit={addUnit} />
        )}

        {type === "numeric" && (
          <>
            <div className="flex flex-wrap gap-x-12 gap-y-4">
              <ToggleRow
                label="Allow Negative Values"
                hint="Permit results below zero"
                on={allowNeg}
                setOn={setAllowNeg}
              />
              <ToggleRow
                label="Allow Decimal Values"
                hint="Support floating point data"
                on={allowDecimal}
                setOn={setAllowDecimal}
              />
            </div>

            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground">Reference Range</div>
              <div className="rounded-xl bg-surface-muted p-4 sm:p-5">
                <div className="space-y-5">
                  {ranges.map((r) => (
                    <RangeRow
                      key={r.id}
                      r={r}
                      onChange={(patch) => setRanges((arr) => arr.map((x) => (x.id === r.id ? { ...x, ...patch } : x)))}
                      onRemove={() => setRanges((arr) => arr.filter((x) => x.id !== r.id))}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setRanges((arr) => [...arr, newRange()])}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-surface px-3.5 py-2 text-xs font-semibold text-primary hover:bg-primary-soft"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Range
                </button>
              </div>
            </div>
          </>
        )}

        {type === "dropdown" && (
          <>
            <ToggleRow
              label="Allow Multi Selection"
              hint="allow users to select multiple options from a dropdown"
              on={multi}
              setOn={setMulti}
            />
            <UnitField
              unit={unit}
              setUnit={setUnit}
              units={units}
              setUnits={setUnits}
              addUnit={addUnit}
              placeholder="Enter the unit and Click add button"
            />
            <div>
              <div className="mb-2 text-sm font-bold text-primary">Dropdown Options</div>
              <div className="flex gap-2">
                <input
                  value={optionInput}
                  onChange={(e) => setOptionInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOption(); } }}
                  placeholder="Type an option and press Enter"
                  className="pm-input flex-1"
                />
                <button onClick={addOption} className="rounded-lg bg-foreground px-6 text-sm font-semibold text-background hover:opacity-90">
                  Enter
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {options.map((o, i) => (
                  <span key={i} className="inline-flex items-center gap-2 rounded-lg bg-primary-soft px-3 py-1.5 text-sm font-medium text-primary-soft-foreground">
                    <GripVertical className="h-3.5 w-3.5 opacity-60" />
                    {o}
                    <button onClick={() => setOptions((arr) => arr.filter((_, k) => k !== i))} className="opacity-70 hover:opacity-100">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {type === "descriptive" && (
          <div className="rounded-xl border border-border bg-surface">
            <div className="flex flex-wrap items-center gap-1 border-b border-border px-3 py-2 text-muted-foreground">
              <ToolBtn><Undo2 className="h-4 w-4" /></ToolBtn>
              <ToolBtn><Redo2 className="h-4 w-4" /></ToolBtn>
              <Divider />
              <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-muted">Paragraph <ChevronDown className="h-3 w-3" /></button>
              <Divider />
              <ToolBtn><Minus className="h-4 w-4" /></ToolBtn>
              <span className="px-2 text-xs">14px</span>
              <ToolBtn><Plus className="h-4 w-4" /></ToolBtn>
              <Divider />
              <ToolBtn><Bold className="h-4 w-4" /></ToolBtn>
              <ToolBtn><Italic className="h-4 w-4" /></ToolBtn>
              <button className="inline-flex items-center rounded-md px-1.5 py-1 hover:bg-muted">
                <span className="text-sm font-bold">A</span><ChevronDown className="h-3 w-3" />
              </button>
              <button className="inline-flex items-center rounded-md px-1.5 py-1 hover:bg-muted">
                <span className="text-sm">🖍</span><ChevronDown className="h-3 w-3" />
              </button>
              <Divider />
              <ToolBtn><AlignLeft className="h-4 w-4" /></ToolBtn>
              <ToolBtn><AlignCenter className="h-4 w-4" /></ToolBtn>
              <ToolBtn><TableIcon className="h-4 w-4" /></ToolBtn>
              <ToolBtn><ImageIcon className="h-4 w-4" /></ToolBtn>
              <ToolBtn><MoreHorizontal className="h-4 w-4" /></ToolBtn>
            </div>
            <div
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => setDescHtml((e.target as HTMLElement).innerHTML)}
              className="min-h-[280px] px-4 py-3 text-sm outline-none"
              data-placeholder="Enter clinical interpretation, remarks, or observations…"
              dangerouslySetInnerHTML={{ __html: descHtml }}
            />
          </div>
        )}

        {type === "formula" && (
          <div>
            <div className="mb-2 text-sm font-bold text-primary">Formula Builder</div>
            <div className="flex gap-2">
              <input
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="( Hemoglobin × 10 ) ÷ RBC"
                className="pm-input flex-1 font-medium"
              />
              <button className="rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground hover:opacity-90">
                Enter
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { label: "+", v: " + " },
                { label: "-", v: " - " },
                { label: "÷", v: " ÷ " },
                { label: "×", v: " × " },
                { label: "10^2", v: "^2" },
                { label: "(", v: " ( " },
                { label: ")", v: " ) " },
              ].map((op) => (
                <button
                  key={op.label}
                  onClick={() => setFormula((f) => f + op.v)}
                  className="h-10 min-w-[3rem] rounded-lg border border-border bg-surface px-3 text-sm font-semibold shadow-[var(--shadow-card)] hover:bg-muted"
                >
                  {op.label}
                </button>
              ))}
            </div>

            <div className="mt-5 text-sm font-medium text-foreground">Available Test Components in this test</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {components.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setFormula((f) => `${f}${f && !f.endsWith(" ") ? " " : ""}${c.name} `)}
                  className="rounded-lg bg-primary-soft px-4 py-2 text-sm font-medium text-primary-soft-foreground hover:opacity-90"
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-xl bg-surface-muted px-5 py-5">
              <div className="text-sm text-muted-foreground">Preview Result</div>
              <div className="mt-3 font-serif text-xl italic text-foreground">
                {formula ? <FormulaPreview code={code || "RESULT"} expr={formula} /> : <span className="text-muted-foreground/70">—</span>}
              </div>
            </div>
          </div>
        )}

        {type === "file" && (
          <>
            <div>
              <div className="mb-3 text-base font-semibold">Allowed File Types</div>
              <div className="space-y-3">
                {Object.keys(allowed).map((k) => (
                  <label key={k} className="flex cursor-pointer items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={allowed[k]}
                      onChange={(e) => setAllowed((a) => ({ ...a, [k]: e.target.checked }))}
                      className="h-5 w-5 accent-primary"
                    />
                    <span className="font-medium">{k}</span>
                  </label>
                ))}
              </div>
            </div>
            <Field label="Maximum File Size (MB)" labelClass="text-base font-semibold">
              <input value={maxSize} onChange={(e) => setMaxSize(e.target.value)} className="pm-input" />
            </Field>
          </>
        )}
      </div>

      <style>{`
        .pm-input{height:2.75rem;width:100%;border-radius:0.5rem;border:1px solid var(--color-border);background:var(--color-surface);padding:0 0.875rem;font-size:0.875rem;color:var(--color-foreground);outline:none;transition:border-color .15s,box-shadow .15s}
        .pm-input::placeholder{color:var(--color-muted-foreground);font-weight:400;opacity:1}
        .pm-input-with-icon{padding-left:2.25rem}
        .pm-input:focus{border-color:var(--color-primary);box-shadow:0 0 0 3px color-mix(in oklab, var(--color-primary) 18%, transparent)}
        [contenteditable][data-placeholder]:empty:before{content:attr(data-placeholder);color:var(--color-muted-foreground);pointer-events:none}
      `}</style>
    </Modal>
  );
}

/* ---------- pieces ---------- */

function Field({ label, children, labelClass }: { label: string; children: React.ReactNode; labelClass?: string }) {
  return (
    <div>
      <div className={cn("mb-2 text-sm font-medium text-foreground", labelClass)}>{label}</div>
      {children}
    </div>
  );
}

function ToggleRow({ label, hint, on, setOn }: { label: string; hint: string; on: boolean; setOn: (v: boolean) => void }) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        onClick={() => setOn(!on)}
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
          on ? "border-primary bg-primary" : "border-[#d0d5dd] bg-[#e5e9ef]",
        )}
        aria-pressed={on}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(16,24,40,0.22)] transition-transform",
            on ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
    </div>
  );
}

function UnitField({
  unit, setUnit, units, setUnits, addUnit, placeholder,
}: {
  unit: string; setUnit: (s: string) => void;
  units: string[]; setUnits: (a: string[]) => void;
  addUnit: () => void; placeholder?: string;
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-medium text-foreground">Unit</div>
      <div className="flex w-1/2 gap-2">
        <input
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addUnit(); } }}
          placeholder={placeholder ?? "e.g. g/dL"}
          className="pm-input flex-1"
        />
        <button onClick={addUnit} className="rounded-lg bg-foreground px-6 text-sm font-semibold text-background hover:opacity-90">
          Add
        </button>
      </div>
      {units.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {units.map((u, i) => (
            <span key={i} className="inline-flex items-center gap-2 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
              {u}
              <button onClick={() => setUnits(units.filter((_, k) => k !== i))} className="opacity-60 hover:opacity-100">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function RangeRow({
  r, onChange, onRemove,
}: {
  r: RefRange;
  onChange: (patch: Partial<RefRange>) => void;
  onRemove: () => void;
}) {
  const isRange = r.type === "Range";
  const preview = (() => {
    const who = `${r.gender === "All" ? "All Gender" : r.gender}`;
    const age = r.ageFrom || r.ageTo ? `, ${r.ageFrom || "0"}-${r.ageTo || "∞"} yrs` : "";
    const head = `Reference (${who}${age}): `;
    if (isRange) return `${head}${r.min || "—"} – ${r.max || "—"} ${r.label || ""}`.trim();
    if (r.type === "Less-than") return `${head}<${r.value || "—"} ${r.label || ""}`.trim();
    return `${head}>${r.value || "—"} ${r.label || ""}`.trim();
  })();

  const Label = ({ children }: { children: React.ReactNode }) => (
    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</div>
  );

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-12 sm:items-end">
        <div className="sm:col-span-2">
          <Label>Gender</Label>
          <SelectInput
            value={r.gender}
            onChange={(v) => onChange({ gender: v as Gender })}
            options={["All", "Male", "Female"]}
          />
        </div>
        <div className="sm:col-span-1">
          <Label>Age (from)</Label>
          <input className="pm-input" value={r.ageFrom} onChange={(e) => onChange({ ageFrom: e.target.value })} />
        </div>
        <div className="sm:col-span-1">
          <Label>Age (to)</Label>
          <input className="pm-input" value={r.ageTo} onChange={(e) => onChange({ ageTo: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <Label>Type</Label>
          <SelectInput
            value={r.type}
            onChange={(v) => onChange({ type: v as RangeType })}
            options={["Range", "Less-than", "Greater-than"]}
          />
        </div>
        {isRange ? (
          <>
            <div className="sm:col-span-2">
              <Label>Min Value</Label>
              <input className="pm-input" value={r.min} onChange={(e) => onChange({ min: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Max Value</Label>
              <input className="pm-input" value={r.max} onChange={(e) => onChange({ max: e.target.value })} />
            </div>
          </>
        ) : (
          <div className="sm:col-span-4">
            <Label>Value</Label>
            <input className="pm-input" value={r.value} onChange={(e) => onChange({ value: e.target.value })} />
          </div>
        )}
        <div className="sm:col-span-1">
          <Label>Label</Label>
          <input className="pm-input" value={r.label} onChange={(e) => onChange({ label: e.target.value })} placeholder="Normal" />
        </div>
        <div className="flex items-end justify-end sm:col-span-1">
          <button
            onClick={onRemove}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-danger/40 text-danger hover:bg-danger-soft"
            aria-label="Remove range"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-2 text-xs">
        <span className="text-muted-foreground">Preview:- </span>
        <span className="font-medium text-primary">{preview}</span>
      </div>
    </div>
  );
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="pm-input appearance-none pr-8">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

function ToolBtn({ children }: { children: React.ReactNode }) {
  return <button className="rounded-md p-1.5 hover:bg-muted">{children}</button>;
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-border" />;
}

/* Renders a simple "CODE = expr" preview, with ÷ handled as a fraction. */
function FormulaPreview({ code, expr }: { code: string; expr: string }) {
  const trimmed = expr.trim();
  const idx = trimmed.indexOf("÷");
  if (idx > -1) {
    const num = trimmed.slice(0, idx).trim().replace(/^\(|\)$/g, "").trim();
    const den = trimmed.slice(idx + 1).trim();
    return (
      <span className="inline-flex items-center gap-3">
        <span>{code} =</span>
        <span className="inline-flex flex-col items-center leading-tight">
          <span className="border-b border-foreground px-2 pb-0.5">{num}</span>
          <span className="px-2 pt-0.5">{den}</span>
        </span>
      </span>
    );
  }
  return <span>{code} = {trimmed}</span>;
}
