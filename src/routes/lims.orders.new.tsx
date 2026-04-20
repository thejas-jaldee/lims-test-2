import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search, Plus, Trash2, Minus, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  patients,
  labTests,
  referringDoctors,
  formatINR,
  type Patient,
} from "@/data/lims";
import { cn } from "@/lib/utils";

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
  discount: string;
}

function CreateOrderPage() {
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [search, setSearch] = useState("");
  const [testSearch, setTestSearch] = useState("");
  const [selected, setSelected] = useState<SelectedTest[]>([]);
  const [doctor, setDoctor] = useState(referringDoctors[0]);
  const [priority, setPriority] = useState<"normal" | "urgent">("urgent");
  const [showAllTests, setShowAllTests] = useState(false);
  const [viewMore, setViewMore] = useState(false);

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
    if (showAllTests) return labTests;
    if (!q) return [];
    return labTests.filter(
      (t) => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q),
    );
  }, [testSearch, showAllTests]);

  const subtotal = selected.reduce((acc, s) => acc + s.qty * s.price, 0);
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  const addTest = (id: string) => {
    if (selected.some((s) => s.testId === id)) return;
    const t = labTests.find((x) => x.id === id);
    if (!t) return;
    setSelected((arr) => [...arr, { testId: id, qty: 1, price: t.price, discount: "Select" }]);
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
            <button className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
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
                  onClick={() => setShowAllTests((v) => !v)}
                  className="inline-flex items-center justify-center rounded-md bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90"
                >
                  View All Tests
                </button>
              </div>

              {testResults.length > 0 && (
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
                        const t = labTests.find((x) => x.id === s.testId)!;
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
                              <button className="inline-flex w-28 items-center justify-between rounded-md border border-border px-2 py-1 text-sm">
                                {s.discount}
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
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
                    defaultValue={0}
                    className="w-20 rounded-md border border-border bg-surface px-2 py-1 text-right text-sm outline-none"
                  />
                }
              />
              <Row
                label="Discount"
                value={
                  <input
                    defaultValue={0}
                    className="w-20 rounded-md border border-border bg-surface px-2 py-1 text-right text-sm outline-none"
                  />
                }
              />
              <Row label="Subtotal" value={formatINR(subtotal)} />
              <Row label="GST (18%)" value={formatINR(gst)} />
            </dl>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-base font-bold">{formatINR(total)}</span>
            </div>

            <button className="mt-4 w-full rounded-md border border-primary py-2.5 text-sm font-semibold text-primary hover:bg-primary-soft">
              Generate Invoice
            </button>
            <button
              onClick={() => navigate({ to: "/lims/orders/$orderId", params: { orderId: "ORD-1041" } })}
              className="mt-2 w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Confirm Order
            </button>
          </section>

          <Link
            to="/lims/orders"
            className="text-center text-xs text-muted-foreground hover:text-foreground"
          >
            ← Back to orders
          </Link>
        </aside>
      </div>
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
