import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Save,
  Send,
  AlertTriangle,
  Info,
  Upload,
  PenLine,
  CheckCircle2,
  Eye,
  RotateCcw,
  ChevronDown,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { z } from "zod";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusPill } from "@/components/lims/StatusPill";
import { PatientAvatar } from "@/components/lims/PatientCard";
import {
  getTest,
  formatDateTime,
  technicians,
  type Order,
} from "@/data/lims";
import { useLimsStore } from "@/store/limsStore";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  mode: z.enum(["entry", "approve", "view"]).optional().default("entry"),
});

export const Route = createFileRoute("/lims/orders/$orderId/result/$testId")({
  head: ({ params }) => ({
    meta: [
      { title: `Result · ${params.testId} — LIMS` },
      { name: "description", content: `Result entry for test ${params.testId} on order ${params.orderId}.` },
    ],
  }),
  validateSearch: searchSchema,
  loader: ({ params }): { orderId: string; testId: string } => {
    const order = useLimsStore.getState().getOrder(params.orderId);
    if (!order) throw notFound();
    return { orderId: params.orderId, testId: params.testId };
  },
  component: ResultEntryPage,
});

const quickInterpretations = [
  "Normal CBC",
  "Anaemia pattern",
  "Infection pattern",
  "Thrombocytopenia",
];

