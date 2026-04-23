import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Check, ChevronDown, FileImage, Folder, Info, Upload } from "lucide-react";
import { z } from "zod";
import { PageHeader } from "@/components/layout/PageHeader";
import { PatientCard } from "@/components/lims/PatientCard";
import { type Order, getTest } from "@/data/lims";
import { cn } from "@/lib/utils";
import { useLimsStore } from "@/store/limsStore";

const searchSchema = z.object({
  mode: z.enum(["entry", "approve", "view"]).optional().default("entry"),
});

export const Route = createFileRoute("/lims/orders/$orderId/result/$testId")({
  head: ({ params }) => ({
    meta: [
      { title: `Result - ${params.testId} - LIMS` },
      {
        name: "description",
        content: `Result entry for test ${params.testId} on order ${params.orderId}.`,
      },
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

const quickInterpretations = ["Normal CBC", "Anaemia pattern", "Infection pattern"];

type SupplementaryField = {
  id: string;
  label: string;
  helper: string;
  kind: "select" | "textarea" | "file";
  unit?: string;
  choices?: string[];
};

function ResultEntryPage() {
  const { orderId, testId } = Route.useLoaderData();
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const order = useLimsStore((s) =>
    s.orders.find((o) => o.id === orderId || o.number === orderId),
  ) as Order;
  const getPatient = useLimsStore((s) => s.getPatient);
  const setTestStatus = useLimsStore((s) => s.setTestStatus);
  const patient = getPatient(order.patientId);
  const test = getTest(testId);

  const readOnly = mode === "view";
  const isApprove = mode === "approve";
  const isEntry = mode === "entry";

  const baseParameters = useMemo(() => {
    if (!test?.parameters) return [];
    if (test.id === "CBC-001") return test.parameters.slice(0, 6);
    return test.parameters;
  }, [test]);

  const extraFields: SupplementaryField[] = useMemo(() => {
    if (test?.id === "CBC-001") {
      return [
        {
          id: "peripheralBloodFilm",
          label: "Peripheral Blood Film",
          helper: "Morphology assessment",
          kind: "select",
          unit: "g/dL",
          choices: ["Select", "Normocytic", "Macrocytic", "Microcytic"],
        },
        {
          id: "clinicalInterpretation",
          label: "Clinical Interpretation / Remarks",
          helper: "Free-text findings (optional but recommended for flagged results)",
          kind: "textarea",
        },
        {
          id: "instrumentPrintout",
          label: "Instrument Printout / Image",
          helper: "Optional: attach analyzer printout or microscopy image",
          kind: "file",
        },
      ];
    }

    return [
      {
        id: "clinicalInterpretation",
        label: "Clinical Interpretation / Remarks",
        helper: "Free-text findings",
        kind: "textarea",
      },
      {
        id: "instrumentPrintout",
        label: "Instrument Printout / Image",
        helper: "Optional file attachment",
        kind: "file",
      },
    ];
  }, [test?.id]);

  const [values, setValues] = useState<Record<string, string>>(() => {
    if (isEntry) return {};

    const seeded: Record<string, string> = {};
    baseParameters.forEach((parameter, index) => {
      const midpoint = (parameter.rangeLow + parameter.rangeHigh) / 2;
      seeded[parameter.parameter] = Number.isInteger(midpoint)
        ? String(midpoint)
        : midpoint.toFixed(1);
      if (index === 0 && test?.id === "CBC-001") seeded[parameter.parameter] = "15";
      if (index === 1 && test?.id === "CBC-001") seeded[parameter.parameter] = "8";
      if (index === 2 && test?.id === "CBC-001") seeded[parameter.parameter] = "160";
      if (index === 3 && test?.id === "CBC-001") seeded[parameter.parameter] = "80";
      if (index === 4 && test?.id === "CBC-001") seeded[parameter.parameter] = "30";
      if (index === 5 && test?.id === "CBC-001") seeded[parameter.parameter] = "34";
    });
    seeded.peripheralBloodFilm = "Macrocytic";
    seeded.clinicalInterpretation =
      "Macrocytic pattern noted. Correlate clinically with B12 / folate status.";
    return seeded;
  });
  const [interpretation, setInterpretation] = useState(
    isEntry ? "" : "Macrocytic pattern noted. Correlate clinically with B12 / folate status.",
  );
  const [enteredBy] = useState("Tech. Sreeja R");
  const [approvedBy, setApprovedBy] = useState("Dr. Rekha Suresh");

  if (!patient || !test) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Test not found.{" "}
        <Link to="/lims/orders/$orderId" params={{ orderId: order.id }} className="text-primary">
          Back to order
        </Link>
      </div>
    );
  }

  const totalFields = baseParameters.length + extraFields.length;
  const filledCount =
    Object.values(values).filter((value) => value.trim() !== "").length +
    (interpretation.trim() ? 1 : 0) -
    (values.clinicalInterpretation ? 1 : 0);

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

  const subtitle = `${order.number} · ${patient.name} · ${patient.age} yr ${patient.gender} · ${test.specimen}`;

  return (
    <div className="origin-top-left w-[142.86%] [zoom:0.7]">
      <PageHeader
        title={isApprove ? "Approve Result" : readOnly ? "Result Preview" : "Result Entry"}
        backTo="/lims/orders/$orderId"
      />

      <div className="w-full">
        <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-3 sm:space-y-4">
            <section className="rounded-[18px] border border-border bg-surface px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-[20px] font-semibold leading-tight text-foreground sm:text-[22px] lg:text-[24px]">
                    {test.shortName ?? test.code} - {test.name}
                  </div>
                  {isEntry ? (
                    <div className="mt-4 max-w-[560px]">
                      <div className="flex items-center gap-3 rounded-[18px] border border-border px-3 py-3">
                        <div className="h-[8px] flex-1 rounded-full bg-[oklch(0.92_0.01_250)]">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{
                              width: `${Math.min(100, (filledCount / totalFields) * 100)}%`,
                            }}
                          />
                        </div>
                        <div className="shrink-0 text-[15px] font-medium text-foreground">
                          {filledCount} / {totalFields} filled
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 text-[16px] text-muted-foreground sm:text-[17px]">
                      {subtitle}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-start gap-2 sm:items-end">
                  {isEntry && (
                    <div className="text-[18px] font-semibold text-[oklch(0.78_0.01_250)] sm:text-[20px] lg:text-[22px]">
                      Order {order.number}
                    </div>
                  )}
                  <button className="text-[14px] font-medium text-primary underline underline-offset-4 hover:opacity-80 sm:text-[15px]">
                    View Clinical Instruction
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {baseParameters.map((parameter, index) => (
                  <ResultValueCard
                    key={parameter.parameter}
                    index={index + 1}
                    label={parameter.parameter}
                    helper={`${parameter.unit} · Normal: ${parameter.rangeLow}-${parameter.rangeHigh}`}
                    value={values[parameter.parameter] ?? ""}
                    unit={parameter.unit}
                    readOnly={readOnly || isApprove}
                    simpleReadValue={isApprove || readOnly}
                    onChange={(next) =>
                      setValues((state) => ({ ...state, [parameter.parameter]: next }))
                    }
                  />
                ))}

                {extraFields.map((field, index) => (
                  <SupplementaryCard
                    key={field.id}
                    field={field}
                    index={baseParameters.length + index + 1}
                    readOnly={readOnly}
                    isApprove={isApprove}
                    value={
                      field.id === "clinicalInterpretation"
                        ? interpretation
                        : (values[field.id] ?? "")
                    }
                    onValueChange={(next) => {
                      if (field.id === "clinicalInterpretation") {
                        setInterpretation(next);
                        return;
                      }
                      setValues((state) => ({ ...state, [field.id]: next }));
                    }}
                  />
                ))}
              </div>
            </section>

            {isEntry && (
              <section className="rounded-[18px] border border-border bg-surface px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.1fr)_180px_180px]">
                  <MetaField label="Entered By" required>
                    <div className="flex h-12 items-center justify-between rounded-[16px] border border-border bg-surface px-4 text-[16px]">
                      <span>{enteredBy}</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </MetaField>
                  <MetaField label="Date" required>
                    <div className="flex h-12 items-center justify-between rounded-[16px] border border-border bg-surface px-4 text-[16px]">
                      <span>17 - 03 - 2026</span>
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </MetaField>
                  <MetaField label="Time" required>
                    <div className="grid h-12 grid-cols-[1fr_24px_1fr_92px] overflow-hidden rounded-[16px] border border-border bg-surface text-[16px]">
                      <div className="flex items-center justify-center">05</div>
                      <div className="flex items-center justify-center">:</div>
                      <div className="flex items-center justify-center">51</div>
                      <div className="flex items-center justify-between border-l border-border bg-surface-muted px-4">
                        <span>PM</span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </MetaField>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    to="/lims/orders/$orderId"
                    params={{ orderId: order.id }}
                    className="inline-flex h-14 min-w-[140px] items-center justify-center rounded-[18px] border border-border px-6 text-[18px] text-muted-foreground hover:bg-muted"
                  >
                    Cancel
                  </Link>
                  <button
                    onClick={handleSubmit}
                    className="inline-flex h-14 min-w-[220px] items-center justify-center gap-3 rounded-[18px] bg-primary px-8 text-[18px] font-semibold text-primary-foreground hover:opacity-90"
                  >
                    <Check className="h-5 w-5" />
                    Save &amp; Submit
                  </button>
                </div>
              </section>
            )}

            {isApprove && (
              <section className="rounded-[18px] border border-border bg-surface px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
                <div className="space-y-5">
                  <div>
                    <div className="text-[16px] text-muted-foreground">Result Entered By</div>
                    <div className="mt-3 rounded-[16px] border border-border px-5 py-5">
                      <div className="text-[18px] font-medium text-foreground">Tech. Sreeja R</div>
                      <div className="mt-2 text-[16px] text-muted-foreground">
                        31 - 03 - 2026 | 05 : 51 PM
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.1fr)_180px_180px]">
                    <MetaField label="Approved By" required>
                      <button
                        type="button"
                        onClick={() =>
                          setApprovedBy((current) =>
                            current === "Dr. Rekha Suresh" ? "Dr. Anand K." : "Dr. Rekha Suresh",
                          )
                        }
                        className="flex h-12 w-full items-center justify-between rounded-[16px] border border-border bg-surface px-4 text-[16px]"
                      >
                        <span>{approvedBy}</span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </MetaField>
                    <MetaField label="Date" required>
                      <div className="flex h-12 items-center justify-between rounded-[16px] border border-border bg-surface px-4 text-[16px]">
                        <span>17 - 03 - 2026</span>
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </MetaField>
                    <MetaField label="Time" required>
                      <div className="grid h-12 grid-cols-[1fr_24px_1fr_92px] overflow-hidden rounded-[16px] border border-border bg-surface text-[16px]">
                        <div className="flex items-center justify-center">05</div>
                        <div className="flex items-center justify-center">:</div>
                        <div className="flex items-center justify-center">51</div>
                        <div className="flex items-center justify-between border-l border-border bg-surface-muted px-4">
                          <span>PM</span>
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </MetaField>
                  </div>

                  <div className="flex flex-col gap-3 rounded-[18px] border border-transparent bg-surface sm:flex-row sm:items-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[20px] border border-[oklch(0.89_0.07_310)] bg-[oklch(0.98_0.02_310)] text-[oklch(0.66_0.24_310)]">
                      <FileImage className="h-10 w-10" />
                    </div>
                    <div>
                      <div className="text-[18px] font-medium text-foreground">
                        Digital Signature
                      </div>
                      <div className="mt-1 text-[16px] text-muted-foreground">{approvedBy}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      to="/lims/orders/$orderId"
                      params={{ orderId: order.id }}
                      className="inline-flex h-14 min-w-[150px] items-center justify-center rounded-[18px] border border-border px-6 text-[18px] text-muted-foreground hover:bg-muted"
                    >
                      Cancel
                    </Link>
                    <button
                      onClick={handleReturn}
                      className="inline-flex h-14 min-w-[180px] items-center justify-center rounded-[18px] border border-[oklch(0.84_0.09_20)] bg-[oklch(0.97_0.03_20)] px-6 text-[18px] font-medium text-[oklch(0.54_0.15_20)] hover:opacity-90"
                    >
                      Return
                    </button>
                    <button
                      onClick={handleApprove}
                      className="inline-flex h-14 min-w-[220px] items-center justify-center gap-3 rounded-[18px] bg-primary px-8 text-[18px] font-semibold text-primary-foreground hover:opacity-90"
                    >
                      <Check className="h-5 w-5" />
                      Approve Result
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>

          <aside className="flex flex-col gap-3 sm:gap-4">
            <section className="rounded-[18px] border border-border bg-surface p-0">
              <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-5">
                <div className="text-[16px] font-semibold text-foreground sm:text-[18px]">
                  Patient
                </div>
                <button className="rounded-[16px] border border-border px-4 py-2 text-[14px] text-muted-foreground hover:bg-muted">
                  View Profile
                </button>
              </div>
              <div className="px-4 py-5 sm:px-5 sm:py-6">
                <PatientCard patient={patient} />
              </div>
            </section>

            {!isEntry && (
              <section className="rounded-[18px] border border-border bg-surface px-4 py-4 text-[14px] text-muted-foreground sm:px-5">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p>
                    This view is read focused. Values, interpretation and file attachments are shown
                    in the same visual order as the entry sheet.
                  </p>
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function ResultValueCard({
  index,
  label,
  helper,
  value,
  unit,
  readOnly,
  simpleReadValue,
  onChange,
}: {
  index: number;
  label: string;
  helper: string;
  value: string;
  unit?: string;
  readOnly: boolean;
  simpleReadValue: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <section className="rounded-[18px] border border-border px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-start gap-4">
            <div className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[oklch(0.95_0.01_90)] text-[13px] font-semibold text-[oklch(0.64_0.01_90)]">
              {String(index).padStart(2, "0")}
            </div>
            <div className="min-w-0">
              <div className="text-[18px] font-semibold leading-tight text-foreground sm:text-[19px]">
                {label}
              </div>
              <div className="mt-2 text-[15px] text-muted-foreground">{helper}</div>
            </div>
          </div>
        </div>

        {simpleReadValue ? (
          <div className="flex items-end gap-4 self-start lg:self-center">
            <div className="text-[22px] font-semibold leading-none text-foreground sm:text-[24px]">
              {value || "-"}
            </div>
            <div className="text-[15px] text-muted-foreground">{unit}</div>
          </div>
        ) : (
          <div className="flex w-full max-w-[340px] overflow-hidden rounded-[16px] border border-border lg:w-[340px]">
            <input
              inputMode="decimal"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              readOnly={readOnly}
              className="h-14 min-w-0 flex-1 bg-surface px-4 text-center text-[18px] outline-none"
            />
            <button
              type="button"
              className="flex h-14 min-w-[120px] items-center justify-between border-l border-border bg-surface-muted px-5 text-[16px] text-foreground"
            >
              <span>{unit}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function SupplementaryCard({
  field,
  index,
  readOnly,
  isApprove,
  value,
  onValueChange,
}: {
  field: SupplementaryField;
  index: number;
  readOnly: boolean;
  isApprove: boolean;
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <section className="rounded-[18px] border border-border px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-start gap-4">
        <div className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[oklch(0.95_0.01_90)] text-[13px] font-semibold text-[oklch(0.64_0.01_90)]">
          {String(index).padStart(2, "0")}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[18px] font-semibold leading-tight text-foreground sm:text-[19px]">
            {field.label}
          </div>
          <div className="mt-2 text-[15px] text-muted-foreground">{field.helper}</div>

          {field.kind === "select" && (
            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {isApprove || readOnly ? (
                <div className="ml-auto font-mono text-[20px] font-semibold text-foreground">
                  {value || "-"}
                </div>
              ) : (
                <div className="ml-auto flex w-full max-w-[500px] overflow-hidden rounded-[16px] border border-border">
                  <button
                    type="button"
                    className="flex h-14 min-w-0 flex-1 items-center justify-between bg-surface px-5 text-[18px]"
                  >
                    <span className={cn(!value && "text-muted-foreground")}>
                      {value || field.choices?.[0] || "Select"}
                    </span>
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  </button>
                  {field.unit && (
                    <button
                      type="button"
                      className="flex h-14 min-w-[130px] items-center justify-between border-l border-border bg-surface-muted px-5 text-[16px]"
                    >
                      <span>{field.unit}</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {field.kind === "textarea" && (
            <div className="mt-4 overflow-hidden rounded-[18px] border border-border">
              <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 text-[15px]">
                <span className="font-semibold">B</span>
                <span>/</span>
                <span>•</span>
                <span>1.</span>
                {!isApprove &&
                  quickInterpretations.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => onValueChange(value ? `${value}\n${item}` : item)}
                      className="rounded-full border border-border px-3 py-1 text-[13px] text-muted-foreground hover:border-primary hover:text-primary"
                    >
                      {item}
                    </button>
                  ))}
              </div>
              {isApprove || readOnly ? (
                <div className="min-h-[160px] px-4 py-5 text-[16px] leading-7 text-foreground">
                  {value || "-"}
                </div>
              ) : (
                <textarea
                  value={value}
                  onChange={(event) => onValueChange(event.target.value)}
                  rows={5}
                  placeholder="Enter clinical interpretation, remarks, or observations..."
                  className="min-h-[160px] w-full resize-none px-4 py-5 text-[16px] outline-none"
                />
              )}
              <div className="border-t border-border px-4 py-2 text-[13px] text-muted-foreground">
                <span className="text-success">0 words</span>
                <span className="ml-4">Tab = indent · Ctrl+Z = undo</span>
              </div>
            </div>
          )}

          {field.kind === "file" && (
            <div className="mt-4">
              {isApprove || readOnly ? (
                <div className="rounded-[18px] bg-[oklch(0.97_0.01_90)] px-5 py-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-surface text-muted-foreground">
                      <Folder className="h-8 w-8" />
                    </div>
                    <div>
                      <div className="text-[18px] font-medium text-foreground">Image</div>
                      <div className="mt-1 text-[16px] text-muted-foreground">36 KB | PNG</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-[18px] border-2 border-dashed border-[oklch(0.86_0.01_90)] bg-[oklch(0.97_0.01_90)] px-5 py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted-foreground">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="mt-4 text-[18px] font-medium text-foreground">
                    Drop files or click to upload
                  </div>
                  <div className="mt-2 text-[16px] text-muted-foreground">
                    JPG, PNG, PDF, TIFF · Max 10 MB
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function MetaField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 text-[15px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
      </div>
      {children}
    </div>
  );
}
