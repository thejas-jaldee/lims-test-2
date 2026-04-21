import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarDays, ChevronDown, Search, Trash2, UserRound, ClipboardList } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionCard, FieldLabel } from "@/components/lims/SectionCard";
import {
  formatINR,
  referringDoctors,
  technicians,
  type LabTest,
  type Order,
  type OrderSample,
  type OrderTest,
  type Patient,
} from "@/data/lims";
import { buildTimeline, useLimsStore } from "@/store/limsStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lims/orders/new")({
  head: () => ({
    meta: [
      { title: "Create Order — LIMS" },
      { name: "description", content: "Create a new lab order with patient details and billing." },
    ],
  }),
  component: CreateOrderPage,
});

type PriorityLevel = "Normal" | "Urgent" | "High";

interface SelectedLineItem {
  testId: string;
  displayName: string;
  actualPrice: number;
  enteredPrice: number;
  discountPct: number;
}

const DEFAULT_PATIENT_ID = "PAT-8821";
const DEFAULT_TEST_IDS = ["CBC-001", "LFT-001"] as const;
const BILLING_RAW_DEFAULT = "2026-03-25T14:03";
const TEST_FILTER_OPTIONS = ["All Tests", "Popular Tests", "Biochemistry", "Hematology"] as const;
const DISCOUNT_OPTIONS = [0, 5, 10, 15] as const;
const ASSIGNEE_OPTIONS = ["Tech. Sreeja", ...technicians] as const;