function ResultEntryPage() {
  const { orderId, testId } = Route.useLoaderData();
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const order = useLimsStore((s) => s.orders.find((o) => o.id === orderId || o.number === orderId)) as Order;
  const setTestStatus = useLimsStore((s) => s.setTestStatus);
  const getPatient = useLimsStore((s) => s.getPatient);
  const test = getTest(testId);
  const handleSubmit = () => {
    setTestStatus(order.id, testId, "result_entered");
    toast.success("Result submitted");
    navigate({ to: "/lims/orders/$orderId", params: { orderId: order.id } });
  };
  const handleApprove = () => {
    setTestStatus(order.id, testId, "result_approved");
    toast.success("Result approved");
    navigate({ to: "/lims/orders/$orderId", params: { orderId: order.id } });
  };
  const handleReturn = () => {
    setTestStatus(order.id, testId, "in_progress");
    toast.error("Returned to technician");
    navigate({ to: "/lims/orders/$orderId", params: { orderId: order.id } });
  };
  const handlePublish = () => {
    setTestStatus(order.id, testId, "result_published");
    toast.success("Report published");
    navigate({ to: "/lims/orders/$orderId/report/$testId", params: { orderId: order.id, testId } });
  };
  const patient = getPatient(order.patientId)!;
  const params = test?.parameters ?? [];
  const [values, setValues] = useState<Record<string, string>>(() => {
    if (mode === "entry") return {};
    // demo prefill
    const obj: Record<string, string> = {};
    params.forEach((p, i) => {
      obj[p.parameter] = String(((p.rangeLow + p.rangeHigh) / 2).toFixed(1));
      if (i === 0) obj[p.parameter] = String(p.rangeLow - 1); // make first abnormal
    });
    return obj;
  });
  const [interpretation, setInterpretation] = useState(mode === "entry" ? "" : "Within normal limits. No clinically significant abnormalities detected.");
  const [enteredBy, setEnteredBy] = useState(technicians[0]);
  const readOnly = mode === "view";
  const isApprove = mode === "approve";

  if (!test) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Test not found.{" "}
        <Link to="/lims/orders/$orderId" params={{ orderId: order.id }} className="text-primary">
          Back to order
        </Link>
      </div>
    );
  }

  const filled = Object.values(values).filter((v) => v.trim() !== "").length;

  const flagFor = (p: (typeof params)[number], raw: string) => {
    const n = parseFloat(raw);
    if (isNaN(n)) return null;
    if (p.criticalLow != null && n <= p.criticalLow) return "critical-low";
    if (p.criticalHigh != null && n >= p.criticalHigh) return "critical-high";
    if (n < p.rangeLow) return "low";
    if (n > p.rangeHigh) return "high";
    return "normal";
  };

  const title = isApprove ? "Approve Result" : mode === "view" ? "Result Preview" : "Enter Result";

  return (
    <div>
      <PageHeader
        title={title}
        backTo="/lims/orders/$orderId"
      />

      <section className="mb-4 rounded-2xl border border-border bg-surface p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <PatientAvatar name={patient.name} />
            <div>
              <div className="text-base font-semibold">{patient.name}</div>
              <div className="text-xs text-muted-foreground">
                {patient.id} · {patient.age}y {patient.gender} · Order {order.number}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {mode === "view" && (
              <>
                <Link
                  to="/lims/orders/$orderId/report/$testId"
                  params={{ orderId: order.id, testId }}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-semibold hover:bg-muted"
                >
                  <Eye className="h-4 w-4" /> Preview Report
                </Link>
                <button onClick={handlePublish} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90">
                  <Send className="h-4 w-4" /> Publish Results
                </button>
              </>
            )}
            {mode === "entry" && <StatusPill tone="warning" label="Pending Entry" />}
            {isApprove && <StatusPill tone="danger" label="Awaiting Approval" />}
            <span className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">{test.shortName ?? test.code} — {test.name}</h2>
              <div className="mt-1 flex items-center gap-3 text-xs">
                <button className="inline-flex items-center gap-1 text-primary hover:underline">
                  <Info className="h-3 w-3" /> View Clinical Instruction
                </button>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{filled} / {params.length} filled</span>
              </div>
              <div className="mt-2 h-1.5 w-48 rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full bg-primary transition-all"
                  style={{ width: `${params.length ? (filled / params.length) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <div>Order Ref</div>
              <div className="font-mono text-sm font-semibold text-foreground">{order.number}</div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full">
              <thead className="bg-surface-muted">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="w-12 px-4 py-2.5">#</th>
                  <th className="px-4 py-2.5">Parameter</th>
                  <th className="px-4 py-2.5">Result</th>
                  <th className="px-4 py-2.5">Unit</th>
                  <th className="px-4 py-2.5">Reference Range</th>
                  <th className="px-4 py-2.5">Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {params.map((p, i) => {
                  const v = values[p.parameter] ?? "";
                  const flag = flagFor(p, v);
                  return (
                    <tr key={p.parameter}>
                      <td className="px-4 py-3 text-xs font-semibold text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 font-medium">{p.parameter}</td>
                      <td className="px-4 py-3">
                        <input
                          inputMode="decimal"
                          readOnly={readOnly || isApprove}
                          value={v}
                          onChange={(e) => setValues((s) => ({ ...s, [p.parameter]: e.target.value }))}
                          placeholder="—"
                          className={cn(
                            "h-9 w-28 rounded-md border bg-surface px-2.5 text-sm outline-none transition-colors focus:border-primary",
                            (readOnly || isApprove) && "bg-surface-muted",
                            flag === "critical-low" || flag === "critical-high"
                              ? "border-danger bg-danger-soft/30"
                              : flag === "high" || flag === "low"
                                ? "border-warning"
                                : "border-border",
                          )}
                        />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.unit}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.rangeLow} – {p.rangeHigh}
                      </td>
                      <td className="px-4 py-3">
                        {flag === "critical-low" || flag === "critical-high" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">
                            <AlertTriangle className="h-3 w-3" /> Critical
                          </span>
                        ) : flag === "high" ? (
                          <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-semibold text-[oklch(0.5_0.13_70)]">
                            ↑ High
                          </span>
                        ) : flag === "low" ? (
                          <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-semibold text-[oklch(0.5_0.13_70)]">
                            ↓ Low
                          </span>
                        ) : flag === "normal" ? (
                          <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">
                            Normal
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Peripheral blood film (descriptive parameter) */}
          <div className="mt-5 rounded-lg border border-border p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Peripheral Blood Film
            </div>
            <textarea
              rows={2}
              readOnly={readOnly || isApprove}
              defaultValue={mode === "entry" ? "" : "Normocytic normochromic RBCs, no abnormal cells seen. Platelets adequate on smear."}
              placeholder="Enter findings…"
              className="w-full rounded-md border border-border bg-surface p-3 text-sm outline-none focus:border-primary"
            />
          </div>

          {/* Clinical interpretation */}
          <div className="mt-4 rounded-lg border border-border p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Clinical Interpretation / Remarks
              </div>
              <div className="flex flex-wrap gap-1.5">
                {quickInterpretations.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setInterpretation((cur) => (cur ? `${cur}\n${q}` : q))}
                    className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:border-primary hover:text-primary"
                  >
                    + {q}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              rows={3}
              readOnly={readOnly || isApprove}
              value={interpretation}
              onChange={(e) => setInterpretation(e.target.value)}
              placeholder="Add interpretation, recommendations or notes…"
              className="w-full rounded-md border border-border bg-surface p-3 text-sm outline-none focus:border-primary"
            />
          </div>

          {/* Upload */}
          <div className="mt-4 rounded-lg border border-dashed border-border p-6 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Upload className="h-5 w-5" />
            </div>
            <div className="mt-2 text-sm font-medium">Instrument Printout / Image</div>
            <div className="text-xs text-muted-foreground">Drag &amp; drop or click — JPG, PNG, PDF, TIFF — max 10 MB</div>
            {(isApprove || mode === "view") && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-border bg-surface-muted px-3 py-2 text-xs">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                cbc-printout-2026.pdf · 248 KB
                <button className="ml-2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Footer block */}
          <div className="mt-5 grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface-muted p-4 md:grid-cols-3">
            <Field label={isApprove ? "Result Entered By" : "Entered By"}>
              <select
                value={enteredBy}
                onChange={(e) => setEnteredBy(e.target.value)}
                disabled={isApprove || readOnly}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none disabled:opacity-70"
              >
                {technicians.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <input
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                disabled={readOnly}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none"
              />
            </Field>
            <Field label="Time">
              <input
                type="time"
                defaultValue={new Date().toTimeString().slice(0, 5)}
                disabled={readOnly}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none"
              />
            </Field>
          </div>

          {isApprove && (
            <div className="mt-4 rounded-xl border border-border p-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Approval
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="Approved By">
                  <button className="flex w-full items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-sm">
                    Dr. Anand K. <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </Field>
                <Field label="Digital Signature">
                  <button className="inline-flex w-full items-center gap-2 rounded-md border border-dashed border-border bg-surface px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary">
                    <PenLine className="h-4 w-4" /> Add Signature
                  </button>
                </Field>
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
            <Link
              to="/lims/orders/$orderId"
              params={{ orderId: order.id }}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </Link>
            {mode === "entry" && (
              <>
                <button className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold hover:bg-muted">
                  <Save className="h-4 w-4" /> Save Draft
                </button>
                <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                  <Send className="h-4 w-4" /> Save &amp; Submit
                </button>
              </>
            )}
            {isApprove && (
              <>
                <button className="inline-flex items-center gap-2 rounded-md border border-warning px-4 py-2 text-sm font-semibold text-[oklch(0.5_0.13_70)] hover:bg-warning-soft">
                  <RotateCcw className="h-4 w-4" /> Return
                </button>
                <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                  <CheckCircle2 className="h-4 w-4" /> Approve Result
                </button>
              </>
            )}
            {mode === "view" && (
              <Link
                to="/lims/orders/$orderId/report/$testId"
                params={{ orderId: order.id, testId }}
                className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90"
              >
                <Eye className="h-4 w-4" /> Preview Report
              </Link>
            )}
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="text-sm font-semibold">Specimen</div>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Type" value={test.specimen} />
              <Row label="Department" value={test.department} />
              <Row label="Container" value={test.container ?? "—"} />
              <Row label="Code" value={<span className="font-mono text-xs">{test.code}</span>} />
            </dl>
          </div>
          {isApprove && (
            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="text-sm font-semibold">Entered By</div>
              <div className="mt-3 flex items-center gap-2">
                <PatientAvatar name="Sreeja R" size={32} />
                <div className="text-sm">
                  <div className="font-medium">Tech. Sreeja R.</div>
                  <div className="text-xs text-muted-foreground">17 Mar 2026, 09:14 AM</div>
                </div>
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-info bg-info-soft p-4 text-info">
            <div className="flex items-start gap-2 text-sm">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Critical values trigger an automatic alert to the referring doctor once the result is submitted.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
