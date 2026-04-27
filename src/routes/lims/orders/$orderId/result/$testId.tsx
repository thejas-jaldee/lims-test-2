import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { type ReactNode, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  Check,
  ChevronDown,
  FileSignature,
  Folder,
  Upload,
} from "lucide-react";
import { z } from "zod";
import { PageHeader } from "@/components/layout/PageHeader";
import { PatientAvatar } from "@/components/lims/PatientCard";
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
    s.orders.find((entry) => entry.id === orderId || entry.number === orderId),
  ) as Order;
  const getPatient = useLimsStore((s) => s.getPatient);
  const setTestStatus = useLimsStore((s) => s.setTestStatus);
  const publishTest = useLimsStore((s) => s.publishTest);
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
      if (test?.id === "CBC-001") {
        const demoValues = ["15", "8", "160", "80", "30", "34"];
        if (demoValues[index]) seeded[parameter.parameter] = demoValues[index];
      }
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

  const handlePublish = () => {
    publishTest(order.id, testId);
    toast.success("Result published");
    navigate({ to: "/lims/orders/$orderId/report/$testId", params: { orderId: order.id, testId } });
  };

  const handleReturn = () => {
    setTestStatus(order.id, testId, "in_progress");
    toast.error("Returned to technician");
    navigate({ to: "/lims/orders/$orderId", params: { orderId: order.id } });
  };

  if (readOnly) {
    return (
      <ResultPublishPreview
        order={order}
        testId={testId}
        onPublish={handlePublish}
      />
    );
  }

  return (
    <div className="bg-background">
      <PageHeader
        title={isApprove ? "Approve Result" : "Result Entry"}
        backTo="/lims/orders/$orderId"
      />

      <div className="mx-auto w-full  px-3 pb-10 sm:px-4 lg:px-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_378px] xl:items-start">
          <div className="space-y-5">
            <section className="rounded-[15px] border border-[#ece7dc] bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]">
              <div className="flex flex-col gap-4 px-5 pb-5 pt-6 sm:px-7 sm:pb-7">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <h2 className="font-['DM_Sans'] text-[24px] font-bold tracking-[-0.03em] text-[#1a1915] sm:text-[26px]">
                      {test.shortName ?? test.code} - {test.name}
                    </h2>
                    {isEntry ? (
                      <ProgressPill filledCount={filledCount} totalFields={totalFields} />
                    ) : (
                      <p className="mt-2 text-[14px] text-[#6b6960]">
                        {order.number} · {patient.name} · {patient.age} yr {patient.gender} ·{" "}
                        {test.specimen}
                      </p>
                    )}
                  </div>

                  <div className="flex min-w-[190px] flex-col items-start gap-2 text-left xl:items-end xl:text-right">
                    {isEntry && (
                      <div className="font-['DM_Sans'] text-[18px] font-medium text-[#b1aca1]">
                        Order {order.number}
                      </div>
                    )}
                    <button className="text-[13px] font-medium text-primary underline underline-offset-2">
                      View Clinical Instruction
                    </button>
                  </div>
                </div>

                <div className="space-y-[10px]">
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
              </div>
            </section>

            <section className="rounded-[15px] border border-[#ece7dc] bg-white px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6">
              {isEntry ? (
                <>
                  <div className="grid gap-4 lg:grid-cols-[minmax(180px,1fr)_minmax(150px,214px)_minmax(160px,204px)]">
                    <MetaField label="Entered By" required>
                      <button
                        type="button"
                        className="flex h-9 w-full items-center justify-between rounded-[8px] border border-[#e2e0d8] px-2.5 text-[13px] text-[#1a1915]"
                      >
                        <span>{enteredBy}</span>
                        <ChevronDown className="h-3.5 w-3.5 text-[#8c887d]" />
                      </button>
                    </MetaField>
                    <MetaField label="Date" required>
                      <div className="flex h-9 items-center justify-between rounded-[8px] border border-[#e2e0d8] px-2.5 text-[13px] text-[#1a1915]">
                        <span>17 - 03 - 2026</span>
                        <CalendarDays className="h-3.5 w-3.5 text-[#8c887d]" />
                      </div>
                    </MetaField>
                    <MetaField label="Time" required>
                      <div className="grid h-9 grid-cols-[1fr_16px_1fr_75px] overflow-hidden rounded-[8px] border border-[#e2e0d8] text-[13px] text-[#1a1915]">
                        <div className="flex items-center justify-center">05</div>
                        <div className="flex items-center justify-center">:</div>
                        <div className="flex items-center justify-center">51</div>
                        <div className="flex items-center justify-between border-l border-[#e2e0d8] bg-[#f0f0f0] px-2.5">
                          <span>PM</span>
                          <ChevronDown className="h-3.5 w-3.5 text-[#8c887d]" />
                        </div>
                      </div>
                    </MetaField>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-4">
                    <Link
                      to="/lims/orders/$orderId"
                      params={{ orderId: order.id }}
                      className="inline-flex h-[45px] min-w-[125px] items-center justify-center rounded-[10px] border border-[#e2e0d8] px-5 font-['DM_Sans'] text-[14px] font-medium text-[#6b6960] sm:h-[45px] sm:min-w-[120px] sm:text-[14px]"
                    >
                      Cancel
                    </Link>
                    <button
                      onClick={handleSubmit}
                      className="inline-flex h-[45px] min-w-[175px] items-center justify-center gap-2.5 rounded-[10px] bg-primary px-6 font-['DM_Sans'] text-[14px] font-semibold text-white sm:h-[45px] sm:min-w-[200px] sm:text-[14px]"
                    >
                      <Check className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                      Save &amp; Submit
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-5">
                  <div className="grid gap-4 lg:grid-cols-[minmax(180px,1fr)_minmax(150px,214px)_minmax(160px,204px)]">
                    <MetaField label={isApprove ? "Approved By" : "Entered By"} required={isApprove}>
                      <button
                        type="button"
                        onClick={() =>
                          isApprove &&
                          setApprovedBy((current) =>
                            current === "Dr. Rekha Suresh" ? "Dr. Anand K." : "Dr. Rekha Suresh",
                          )
                        }
                        className="flex h-9 w-full items-center justify-between rounded-[8px] border border-[#e2e0d8] px-2.5 text-[13px] text-[#1a1915]"
                      >
                        <span>{isApprove ? approvedBy : enteredBy}</span>
                        {isApprove && <ChevronDown className="h-3.5 w-3.5 text-[#8c887d]" />}
                      </button>
                    </MetaField>
                    <MetaField label="Date" required={isApprove}>
                      <div className="flex h-9 items-center justify-between rounded-[8px] border border-[#e2e0d8] px-2.5 text-[13px] text-[#1a1915]">
                        <span>17 - 03 - 2026</span>
                        <CalendarDays className="h-3.5 w-3.5 text-[#8c887d]" />
                      </div>
                    </MetaField>
                    <MetaField label="Time" required={isApprove}>
                      <div className="grid h-9 grid-cols-[1fr_16px_1fr_75px] overflow-hidden rounded-[8px] border border-[#e2e0d8] text-[13px] text-[#1a1915]">
                        <div className="flex items-center justify-center">05</div>
                        <div className="flex items-center justify-center">:</div>
                        <div className="flex items-center justify-center">51</div>
                        <div className="flex items-center justify-between border-l border-[#e2e0d8] bg-[#f0f0f0] px-2.5">
                          <span>PM</span>
                          {isApprove && <ChevronDown className="h-3.5 w-3.5 text-[#8c887d]" />}
                        </div>
                      </div>
                    </MetaField>
                  </div>

                  {isApprove && <DigitalSignatureBlock doctor={approvedBy} />}

                  {isApprove ? (
                    <div className="flex flex-wrap gap-3 sm:gap-4">
                      <Link
                        to="/lims/orders/$orderId"
                        params={{ orderId: order.id }}
                        className="inline-flex h-12 min-w-[124px] items-center justify-center rounded-[10px] border border-[#e2e0d8] px-5 text-[15px] text-[#6b6960] sm:min-w-[140px]"
                      >
                        Cancel
                      </Link>
                      <button
                        onClick={handleReturn}
                        className="inline-flex h-12 min-w-[124px] items-center justify-center rounded-[10px] border border-[#f0c6c1] bg-[#fff3f1] px-5 text-[15px] font-medium text-[#b53a2d] sm:min-w-[140px]"
                      >
                        Return
                      </button>
                      <button
                        onClick={handleApprove}
                        className="inline-flex h-12 min-w-[168px] items-center justify-center gap-2.5 rounded-[10px] bg-primary px-5 text-[15px] font-semibold text-white sm:min-w-[184px]"
                      >
                        <Check className="h-4 w-4" />
                        Approve Result
                      </button>
                    </div>
                  ) : (
                    <p className="text-[13px] text-[#8c887d]">
                      This preview keeps the same field order and grouping as the entry sheet.
                    </p>
                  )}
                </div>
              )}
            </section>
          </div>

          <aside className="xl:sticky xl:top-6">
            <section className="rounded-[15px] border border-[#ece7dc] bg-white">
              <div className="flex items-center justify-between border-b border-[#ece7dc] px-5 py-4">
                <div className="font-['DM_Sans'] text-[16px] font-semibold text-[#1a1915]">
                  Patient
                </div>
                <button className="rounded-[10px] border border-[#e2e0d8] px-3 py-1.5 text-[12px] font-medium text-[#6b6960]">
                  View Profile
                </button>
              </div>

              <div className="px-5 py-5">
                <div className="flex items-center gap-3">
                  <PatientAvatar name={patient.name} size={45} />
                  <div>
                    <div className="font-['DM_Sans'] text-[17px] font-bold text-[#1a1915]">
                      {patient.name}
                    </div>
                    <div className="text-[14px] text-[#6b6960]">
                      {patient.age} yr · {patient.gender}
                    </div>
                  </div>
                </div>

                <dl className="mt-5 space-y-3 text-[14px]">
                  <PatientRow label="Patient ID" value={<span className="text-info">{patient.id}</span>} />
                  <PatientRow label="Phone" value={patient.phone} />
                  <PatientRow label="Email" value={patient.email} />
                </dl>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ProgressPill({
  filledCount,
  totalFields,
}: {
  filledCount: number;
  totalFields: number;
}) {
  const percentage = Math.min(100, (filledCount / totalFields) * 100);

  return (
    <div className="mt-4 flex w-full max-w-[406px] items-center gap-4 rounded-full border border-[#e2e0d8] px-4 py-1.5">
      <div className="h-[5px] flex-1 rounded-full bg-[#e7e2d8]">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
      </div>
      <span className="shrink-0 text-[13px] text-[#6b6960]">
        {filledCount} / {totalFields} filled
      </span>
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
    <section className="rounded-[9px] border border-[#e2e0d8] bg-white">
      <div className="flex flex-col gap-4 px-3 py-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <div className="mt-1 inline-flex h-[21px] w-[25px] shrink-0 items-center justify-center rounded-[4px] bg-[#f0efe9] font-mono text-[11px] font-medium text-[#a8a69d]">
              {String(index).padStart(2, "0")}
            </div>
            <div>
              <div className="font-['DM_Sans'] text-[15px] font-bold text-[#1a1915]">{label}</div>
              <div className="mt-0.5 text-[12px] text-[#6b6960]">{helper}</div>
            </div>
          </div>
        </div>

        {simpleReadValue ? (
          <div className="pl-9 text-[15px] font-medium text-[#1a1915] md:pl-0">
            {value || "-"}
            {unit ? <span className="ml-2 text-[12px] text-[#6b6960]">{unit}</span> : null}
          </div>
        ) : (
          <div className="flex w-full max-w-[280px] overflow-hidden rounded-[8px] border border-[#e2e0d8] md:w-[280px]">
            <input
              inputMode="decimal"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              readOnly={readOnly}
              className="h-[38px] min-w-0 flex-1 bg-white px-4 text-center text-[15px] text-[#1a1915] outline-none"
            />
            <button
              type="button"
              className="flex h-[38px] min-w-[96px] items-center justify-between border-l border-[#e2e0d8] bg-[#f0f0f0] px-3 text-[12px] text-[#6b6960]"
            >
              <span>{unit}</span>
              <ChevronDown className="h-3.5 w-3.5 text-[#8c887d]" />
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
    <section className="overflow-hidden rounded-[9px] border border-[#e2e0d8] bg-white">
      <div className="border-b border-[#f1ede5] px-3 py-3">
        <div className="flex items-start gap-3">
          <div className="mt-1 inline-flex h-[21px] w-[25px] shrink-0 items-center justify-center rounded-[4px] bg-[#f0efe9] font-mono text-[11px] font-medium text-[#a8a69d]">
            {String(index).padStart(2, "0")}
          </div>
          <div>
            <div className="font-['DM_Sans'] text-[15px] font-bold text-[#1a1915]">{field.label}</div>
            <div className="mt-0.5 text-[12px] text-[#6b6960]">{field.helper}</div>
          </div>
        </div>
      </div>

      <div className="px-3 py-3">
        {field.kind === "select" && (
          <>
            {isApprove || readOnly ? (
              <div className="text-[15px] font-medium text-[#1a1915]">{value || "-"}</div>
            ) : (
              <div className="ml-auto flex w-full max-w-[336px] overflow-hidden rounded-[8px] border border-[#e2e0d8]">
                <button
                  type="button"
                  className="flex h-[38px] min-w-0 flex-1 items-center justify-between bg-white px-4 text-[13px] text-[#1a1915]"
                >
                  <span className={cn(!value && "text-[#8c887d]")}>
                    {value || field.choices?.[0] || "Select"}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-[#8c887d]" />
                </button>
                {field.unit && (
                  <button
                    type="button"
                    className="flex h-[38px] min-w-[96px] items-center justify-between border-l border-[#e2e0d8] bg-[#f0f0f0] px-3 text-[12px] text-[#6b6960]"
                  >
                    <span>{field.unit}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-[#8c887d]" />
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {field.kind === "textarea" && (
          <div className="overflow-hidden rounded-[8px] border border-[#e2e0d8]">
            <div className="flex flex-wrap items-center gap-2 border-b border-[#efefef] bg-[#faf9f7] px-3 py-2">
              <span className="text-[13px] font-semibold text-[#1a1915]">B</span>
              <span className="text-[13px] italic text-[#1a1915]">I</span>
              <span className="text-[13px] text-[#1a1915]">•</span>
              <span className="text-[13px] text-[#1a1915]">1.</span>
              {!isApprove &&
                !readOnly &&
                quickInterpretations.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onValueChange(value ? `${value}\n${item}` : item)}
                    className="rounded-full border border-[#d9d7cf] bg-white px-2.5 py-1 text-[11px] text-[#6b6960]"
                  >
                    {item}
                  </button>
                ))}
            </div>

            {isApprove || readOnly ? (
              <div className="min-h-[115px] px-4 py-4 text-[14px] leading-6 text-[#1a1915]">
                {value || "-"}
              </div>
            ) : (
              <textarea
                value={value}
                onChange={(event) => onValueChange(event.target.value)}
                rows={5}
                placeholder="Enter clinical interpretation, remarks, or observations..."
                className="min-h-[115px] w-full resize-none px-4 py-4 text-[14px] text-[#1a1915] outline-none placeholder:text-[#b8b2a8]"
              />
            )}

            <div className="border-t border-[#efefef] bg-white px-3 py-2 text-[12px] text-[#9e9c93]">
              <span className="text-[#166534]">0 words</span>
              <span className="ml-3">Tab = indent · Ctrl+Z = undo</span>
            </div>
          </div>
        )}

        {field.kind === "file" && (
          <>
            {isApprove || readOnly ? (
              <div className="rounded-[9px] border border-[#e2e0d8] bg-[#faf9f7] px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-white text-[#8c887d]">
                    <Folder className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[14px] font-medium text-[#1a1915]">Image</div>
                    <div className="text-[12px] text-[#6b6960]">36 KB | PNG</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[9px] border-2 border-dashed border-[#cccac0] bg-[#f0efe9] px-4 py-8 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#8c887d]">
                  <Upload className="h-5 w-5" />
                </div>
                <div className="mt-3 font-['DM_Sans'] text-[14px] font-semibold text-[#1a1915]">
                  Drop files or click to upload
                </div>
                <div className="mt-1 text-[12px] text-[#6b6960]">
                  JPG, PNG, PDF, TIFF · Max 10 MB
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

const cbcReportRows = [
  { label: "HAEMOGLOBIN", result: "15", unit: "mg/dL", reference: "13.0-17.0" },
  { label: "WBC COUNT", result: "8", unit: "x10³", reference: "4.0-11.0" },
  { label: "PLATELET COUNT", result: "160", unit: "x10³", reference: "150-400" },
  { label: "MCV", result: "80", unit: "fL", reference: "80-100" },
  { label: "MCH", result: "30", unit: "pg", reference: "27-32" },
  { label: "MCHC", result: "34", unit: "U/L", reference: "35-140" },
];

function ResultPublishPreview({
  order,
  testId,
  onPublish,
}: {
  order: Order;
  testId: string;
  onPublish: () => void;
}) {
  const getPatient = useLimsStore((s) => s.getPatient);
  const patient = getPatient(order.patientId);
  const test = getTest(testId);

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

  const initials = patient.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const reportRows =
    test.id === "CBC-001"
      ? cbcReportRows
      : (test.parameters ?? []).map((parameter) => ({
          label: parameter.parameter.toUpperCase(),
          result: String((parameter.rangeLow + parameter.rangeHigh) / 2),
          unit: parameter.unit,
          reference: `${parameter.rangeLow}-${parameter.rangeHigh}`,
        }));

  return (
    <div className="bg-background">
      <PageHeader title="Result" backTo="/lims/orders/$orderId" />

      <div className="mx-auto w-full px-3 pb-10 sm:px-4 lg:px-0">
        <section className="flex flex-col gap-4 rounded-[8px] bg-white px-4 pb-24 pt-4 sm:px-7 sm:pt-5 md:px-8 md:pb-36 md:pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#e4eeeb] text-[16px] font-bold text-primary sm:h-[60px] sm:w-[60px] sm:text-[19px]">
                {initials}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-[15px] font-bold leading-tight tracking-[-0.03em] text-[#1a1915] sm:text-[19px]">
                    {patient.name}
                  </div>
                  <span className="rounded-[6px] bg-[#eef1f7] px-2 py-0.5 text-[10px] font-bold tracking-[0.04em] text-[#1d3f70]">
                    {patient.id}
                  </span>
                </div>
                <div className="mt-1 text-[13px] leading-tight text-[#6b6960] sm:text-[15px]">
                  {patient.age} yr · {patient.gender}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 sm:gap-3">
              <Link
                to="/lims/orders/$orderId/report/$testId"
                params={{ orderId: order.id, testId }}
                className="inline-flex h-[40px] min-w-[132px] items-center justify-center rounded-[8px] bg-[#171717] px-4 text-[11px] font-medium text-white sm:h-[46px] sm:min-w-[142px] sm:text-[12px]"
              >
                Preview Report
              </Link>
              <button
                onClick={onPublish}
                className="inline-flex h-[40px] min-w-[142px] items-center justify-center rounded-[8px] bg-primary px-4 text-[11px] font-medium text-white sm:h-[46px] sm:min-w-[155px] sm:text-[12px]"
              >
                Publish Results
              </button>
            </div>
          </div>

          <article className="overflow-hidden rounded-[8px] border border-[#ddd8cf] bg-white">
            <header className="border-b border-[#ddd8cf] px-4 py-5 sm:px-5 sm:py-6">
              <h2 className="text-[15px] font-bold leading-tight tracking-[-0.02em] text-primary sm:text-[18px]">
                {test.shortName ?? test.code} — {test.name}
              </h2>
              <p className="mt-1 text-[11px] leading-tight text-[#6b6960] sm:text-[13px]">
                Entered by Tech. Sreeja R · 9:12 AM
              </p>
            </header>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[660px] border-collapse text-[13px] sm:text-[14px]">
                <thead className="bg-[#f0efea] text-left text-[10px] font-bold uppercase tracking-[0.08em] text-[#9d9991] sm:text-[11px]">
                  <tr>
                    <th className="w-[41%] border-b border-[#ddd8cf] px-4 py-3 sm:px-5">Test Result</th>
                    <th className="w-[7%] border-b border-[#ddd8cf] px-4 py-3 sm:px-5">Result</th>
                    <th className="w-[28%] border-b border-[#ddd8cf] px-4 py-3 sm:px-5"></th>
                    <th className="w-[24%] border-b border-[#ddd8cf] px-4 py-3 sm:px-5">Ref Range</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((row) => (
                    <tr key={row.label}>
                      <td className="border-b border-[#ddd8cf] px-4 py-4 font-normal text-[#1a1915] sm:px-5 sm:py-5">
                        {row.label}
                      </td>
                      <td className="border-b border-[#ddd8cf] px-4 py-4 font-bold text-[#1a1915] sm:px-5 sm:py-5">
                        {row.result}
                      </td>
                      <td className="border-b border-[#ddd8cf] px-4 py-4 text-[#6b6960] sm:px-5 sm:py-5">
                        {row.unit}
                      </td>
                      <td className="border-b border-[#ddd8cf] px-4 py-4 text-[#6b6960] sm:px-5 sm:py-5">
                        {row.reference}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <section className="rounded-[8px] border border-[#ddd8cf] bg-white px-4 py-5 sm:px-5 sm:py-7">
            <div className="text-[15px] uppercase leading-tight text-[#1a1915] sm:text-[15px]">
              Peripheral Blood Film: <span className="font-bold normal-case">Macrocytic</span>
            </div>
          </section>

          <section className="rounded-[8px] border border-[#ddd8cf] bg-white px-4 py-5 sm:px-5 sm:py-6">
            <div className="text-[15px] uppercase leading-tight text-[#1a1915] sm:text-[15px]">
              Clinical Interpretation / Remarks
            </div>
            <div className="mt-5 text-[15px] font-bold leading-tight text-[#1a1915] sm:text-[15px]">
              Normal CBC
            </div>
          </section>

          <section className="rounded-[8px] border border-[#ddd8cf] bg-white px-4 py-5 sm:px-5 sm:py-6">
            <div className="text-[15px] uppercase leading-tight text-[#1a1915] sm:text-[15px]">
              Instrument Printout / Image
            </div>
            <div className="mt-5 rounded-[8px] border border-[#d8d3c8] px-5 py-4">
              <div className="flex items-center gap-4">
                <Folder className="h-8 w-8 text-[#6b6960]" />
                <div>
                  <div className="text-[12px] font-bold leading-tight text-[#1a1915] sm:text-[13px]">
                    Image
                  </div>
                  <div className="mt-1.5 text-[10px] leading-tight text-[#6b6960] sm:text-[11px]">
                    36 KB | PNG
                  </div>
                </div>
              </div>
            </div>
          </section>

          <footer className="mt-16 border-t border-[#ddd8cf] pt-7 text-right sm:mt-20">
            <div className="ml-auto max-w-[420px]">
              <div className="text-[17px] font-bold leading-tight text-[#1a1915] sm:text-[19px]">
                Dr. Rekha Suresh
              </div>
              <div className="mt-2.5 text-[12px] leading-tight text-[#6b6960] sm:text-[14px]">
                MD Pathology · Lab Director
              </div>
              <div className="mt-3 text-[10px] leading-tight text-[#9d9991] sm:text-[12px]">
                Digitally verified · 17 Mar 2026, 11:30 AM
              </div>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}
function DigitalSignatureBlock({ doctor }: { doctor: string }) {
  return (
    <div className="mt-4 flex max-w-[456px] items-center gap-2.5 rounded-[10px] border border-violet/30 bg-violet-soft/60 px-3.5 py-2.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] border border-violet/40 bg-white text-violet">
        <FileSignature className="h-4 w-4" />
      </div>
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-violet">
          Digital Signature
        </div>
        <div className="mt-0.5 text-[13px] font-semibold text-[#1a1915]">{doctor}</div>
      </div>
    </div>
  );
}

function MetaField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 font-['Instrument_Sans'] text-[11px] font-bold uppercase tracking-[0.05em] text-[#6b6960]">
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
      </div>
      {children}
    </div>
  );
}

function PatientRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#f1ede5] pb-3 last:border-b-0 last:pb-0">
      <dt className="text-[#6b6960]">{label}</dt>
      <dd className="max-w-[62%] text-right font-medium text-[#1a1915]">{value}</dd>
    </div>
  );
}