function CreateOrderPage() {
  const navigate = useNavigate();
  const patients = useLimsStore((s) => s.patients);
  const tests = useLimsStore((s) => s.tests);
  const orders = useLimsStore((s) => s.orders);
  const addOrder = useLimsStore((s) => s.addOrder);

  const defaultPatient =
    patients.find((patient) => patient.id === DEFAULT_PATIENT_ID) ?? patients[0] ?? null;

  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState(defaultPatient?.id ?? "");
  const [designation, setDesignation] = useState(defaultPatient?.gender === "Female" ? "Ms." : "Mr.");
  const [selectedGender, setSelectedGender] = useState<Patient["gender"]>(defaultPatient?.gender ?? "Male");
  const [selectedDoctor, setSelectedDoctor] = useState(referringDoctors[0] ?? "");
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel>("Normal");
  const [assignedTo, setAssignedTo] = useState<string>(ASSIGNEE_OPTIONS[0] ?? "Tech. Sreeja");
  const [billingDateRaw, setBillingDateRaw] = useState(BILLING_RAW_DEFAULT);
  const [note, setNote] = useState("");
  const [testSearch, setTestSearch] = useState("");
  const [testFilter, setTestFilter] = useState<string>(TEST_FILTER_OPTIONS[0]);
  const [doctorFee, setDoctorFee] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [invoiceGenerated, setInvoiceGenerated] = useState(false);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [testSearchOpen, setTestSearchOpen] = useState(false);
  const [selectedTests, setSelectedTests] = useState<SelectedLineItem[]>(() =>
    DEFAULT_TEST_IDS.map((id) => buildLineItem(id, tests)).filter(Boolean) as SelectedLineItem[],
  );
  const [patientName, setPatientName] = useState(defaultPatient?.name ?? "");
  const [patientIdInput, setPatientIdInput] = useState(defaultPatient?.id ?? "");
  const [patientAge, setPatientAge] = useState(String(defaultPatient?.age ?? ""));
  const [patientPhone, setPatientPhone] = useState(defaultPatient?.phone ?? "");
  const patientSearchRef = useRef<HTMLDivElement | null>(null);
  const testSearchRef = useRef<HTMLDivElement | null>(null);

  const selectedPatient =
    patients.find((patient) => patient.id === selectedPatientId) ?? defaultPatient;

  const billingDateLabel = useMemo(() => formatBillingDate(billingDateRaw), [billingDateRaw]);

  const patientResults = useMemo(() => {
    const query = patientSearch.trim().toLowerCase();
    if (!query) return [];

    return patients
      .filter(
        (patient) =>
          patient.name.toLowerCase().includes(query) ||
          patient.id.toLowerCase().includes(query) ||
          patient.phone.toLowerCase().includes(query),
      )
      .slice(0, 5);
  }, [patientSearch, patients]);

  const availableTests = useMemo(() => {
    const query = testSearch.trim().toLowerCase();
    if (!query) return [];

    return tests
      .filter((test) => !selectedTests.some((item) => item.testId === test.id))
      .filter((test) => {
        if (testFilter === "Popular Tests") return ["CBC-001", "LFT-001", "THY-004"].includes(test.id);
        if (testFilter === "Biochemistry") return test.department === "Biochemistry";
        if (testFilter === "Hematology") return test.department === "Hematology";
        return true;
      })
      .filter(
        (test) =>
          test.name.toLowerCase().includes(query) ||
          test.code.toLowerCase().includes(query) ||
          test.shortName?.toLowerCase().includes(query),
      )
      .slice(0, 8);
  }, [selectedTests, testFilter, testSearch, tests]);

  const subtotal = selectedTests.reduce((sum, item) => sum + item.actualPrice, 0);
  const lineDiscount = selectedTests.reduce(
    (sum, item) => sum + item.actualPrice * (item.discountPct / 100),
    0,
  );
  const taxableAmount = Math.max(subtotal - lineDiscount - discountAmount, 0);
  const gst = taxableAmount * 0.18;
  const total = taxableAmount + gst + doctorFee;
  const hasTests = selectedTests.length > 0;

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;

      if (patientSearchRef.current && target && !patientSearchRef.current.contains(target)) {
        setPatientSearchOpen(false);
      }

      if (testSearchRef.current && target && !testSearchRef.current.contains(target)) {
        setTestSearchOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatientId(patient.id);
    setSelectedGender(patient.gender);
    setDesignation(patient.gender === "Female" ? "Ms." : "Mr.");
    setPatientName(patient.name);
    setPatientIdInput(patient.id);
    setPatientAge(String(patient.age));
    setPatientPhone(patient.phone);
    setPatientSearch("");
    setPatientSearchOpen(false);
  };

  const handleAddTest = (test: LabTest) => {
    const item = buildLineItem(test.id, tests);
    if (!item) return;
    setSelectedTests((current) => [...current, item]);
    setTestSearch("");
    setTestSearchOpen(false);
    setInvoiceGenerated(false);
  };

  const handleRemoveTest = (testId: string) => {
    setSelectedTests((current) => current.filter((item) => item.testId !== testId));
    setInvoiceGenerated(false);
  };

  const updateLineDiscount = (testId: string, discountPct: number) => {
    setSelectedTests((current) =>
      current.map((item) => (item.testId === testId ? { ...item, discountPct } : item)),
    );
    setInvoiceGenerated(false);
  };

  const updateLineEnteredPrice = (testId: string, enteredPrice: number) => {
    setSelectedTests((current) =>
      current.map((item) => (item.testId === testId ? { ...item, enteredPrice } : item)),
    );
    setInvoiceGenerated(false);
  };

  const handleCreatePatient = () => {
    setSelectedPatientId("");
    setDesignation("Mr.");
    setSelectedGender("Male");
    setPatientName("");
    setPatientIdInput("");
    setPatientAge("");
    setPatientPhone("");
    setPatientSearch("");
  };

  const handleConfirmOrder = () => {
    if (!selectedPatient && !patientName.trim()) return;
    if (selectedTests.length === 0) return;

    const nextNumber = `ORD-${String(orders.length + 1042).padStart(4, "0")}`;
    const createdAt = new Date().toISOString();

    const orderTests: OrderTest[] = selectedTests.map((item) => ({
      testId: item.testId,
      qty: 1,
      price: item.actualPrice,
      discount: item.discountPct,
      status: "pending",
      assignedTo,
    }));

    const orderSamples: OrderSample[] = [
      {
        id: `SMPL-${Date.now()}`,
        type: "Blood",
        status: "not_collected",
        testIds: selectedTests.map((item) => item.testId),
      },
    ];

    const patientId =
      selectedPatient?.id ?? patientIdInput ?? `PAT-${Date.now().toString().slice(-4)}`;

    const order: Order = {
      id: nextNumber,
      number: nextNumber,
      patientId,
      status: "order_confirmed",
      priority: selectedPriority === "Urgent" ? "urgent" : "normal",
      testCount: selectedTests.length,
      referredBy: selectedDoctor,
      createdAt,
      source: "Walk-in",
      invoiceNo: invoiceGenerated ? `INV-${new Date().getFullYear()}-${orders.length + 1042}` : undefined,
      paymentStatus: "Unpaid",
      tests: orderTests,
      samples: orderSamples,
      timeline: buildTimeline("order_confirmed"),
      totals: {
        subtotal,
        doctorFee,
        discount: discountAmount + lineDiscount,
        gstPct: 18,
        gst,
        total,
        paid: 0,
      },
    };

    addOrder(order);
    navigate({ to: "/lims/orders/$orderId", params: { orderId: order.id } });
  };

  return (
    <div>
      <PageHeader title="Create Order" backTo="/lims/orders" />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
        <div className="grid grid-cols-1 gap-4">
          <SectionCard
            title="Patient Details"
            iconTone="info"
            right={
              <button
                type="button"
                onClick={handleCreatePatient}
                className="text-sm font-semibold text-primary hover:opacity-90"
              >
                + Create Patient
              </button>
            }
          >
            <div ref={patientSearchRef} className="relative mb-5">
              <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setPatientSearchOpen(true);
                  }}
                  onFocus={() => setPatientSearchOpen(true)}
                  placeholder="Search Patient by phone number,name,id.."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>

              {patientSearchOpen && patientResults.length > 0 && patientSearch.trim() && (
                <div className="absolute left-0 right-0 top-12 z-20 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
                  {patientResults.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => handlePatientSelect(patient)}
                      className="flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-muted sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="text-sm font-medium text-foreground">{patient.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {patient.id} · {patient.phone}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {patient.age} · {patient.gender}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Designation">
                <SelectInput value={designation} onChange={setDesignation} options={["Mr.", "Ms.", "Mrs.", "Dr."]} />
              </Field>
              <Field label="Patient Name">
                <input className="input" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
              </Field>
              <Field label="Patient ID">
                <input className="input bg-surface-muted" value={patientIdInput} onChange={(e) => setPatientIdInput(e.target.value)} />
              </Field>
              <Field label="Age">
                <input
                  className="input"
                  inputMode="numeric"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value.replace(/[^\d]/g, ""))}
                />
              </Field>
              <Field label="Gender">
                <SelectInput
                  value={selectedGender}
                  onChange={(value) => setSelectedGender(value as Patient["gender"])}
                  options={["Male", "Female", "Other"]}
                />
              </Field>
              <Field label="Phone">
                <input className="input" value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Referring Doctor" optional>
                  <SelectInput value={selectedDoctor} onChange={setSelectedDoctor} options={referringDoctors} />
                </Field>
              </div>
              <Field label="Priority">
                <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                  {(["Normal", "Urgent", "High"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSelectedPriority(option)}
                      className={cn(
                        "min-w-0 flex-1 rounded-md border px-2.5 py-2 text-center text-[11px] font-medium transition-colors sm:px-4",
                        selectedPriority === option
                          ? "border-[oklch(0.75_0.16_70)] bg-warning-soft text-[oklch(0.5_0.13_70)]"
                          : "border-border bg-surface text-foreground hover:bg-muted",
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Tests">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
              <div ref={testSearchRef} className="relative">
                <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={testSearch}
                    onChange={(e) => {
                      setTestSearch(e.target.value);
                      setTestSearchOpen(true);
                    }}
                    onFocus={() => setTestSearchOpen(true)}
                    placeholder="Search by test name or test code"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>

                {testSearchOpen && availableTests.length > 0 && testSearch.trim() && (
                  <div className="absolute left-0 right-0 top-12 z-20 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
                    {availableTests.map((test) => (
                      <button
                        key={test.id}
                        type="button"
                        onClick={() => handleAddTest(test)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted"
                      >
                        <div>
                          <div className="text-sm font-medium text-foreground">{getDisplayTestName(test)}</div>
                          <div className="text-xs text-muted-foreground">
                            {test.code} · {test.department}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-primary">{formatINR(test.price)}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <SelectInput value={testFilter} onChange={setTestFilter} options={[...TEST_FILTER_OPTIONS]} />
            </div>

            <div className="mt-5 hidden overflow-hidden rounded-lg border border-border md:block">
              <table className="w-full text-sm">
                <thead className="bg-surface-muted">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="w-16 px-3 py-2.5">Sr No.</th>
                    <th className="px-3 py-2.5">Test / Package</th>
                    <th className="w-44 px-3 py-2.5">Price</th>
                    <th className="w-40 px-3 py-2.5">Discount</th>
                    <th className="w-20 px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {selectedTests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                        No tests added yet.
                      </td>
                    </tr>
                  ) : (
                    selectedTests.map((item, index) => (
                      <tr key={item.testId}>
                        <td className="px-3 py-3">{index + 1}</td>
                        <td className="px-3 py-3 font-medium">{item.displayName}</td>
                        <td className="px-3 py-2">
                          <input
                            className="input h-8"
                            value={item.enteredPrice}
                            onChange={(e) => updateLineEnteredPrice(item.testId, Number(e.target.value) || 0)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <SelectInput
                            value={item.discountPct ? `${item.discountPct}%` : "Select"}
                            onChange={(value) =>
                              updateLineDiscount(item.testId, value === "Select" ? 0 : Number(value.replace("%", "")))
                            }
                            options={["Select", ...DISCOUNT_OPTIONS.filter(Boolean).map((value) => `${value}%`)]}
                            small
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveTest(item.testId)}
                            className="rounded-md border border-danger/40 p-1.5 text-danger hover:bg-danger-soft"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-5 space-y-3 md:hidden">
              {selectedTests.length === 0 ? (
                <div className="rounded-lg border border-border bg-surface px-4 py-6 text-center text-sm text-muted-foreground">
                  No tests added yet.
                </div>
              ) : (
                selectedTests.map((item, index) => (
                  <div key={item.testId} className="rounded-lg border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Sr No. {index + 1}
                        </div>
                        <div className="mt-1 text-sm font-medium text-foreground">{item.displayName}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTest(item.testId)}
                        className="rounded-md border border-danger/40 p-1.5 text-danger hover:bg-danger-soft"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="Price">
                        <input
                          className="input"
                          value={item.enteredPrice}
                          onChange={(e) => updateLineEnteredPrice(item.testId, Number(e.target.value) || 0)}
                        />
                      </Field>
                      <Field label="Discount">
                        <SelectInput
                          value={item.discountPct ? `${item.discountPct}%` : "Select"}
                          onChange={(value) =>
                            updateLineDiscount(item.testId, value === "Select" ? 0 : Number(value.replace("%", "")))
                          }
                          options={["Select", ...DISCOUNT_OPTIONS.filter(Boolean).map((value) => `${value}%`)]}
                        />
                      </Field>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:sticky xl:top-4 xl:self-start">
          <SectionCard title="" className="h-fit xl:min-h-[min(30dvh,22rem)]">
            <div className="grid grid-cols-1 gap-4">
              <Field label="Assign To">
                <SelectInput value={assignedTo} onChange={setAssignedTo} options={[...ASSIGNEE_OPTIONS]} />
              </Field>
              <Field label="Billing Date">
                <DateTimeField value={billingDateRaw} onChange={setBillingDateRaw} />
              </Field>
              <Field label="Note">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Any special instructions..."
                  className="min-h-40 w-full rounded-md border border-border bg-surface p-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Summary" className="h-fit xl:min-h-[min(34dvh,25rem)]">
            <div className="space-y-3 text-sm">
              <SummaryRow label="Total Items" value={`${selectedTests.length} selected`} />
              <SummaryRow label="Doctor Fee" value={<SummaryInput value={doctorFee} onChange={setDoctorFee} />} />
              <SummaryRow label="Discount" value={<SummaryInput value={discountAmount} onChange={setDiscountAmount} />} />
              <SummaryRow label="Line Discount" value={formatINR(lineDiscount)} />
              <SummaryRow label="Subtotal" value={formatINR(subtotal)} />
              <SummaryRow label="GST (18%)" value={formatINR(gst)} />

              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-xl font-bold text-primary">{formatINR(total)}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (hasTests) setInvoiceGenerated((current) => !current);
                }}
                disabled={!hasTests}
                className="mt-4 w-full rounded-md border border-primary py-2.5 text-sm font-semibold text-primary hover:bg-primary-soft disabled:opacity-50"
              >
                {invoiceGenerated ? "View Invoice" : "Generate Invoice"}
              </button>

              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={!hasTests}
                className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                Confirm Order
              </button>

              <div className="text-xs text-muted-foreground">Billing Date: {billingDateLabel}</div>
            </div>
          </SectionCard>
        </div>
      </div>

      <style>{`.input{height:2.5rem;width:100%;border-radius:0.375rem;border:1px solid var(--color-border);background:var(--color-surface);padding:0 0.75rem;font-size:0.875rem;outline:none}.input:focus{border-color:var(--color-primary)}`}</style>
    </div>
  );
}

function Field({
  label,
  children,
  optional,
}: {
  label: ReactNode;
  children: ReactNode;
  optional?: boolean;
}) {
  return (
    <div>
      <FieldLabel optional={optional}>{label}</FieldLabel>
      {children}
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
  small = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  small?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn("input appearance-none bg-surface pr-9", small && "h-8 text-xs")}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

function DateTimeField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input pr-10"
      />
      <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function SummaryInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      className="input h-8 w-24 text-right"
    />
  );
}

function buildLineItem(testId: string, tests: LabTest[]): SelectedLineItem | null {
  const test = tests.find((item) => item.id === testId);
  if (!test) return null;

  return {
    testId: test.id,
    displayName: getDisplayTestName(test),
    actualPrice: test.price,
    enteredPrice: 0,
    discountPct: 0,
  };
}

function getDisplayTestName(test: LabTest) {
  if (test.id === "CBC-001") return "Complete Blood Count (CBC)";
  if (test.id === "LFT-001") return "LIVER FUNCTION TEST (LFT)";
  if (test.shortName) return `${test.name} (${test.shortName})`;
  return test.name;
}

function formatBillingDate(rawValue: string) {
  const date = new Date(rawValue);
  if (Number.isNaN(date.getTime())) return "";

  const datePart = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${datePart}, ${timePart}`;
}
