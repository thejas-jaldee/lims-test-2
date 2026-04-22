import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Search,
  Plus,
  Trash2,
  Minus,
  ChevronDown,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  referringDoctors,
  formatINR,
  type Order,
  type OrderSample,
  type OrderTest,
  type Patient,
} from "@/data/lims";
import { cn } from "@/lib/utils";
import { buildTimeline, useLimsStore } from "@/store/limsStore";

export const Route = createFileRoute("/lims/orders/new")({
  head: () => ({
    meta: [
      { title: "Create Order — LIMS" },
      { name: "description", content: "Create a new lab order: pick patient, add tests, confirm." },
    ],
  }),
  component: CreateOrderPage,
});

interface SelectedTest {
  testId: string;
  qty: number;
  price: number;
  discount: number;
}

function CreateOrderPage() {
  const navigate = useNavigate();
  const patients = useLimsStore((s) => s.patients);
  const tests = useLimsStore((s) => s.tests);
  const orders = useLimsStore((s) => s.orders);
  const addOrder = useLimsStore((s) => s.addOrder);
  const addPatient = useLimsStore((s) => s.addPatient);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [search, setSearch] = useState("");
  const [testSearch, setTestSearch] = useState("");
  const [selected, setSelected] = useState<SelectedTest[]>([]);
  const [doctor, setDoctor] = useState(referringDoctors[0]);
  const [priority, setPriority] = useState<"normal" | "urgent">("urgent");
  const [showAllTests, setShowAllTests] = useState(false);
  const [viewMore, setViewMore] = useState(false);
  const [doctorFee, setDoctorFee] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [testPage, setTestPage] = useState(1);

  const patientResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return patients
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.phone.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [search]);

  const testResults = useMemo(() => {
    const q = testSearch.trim().toLowerCase();
    if (!q) return [];
    return tests.filter(
      (t) => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q),
    );
  }, [testSearch, tests]);

  const departments = useMemo(
    () => ["all", ...Array.from(new Set(tests.map((t) => t.department)))],
    [tests],
  );

  const filteredDialogTests = useMemo(() => {
    const q = testSearch.trim().toLowerCase();
    return tests.filter((t) => {
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        (t.shortName?.toLowerCase().includes(q) ?? false);
      const matchesDepartment = departmentFilter === "all" || t.department === departmentFilter;
      return matchesSearch && matchesDepartment;
    });
  }, [departmentFilter, testSearch, tests]);

  const TESTS_PER_PAGE = 9;
  const totalDialogPages = Math.max(1, Math.ceil(filteredDialogTests.length / TESTS_PER_PAGE));
  const safeDialogPage = Math.min(testPage, totalDialogPages);
  const dialogTests = filteredDialogTests.slice(
    (safeDialogPage - 1) * TESTS_PER_PAGE,
    safeDialogPage * TESTS_PER_PAGE,
  );

  const itemDiscountTotal = selected.reduce((acc, s) => acc + s.discount, 0);
  const subtotal = selected.reduce((acc, s) => acc + s.qty * s.price, 0);
  const taxableSubtotal = Math.max(subtotal + doctorFee - itemDiscountTotal - discount, 0);
  const gst = taxableSubtotal * 0.18;
  const total = taxableSubtotal + gst;
  const totalItems = selected.reduce((acc, s) => acc + s.qty, 0);

  const addTest = (id: string) => {
    if (selected.some((s) => s.testId === id)) return;
    const t = tests.find((x) => x.id === id);
    if (!t) return;
    setSelected((arr) => [...arr, { testId: id, qty: 1, price: t.price, discount: 0 }]);
  };

  const createPatientFromSearch = () => {
    const input = search.trim();
    if (!input) {
      toast.error("Enter a patient name or phone number");
      return;
    }

    const maxPatientNo = patients.reduce((max, current) => {
      const match = current.id.match(/PAT-(\d+)/);
      const value = match ? Number(match[1]) : 0;
      return Math.max(max, value);
    }, 0);

    const digits = input.replace(/\D/g, "");
    const nextPatient: Patient = {
      id: `PAT-${maxPatientNo + 1}`,
      name: /\D/.test(input) ? input : `Patient ${maxPatientNo + 1}`,
      age: 30,
      gender: "Other",
      phone: digits ? `+91 ${digits.slice(0, 5)} ${digits.slice(5, 10)}`.trim() : "+91 00000 00000",
      email: `patient${maxPatientNo + 1}@example.com`,
      address: "Address to be updated",
    };

    addPatient(nextPatient);
    setPatient(nextPatient);
    setSearch(nextPatient.name);
    toast.success("Patient created");
  };

  const getNextOrderNumber = () => {
    const maxOrderNo = orders.reduce((max, order) => {
      const match = order.number.match(/ORD-(\d+)/);
      const value = match ? Number(match[1]) : 0;
      return Math.max(max, value);
    }, 0);
    return maxOrderNo + 1;
  };

  const buildSamples = (orderTests: OrderTest[]): OrderSample[] => {
    const grouped = new Map<
      string,
      { type: string; testIds: string[]; containers: string[]; instructions: string[] }
    >();

    orderTests.forEach((orderTest) => {
      const test = tests.find((item) => item.id === orderTest.testId);
      if (!test) return;

      const groupKey = `${test.specimen}::${test.container ?? "default"}`;
      const existing = grouped.get(groupKey);
      const instructions = [
        `Collect specimen for ${test.name}.`,
        test.container ? `Use ${test.container}.` : "Use standard collection protocol.",
        test.shelfLife ? `Process within ${test.shelfLife}.` : "Process as per lab SOP.",
      ];

      if (existing) {
        existing.testIds.push(orderTest.testId);
        instructions.forEach((instruction) => {
          if (!existing.instructions.includes(instruction)) {
            existing.instructions.push(instruction);
          }
        });
        if (test.container && !existing.containers.includes(test.container)) {
          existing.containers.push(test.container);
        }
        return;
      }

      grouped.set(groupKey, {
        type: test.specimen,
        testIds: [orderTest.testId],
        containers: test.container ? [test.container] : [],
        instructions,
      });
    });

    return Array.from(grouped.values()).map((sample, index) => ({
      id: `SMPL-${Date.now()}-${index + 1}`,
      type: sample.type,
      status: "not_collected",
      testIds: sample.testIds,
      container: sample.containers.join(", ") || undefined,
      volume:
        sample.type.toLowerCase() === "urine"
          ? "30 ml"
          : sample.type.toLowerCase() === "blood"
            ? "3-5 ml"
            : undefined,
      fasting: sample.type.toLowerCase() === "blood" ? "As advised by clinician" : "Not required",
      instructions: sample.instructions,
    }));
  };

  const createOrder = () => {
    if (!patient) {
      toast.error("Select a patient to continue");
      return null;
    }

    if (selected.length === 0) {
      toast.error("Add at least one test");
      return null;
    }

    const nextOrderNumber = getNextOrderNumber();
    const createdAt = new Date().toISOString();
    const orderId = `ORD-${nextOrderNumber}`;
    const invoiceNo = `INV-2026-${nextOrderNumber}`;
    const orderTests: OrderTest[] = selected.map((item) => ({
      testId: item.testId,
      qty: item.qty,
      price: item.price,
      discount: item.discount,
      status: "pending",
    }));

    const nextOrder: Order = {
      id: orderId,
      number: orderId,
      patientId: patient.id,
      status: "order_confirmed",
      priority,
      testCount: totalItems,
      referredBy: doctor,
      createdAt,
      source: "Walk-in",
      invoiceNo,
      paymentStatus: "Unpaid",
      tests: orderTests,
      samples: buildSamples(orderTests),
      timeline: buildTimeline("order_confirmed"),
      invoiceActivity: [
        {
          id: `INV-ACT-${nextOrderNumber}-1`,
          type: "created",
          title: "Invoice generated",
          description: "Invoice created for newly registered order.",
          by: "Reception",
          at: createdAt,
        },
      ],
      totals: {
        subtotal,
        doctorFee,
        discount: itemDiscountTotal + discount,
        gstPct: 18,
        gst,
        total,
        paid: 0,
      },
    };

    addOrder(nextOrder);
    return nextOrder;
  };

  const handleCreateOrder = (destination: "details" | "invoice") => {
    const order = createOrder();
    if (!order) return;

    toast.success(destination === "invoice" ? "Invoice generated" : "Order created");
    navigate({
      to:
        destination === "invoice"
          ? "/lims/orders/$orderId/invoice"
          : "/lims/orders/$orderId",
      params: { orderId: order.id },
    });
  };

  if (!patient) {
    return (
      <div>
        <PageHeader title="Create Order" backTo="/lims/orders" />
        <section className="rounded-2xl border border-border bg-surface p-6">
          <div className="text-base font-semibold">Find Patient</div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 py-2.5">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Patient by phone number, name, id.."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <button
              type="button"
              onClick={createPatientFromSearch}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Create Patient
            </button>
          </div>

          {patientResults.length > 0 && (
            <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
              {patientResults.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setPatient(p)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success-soft text-xs font-semibold text-success">
                        {p.name
                          .split(" ")
                          .map((s) => s[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {p.id} · {p.age} yr · {p.gender}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{p.phone}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Complete Order" backTo="/lims/orders" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-border bg-surface p-5">
            <div className="text-lg font-semibold">Billing &amp; Confirmation</div>
            <div className="text-sm text-muted-foreground">
              Review all details before placing the order.
            </div>

            <div className="mt-5 rounded-xl border border-border bg-surface p-4">
              <div className="text-sm font-semibold">Tests</div>
              <div className="mt-3 flex flex-col gap-3 md:flex-row">
                <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 py-2.5">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={testSearch}
                    onChange={(e) => {
                      setTestSearch(e.target.value);
                      setShowAllTests(false);
                    }}
                    placeholder="Search by test/Package name or test code.."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAllTests(true);
                    setTestPage(1);
                  }}
                  className="inline-flex items-center justify-center rounded-md bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90"
                >
                  View All Tests
                </button>
              </div>

              {!showAllTests && testResults.length > 0 && (
                <ul className="mt-3 max-h-56 divide-y divide-border overflow-y-auto rounded-md border border-border">
                  {testResults.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => addTest(t.id)}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                      >
                        <div>
                          <div className="font-medium">{t.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {t.code} · {t.department}
                          </div>
                        </div>
                        <span className="text-sm font-semibold">{formatINR(t.price)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-5">
                <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                  Selected Tests
                </div>
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted text-left text-xs font-medium text-muted-foreground">
                        <th className="px-3 py-2">Sr No.</th>
                        <th className="px-3 py-2">Test / Package</th>
                        <th className="px-3 py-2">Qty</th>
                        <th className="px-3 py-2">Price</th>
                        <th className="px-3 py-2">Discount</th>
                        <th className="px-3 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                      {selected.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                            No tests selected yet — search above to add.
                          </td>
                        </tr>
                      )}
                      {selected.map((s, i) => {
                        const t = tests.find((x) => x.id === s.testId)!;
                        return (
                          <tr key={s.testId}>
                            <td className="px-3 py-3">{i + 1}</td>
                            <td className="px-3 py-3 font-medium">{t.name}</td>
                            <td className="px-3 py-3">
                              <div className="inline-flex items-center rounded-md border border-border">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelected((arr) =>
                                      arr.map((x) =>
                                        x.testId === s.testId
                                          ? { ...x, qty: Math.max(1, x.qty - 1) }
                                          : x,
                                      ),
                                    )
                                  }
                                  className="px-2 py-1 text-primary"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <input
                                  value={s.qty}
                                  onChange={(e) =>
                                    setSelected((arr) =>
                                      arr.map((x) =>
                                        x.testId === s.testId
                                          ? { ...x, qty: Math.max(1, Number(e.target.value) || 1) }
                                          : x,
                                      ),
                                    )
                                  }
                                  className="w-10 border-x border-border bg-transparent px-1 py-1 text-center text-sm outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelected((arr) =>
                                      arr.map((x) =>
                                        x.testId === s.testId ? { ...x, qty: x.qty + 1 } : x,
                                      ),
                                    )
                                  }
                                  className="px-2 py-1 text-primary"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <input
                                value={s.price}
                                onChange={(e) =>
                                  setSelected((arr) =>
                                    arr.map((x) =>
                                      x.testId === s.testId
                                        ? { ...x, price: Number(e.target.value) || 0 }
                                        : x,
                                    ),
                                  )
                                }
                                className="w-24 rounded-md border border-border bg-surface px-2 py-1 text-sm outline-none"
                              />
                            </td>
                            <td className="px-3 py-3">
                              <input
                                type="number"
                                min={0}
                                value={s.discount}
                                onChange={(e) =>
                                  setSelected((arr) =>
                                    arr.map((x) =>
                                      x.testId === s.testId
                                        ? { ...x, discount: Math.max(0, Number(e.target.value) || 0) }
                                        : x,
                                    ),
                                  )
                                }
                                className="w-24 rounded-md border border-border bg-surface px-2 py-1 text-sm outline-none"
                              />
                            </td>
                            <td className="px-3 py-3">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelected((arr) => arr.filter((x) => x.testId !== s.testId))
                                }
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-danger/40 text-danger hover:bg-danger-soft"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl border border-border bg-surface p-4 md:grid-cols-2">
              <div>
                <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
                  Referring Doctor <span className="ml-1 text-[10px] font-normal">OPTIONAL</span>
                </div>
                <button className="inline-flex w-full items-center justify-between rounded-md border border-border bg-surface px-3 py-2.5 text-sm">
                  {doctor}
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {referringDoctors.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDoctor(d)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs",
                        d === doctor
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
                  Priority
                </div>
                <div className="inline-flex gap-2">
                  {(["normal", "urgent"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={cn(
                        "rounded-md border px-4 py-2 text-sm font-medium capitalize",
                        priority === p
                          ? p === "urgent"
                            ? "border-danger bg-danger-soft text-danger"
                            : "border-primary bg-primary-soft text-primary"
                          : "border-border text-foreground hover:bg-muted",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <section className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Patient Details</div>
              <button
                onClick={() => setViewMore((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary"
              >
                View {viewMore ? "Less" : "More"}{" "}
                <ChevronDown className={cn("h-3.5 w-3.5", viewMore && "rotate-180")} />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-soft text-sm font-semibold text-success">
                {patient.name
                  .split(" ")
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div>
                <div className="text-sm font-semibold">{patient.name}</div>
                <div className="text-xs text-muted-foreground">
                  {patient.age} yr · {patient.gender}
                </div>
              </div>
            </div>
            {viewMore && (
              <dl className="mt-4 space-y-2 text-sm">
                <Row label="Patient ID" value={<span className="text-info">{patient.id}</span>} />
                <Row label="Phone" value={patient.phone} />
                <Row label="Email" value={patient.email} />
              </dl>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <div className="text-sm font-semibold">Billing Summary</div>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Total Items" value={`${selected.length} selected`} />
              <Row
                label="Doctor Fee"
                value={
                  <input
                    type="number"
                    min={0}
                    value={doctorFee}
                    onChange={(e) => setDoctorFee(Math.max(0, Number(e.target.value) || 0))}
                    className="w-20 rounded-md border border-border bg-surface px-2 py-1 text-right text-sm outline-none"
                  />
                }
              />
              <Row
                label="Discount"
                value={
                  <input
                    type="number"
                    min={0}
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                    className="w-20 rounded-md border border-border bg-surface px-2 py-1 text-right text-sm outline-none"
                  />
                }
              />
              <Row label="Subtotal" value={formatINR(subtotal)} />
              <Row label="Item Discount" value={formatINR(itemDiscountTotal)} />
              <Row label="GST (18%)" value={formatINR(gst)} />
            </dl>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-base font-bold">{formatINR(total)}</span>
            </div>

            <button
              type="button"
              onClick={() => handleCreateOrder("invoice")}
              disabled={!patient || selected.length === 0}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-primary py-2.5 text-sm font-semibold text-primary hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              Generate Invoice
            </button>
            <button
              type="button"
              onClick={() => handleCreateOrder("details")}
              disabled={!patient || selected.length === 0}
              className="mt-2 w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirm Order
            </button>
          </section>
        </aside>
      </div>

      <TestSelectionDialog
        open={showAllTests}
        tests={dialogTests}
        selectedIds={selected.map((item) => item.testId)}
        total={filteredDialogTests.length}
        page={safeDialogPage}
        totalPages={totalDialogPages}
        departments={departments}
        search={testSearch}
        department={departmentFilter}
        onClose={() => setShowAllTests(false)}
        onSearchChange={(value) => {
          setTestSearch(value);
          setTestPage(1);
        }}
        onDepartmentChange={(value) => {
          setDepartmentFilter(value);
          setTestPage(1);
        }}
        onToggle={(id) => {
          const existing = selected.some((item) => item.testId === id);
          if (existing) {
            setSelected((arr) => arr.filter((item) => item.testId !== id));
            return;
          }
          addTest(id);
        }}
        onPageChange={setTestPage}
      />
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

function TestSelectionDialog({
  open,
  tests,
  selectedIds,
  total,
  page,
  totalPages,
  departments,
  search,
  department,
  onClose,
  onSearchChange,
  onDepartmentChange,
  onToggle,
  onPageChange,
}: {
  open: boolean;
  tests: Array<{ id: string; name: string; department: string }>;
  selectedIds: string[];
  total: number;
  page: number;
  totalPages: number;
  departments: string[];
  search: string;
  department: string;
  onClose: () => void;
  onSearchChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onToggle: (id: string) => void;
  onPageChange: (value: number) => void;
}) {
  if (!open) return null;

  const visiblePages =
    totalPages <= 6
      ? Array.from({ length: totalPages }, (_, index) => index + 1)
      : [1, 2, null, page, null, totalPages];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-2 backdrop-blur-[2px] sm:p-3">
      <div className="flex max-h-[88vh] w-full max-w-[min(94vw,640px)] flex-col overflow-hidden rounded-[16px] bg-background shadow-[0_20px_56px_rgba(15,23,42,0.2)] sm:rounded-[18px]">
        <div className="flex items-start justify-between px-4 pb-3 pt-4 sm:px-5 sm:pb-4 sm:pt-5">
          <div className="text-[14px] font-semibold tracking-tight text-foreground sm:text-[15px]">
            Select Test
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#ded7cb] text-[#786f62] transition-colors hover:bg-muted sm:h-9 sm:w-9"
          >
            <X className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>

        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex h-10 flex-1 items-center gap-2 rounded-[10px] border border-[#ddd8cf] bg-background px-3 sm:h-11 sm:px-4">
              <Search className="h-4 w-4 text-[#c0bab0] sm:h-5 sm:w-5" strokeWidth={2} />
              <input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search by test name or test code"
                className="min-w-0 flex-1 bg-transparent text-[12px] font-normal tracking-tight outline-none placeholder:text-[#a8a293] sm:text-[13px]"
              />
            </div>

            <div className="relative w-full lg:w-[210px]">
              <select
                value={department}
                onChange={(e) => onDepartmentChange(e.target.value)}
                className="h-10 w-full appearance-none rounded-[10px] border border-[#dde3ef] bg-background px-3 pr-8 text-[12px] tracking-tight text-foreground outline-none sm:h-11 sm:px-4 sm:pr-10 sm:text-[13px]"
              >
                <option value="all">Select By Department</option>
                {departments
                  .filter((item) => item !== "all")
                  .map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b8190] sm:h-5 sm:w-5" />
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden border-t border-[#eef1f5]">
          <div className="hidden bg-[#eef1f4] md:block">
            <div className="grid grid-cols-[40px_72px_minmax(0,1fr)_120px] items-center px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.02em] text-[#777f8b]">
              <div />
              <div>Select</div>
              <div>Test Name</div>
              <div>Department</div>
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto bg-background">
            <div className="hidden md:block">
              {tests.map((test) => {
                const checked = selectedIds.includes(test.id);
                return (
                  <div
                    key={test.id}
                    className="grid grid-cols-[40px_72px_minmax(0,1fr)_120px] items-center border-b border-[#edf0f4] px-4 py-3"
                  >
                    <div className="grid w-[8px] grid-cols-2 gap-0.5 text-foreground">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <span key={index} className="h-[2px] w-[2px] rounded-full bg-current" />
                      ))}
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => onToggle(test.id)}
                        className={cn(
                          "inline-flex h-[24px] w-[24px] items-center justify-center rounded-[7px] border-2 transition-colors",
                          checked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-primary bg-background text-transparent",
                        )}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.8"
                        >
                          <path d="M5 13.2l4.4 4.4L19 8" />
                        </svg>
                      </button>
                    </div>

                    <div className="truncate pr-4 text-[11px] font-medium tracking-tight text-foreground sm:text-[12px]">
                      {test.name}
                    </div>
                    <div className="text-[11px] tracking-tight text-foreground sm:text-[12px]">
                      {test.department}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="md:hidden">
              {tests.map((test) => {
                const checked = selectedIds.includes(test.id);
                return (
                  <div
                    key={test.id}
                    className="border-b border-[#edf0f4] px-3 py-2.5"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-1.5 grid w-[8px] grid-cols-2 gap-0.5 text-foreground">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <span key={index} className="h-[2px] w-[2px] rounded-full bg-current" />
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggle(test.id)}
                        className={cn(
                          "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border-2 transition-colors",
                          checked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-primary bg-background text-transparent",
                        )}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.8"
                        >
                          <path d="M5 13.2l4.4 4.4L19 8" />
                        </svg>
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium tracking-tight text-foreground">
                          {test.name}
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {test.department}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex flex-col gap-2 text-[11px] text-[#647286] sm:flex-row sm:items-center sm:justify-between sm:text-[12px]">
            <div>Showing {Math.min(total, page * 9)} of {total} tests</div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-2 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>

              {visiblePages.map((item, index) =>
                item === null ? (
                  <span key={`ellipsis-${index}`}>...</span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onPageChange(item)}
                    className={cn(
                      "min-w-4",
                      item === page ? "font-semibold text-primary" : "text-[#647286]",
                    )}
                  >
                    {item}
                  </button>
                ),
              )}

              <button
                type="button"
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-2 disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center justify-center rounded-[10px] border border-[#ddd7cb] bg-background px-4 text-[12px] font-medium text-[#61584d] transition-colors hover:bg-muted sm:h-10 sm:px-5 sm:text-[13px]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center justify-center rounded-[10px] bg-primary px-5 text-[12px] font-semibold text-primary-foreground hover:opacity-95 sm:h-10 sm:px-6 sm:text-[13px]"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
