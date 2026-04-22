import { createFileRoute, Link, Outlet, notFound, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Edit3,
  FileText,
  ChevronDown,
  MoreHorizontal,
  UserPlus,
  Eye,
  CheckCheck,
  Beaker,
  ClipboardList,
  Send,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Barcode } from "@/components/lims/Barcode";
import { StatusPill } from "@/components/lims/StatusPill";
import { PatientCard } from "@/components/lims/PatientCard";
import { Timeline } from "@/components/lims/Timeline";
import { SampleCollectionDrawer } from "@/components/lims/SampleCollectionDrawer";
import { Modal } from "@/components/lims/Modal";
import {
  getPatient,
  getTest,
  orderStatusMeta,
  testStatusMeta,
  formatDateTime,
  type Order,
  type OrderSample,
  type OrderTest,
  type TestStatus,
} from "@/data/lims";
import { useLimsStore } from "@/store/limsStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lims/orders/$orderId")({
  head: ({ params }) => ({
    meta: [
      { title: `Order ${params.orderId} — LIMS` },
      { name: "description", content: `Lab order ${params.orderId} — samples, tests and timeline.` },
    ],
  }),
  loader: ({ params }): { orderId: string } => {
    const order = useLimsStore.getState().getOrder(params.orderId);
    if (!order) throw notFound();
    return { orderId: params.orderId };
  },
  component: OrderDetailsPage,
  notFoundComponent: () => (
    <div className="p-8 text-center">
      <p className="text-sm text-muted-foreground">Order not found.</p>
      <Link to="/lims/orders" className="mt-2 inline-block text-sm font-medium text-primary">
        Back to orders
      </Link>
    </div>
  ),
});

type BulkAction = "collect" | "enter" | "approve" | "publish";

const bulkActions: Array<{ key: BulkAction; label: string; icon: typeof Beaker }> = [
  { key: "collect", label: "Collect Samples", icon: Beaker },
  { key: "enter", label: "Enter All Tests Results", icon: ClipboardList },
  { key: "approve", label: "Approve Tests Results", icon: CheckCheck },
  { key: "publish", label: "Publish All Tests Report", icon: Send },
];

function OrderDetailsPage() {
  const { orderId } = Route.useLoaderData();
  const navigate = useNavigate();
  const location = useLocation();
  const order = useLimsStore((s) => s.orders.find((o) => o.id === orderId || o.number === orderId)) as Order;
  const collectSample = useLimsStore((s) => s.collectSample);
  const bulkSet = useLimsStore((s) => s.bulkSetTestStatus);
  const approveAll = useLimsStore((s) => s.approveAll);
  const publishAll = useLimsStore((s) => s.publishAll);

  const patient = getPatient(order.patientId)!;
  const meta = orderStatusMeta[order.status];
  const canonicalBasePath = `/lims/orders/${order.id}`;
  const legacyBasePath = `/lims/orders/${order.number}`;
  const isNestedChildRoute =
    location.pathname !== canonicalBasePath && location.pathname !== legacyBasePath;
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [drawerSample, setDrawerSample] = useState<OrderSample | null>(null);
  const [sampleDetails, setSampleDetails] = useState<OrderSample | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [assignFor, setAssignFor] = useState<string | null>(null);

  const eligibleTestIds = useMemo(() => {
    if (!bulkAction) return [];
    if (bulkAction === "enter")
      return order.tests.filter((t) => t.status === "in_progress" || t.status === "pending").map((t) => t.testId);
    if (bulkAction === "approve")
      return order.tests.filter((t) => t.status === "result_entered").map((t) => t.testId);
    if (bulkAction === "publish")
      return order.tests.filter((t) => t.status === "result_approved").map((t) => t.testId);
    if (bulkAction === "collect")
      return order.tests
        .filter((t) => order.samples.some((s) => s.testIds.includes(t.testId) && s.status !== "collected"))
        .map((t) => t.testId);
    return [];
  }, [bulkAction, order]);

  const openBulk = (action: BulkAction) => {
    setBulkOpen(false);
    setBulkAction(action);
    setSelectedTestIds([]);
  };

  const runBulk = () => {
    if (!bulkAction || selectedTestIds.length === 0) {
      toast.error("Select at least one test");
      return;
    }
    if (bulkAction === "collect") {
      const samples = order.samples.filter(
        (s) => s.status !== "collected" && s.testIds.some((id) => selectedTestIds.includes(id)),
      );
      samples.forEach((s) => collectSample(order.id, s.id, "Tech. Sreeja R."));
      toast.success(`Collected ${samples.length} sample(s)`);
    } else if (bulkAction === "enter") {
      // open multi-entry view by navigating to first test
      navigate({
        to: "/lims/orders/$orderId/result/$testId",
        params: { orderId: order.id, testId: selectedTestIds[0] },
      });
      // mark all as result_entered after demo entry — for bulk we shortcut:
      const targetStatus: TestStatus = "result_entered";
      bulkSet(order.id, selectedTestIds, targetStatus);
      toast.success(`${selectedTestIds.length} result(s) marked entered`);
    } else if (bulkAction === "approve") {
      bulkSet(order.id, selectedTestIds, "result_approved");
      toast.success(`${selectedTestIds.length} result(s) approved`);
    } else if (bulkAction === "publish") {
      bulkSet(order.id, selectedTestIds, "result_published");
      toast.success(`${selectedTestIds.length} report(s) published`);
    }
    setBulkAction(null);
    setSelectedTestIds([]);
  };

  if (isNestedChildRoute) {
    return <Outlet />;
  }

  return (
    <div>
      <PageHeader title="Order Details" backTo="/lims/orders" />

      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold">Order {order.number}</h2>
              <StatusPill tone={meta.tone} label={meta.label} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>{formatDateTime(order.createdAt)}</span>
              <span className="flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                Visit Type: <span className="font-medium text-foreground">{order.source}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                Patient ID: <span className="font-medium text-info">{patient.id}</span>
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <Barcode value={`${order.number}-${patient.id.replace("PAT-", "")}`} />
            <button className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted">
              <Edit3 className="h-4 w-4" /> Edit Order
            </button>
            <Link
              to="/lims/orders/$orderId/invoice"
              params={{ orderId: order.id }}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-foreground px-4 text-sm font-semibold text-background hover:opacity-90"
            >
              <FileText className="h-4 w-4" /> View Invoice
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Beaker className="h-5 w-5" />
              </div>
              <div>
                <div className="text-base font-semibold text-foreground">Samples &amp; Tests</div>
                <div className="text-xs">
                  <span className="text-muted-foreground">Priority: </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 font-medium",
                      order.priority === "urgent" ? "text-danger" : "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        order.priority === "urgent" ? "bg-danger" : "bg-muted-foreground",
                      )}
                    />
                    {order.priority === "urgent" ? "Urgent" : "Normal"}
                  </span>
                </div>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setBulkOpen((v) => !v)}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-foreground px-3 text-sm font-semibold text-background"
              >
                Complete All <ChevronDown className="h-4 w-4" />
              </button>
              {bulkOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setBulkOpen(false)} />
                  <div className="absolute right-0 top-12 z-20 w-60 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
                    {bulkActions.map((a) => (
                      <button
                        key={a.key}
                        onClick={() => openBulk(a.key)}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted"
                      >
                        <a.icon className="h-4 w-4 text-muted-foreground" /> {a.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4">
            {order.samples.map((s) => (
              <SampleCard
                key={s.id}
                sample={s}
                order={order}
                onCollect={() => setDrawerSample(s)}
                onViewDetails={() => setSampleDetails(s)}
                onAssignTest={(tid) => setAssignFor(tid)}
              />
            ))}
            {order.samples.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                No samples added to this order yet.
              </div>
            )}
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <section className="rounded-2xl border border-border bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">Patient</div>
              <button
                onClick={() => setProfileOpen(true)}
                className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
              >
                View Profile
              </button>
            </div>
            <PatientCard patient={patient} />
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <div className="mb-4 text-sm font-semibold">Order Timeline</div>
            <Timeline events={order.timeline} />
          </section>
        </aside>
      </div>

      {/* Bulk action modal */}
      <Modal
        open={!!bulkAction}
        onClose={() => setBulkAction(null)}
        title={bulkActions.find((a) => a.key === bulkAction)?.label ?? "Select Tests"}
        width="md"
        footer={
          <>
            <button
              onClick={() => setBulkAction(null)}
              className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={runBulk}
              disabled={selectedTestIds.length === 0}
              className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              Confirm ({selectedTestIds.length})
            </button>
          </>
        }
      >
        <div className="p-5">
          {eligibleTestIds.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No tests eligible for this action.
            </div>
          ) : (
            <>
              <label className="flex items-center gap-2 border-b border-border pb-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={selectedTestIds.length === eligibleTestIds.length}
                  onChange={(e) => setSelectedTestIds(e.target.checked ? eligibleTestIds : [])}
                />
                <span className="text-sm font-semibold">
                  Select All ({eligibleTestIds.length} eligible)
                </span>
              </label>
              <ul className="mt-2 divide-y divide-border">
                {eligibleTestIds.map((tid) => {
                  const t = getTest(tid);
                  if (!t) return null;
                  const checked = selectedTestIds.includes(tid);
                  return (
                    <li key={tid} className="flex items-center gap-2 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={checked}
                        onChange={(e) =>
                          setSelectedTestIds((s) =>
                            e.target.checked ? [...s, tid] : s.filter((x) => x !== tid),
                          )
                        }
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{t.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {t.code} · {t.department}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </Modal>

      {/* Sample details modal */}
      <Modal
        open={!!sampleDetails}
        onClose={() => setSampleDetails(null)}
        title="Sample Details"
        width="md"
      >
        {sampleDetails && (
          <div className="space-y-3 p-5 text-sm">
            <Row label="Sample ID" value={sampleDetails.id} />
            <Row label="Type" value={sampleDetails.type} />
            <Row label="Status" value={sampleDetails.status.replace("_", " ")} />
            <Row label="Container" value={sampleDetails.container ?? "—"} />
            <Row label="Volume" value={sampleDetails.volume ?? "—"} />
            <Row label="Fasting" value={sampleDetails.fasting ?? "—"} />
            {sampleDetails.collectedBy && (
              <>
                <Row label="Collected By" value={sampleDetails.collectedBy} />
                <Row
                  label="Collected At"
                  value={sampleDetails.collectedAt ? formatDateTime(sampleDetails.collectedAt) : "—"}
                />
              </>
            )}
            {sampleDetails.instructions && sampleDetails.instructions.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Instructions
                </div>
                <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                  {sampleDetails.instructions.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Patient profile modal */}
      <Modal open={profileOpen} onClose={() => setProfileOpen(false)} title="Patient Profile" width="md">
        <div className="space-y-3 p-5 text-sm">
          <Row label="Name" value={patient.name} />
          <Row label="Patient ID" value={patient.id} />
          <Row label="Age / Gender" value={`${patient.age} yr · ${patient.gender}`} />
          <Row label="Phone" value={patient.phone} />
          <Row label="Email" value={patient.email} />
          <Row label="Address" value={patient.address} />
        </div>
      </Modal>

      {/* Assign technician modal */}
      <Modal
        open={!!assignFor}
        onClose={() => setAssignFor(null)}
        title="Assign Technician"
        width="sm"
        footer={
          <button
            onClick={() => {
              toast.success("Technician assigned");
              setAssignFor(null);
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Assign
          </button>
        }
      >
        <div className="space-y-2 p-5">
          {["Tech. Sreeja R.", "Tech. Anand", "Tech. Meera", "Tech. Suresh"].map((t) => (
            <label key={t} className="flex items-center gap-2 rounded-md border border-border p-2">
              <input type="radio" name="tech" defaultChecked={t === "Tech. Sreeja R."} className="accent-primary" />
              <span className="text-sm">{t}</span>
            </label>
          ))}
        </div>
      </Modal>

      <SampleCollectionDrawer
        open={!!drawerSample}
        onClose={() => setDrawerSample(null)}
        sample={drawerSample}
        onConfirm={(by) => {
          if (drawerSample) {
            collectSample(order.id, drawerSample.id, by);
            toast.success(`Sample ${drawerSample.id} collected`);
          }
          setDrawerSample(null);
        }}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

function SampleCard({
  sample,
  order,
  onCollect,
  onViewDetails,
  onAssignTest,
}: {
  sample: OrderSample;
  order: Order;
  onCollect: () => void;
  onViewDetails: () => void;
  onAssignTest: (testId: string) => void;
}) {
  const isCollected = sample.status === "collected";
  const sampleTests: OrderTest[] = sample.testIds
    .map((id) => order.tests.find((t) => t.testId === id))
    .filter((t): t is OrderTest => Boolean(t));
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex w-24 flex-col items-center justify-center gap-1 rounded-md border border-border bg-muted/40 p-2">
            <div className="barcode h-6 w-20" aria-hidden="true" />
            <div className="text-[9px] font-medium tracking-wider text-muted-foreground">
              {sample.id}
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-base font-semibold">{sample.type}</h3>
              <span className="text-xs text-muted-foreground">
                ({sample.testIds.length} test{sample.testIds.length === 1 ? "" : "s"} in this Sample)
              </span>
            </div>
            {isCollected ? (
              <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                <span>
                  Collected by:{" "}
                  <span className="font-medium text-foreground">{sample.collectedBy}</span>
                </span>
                <span>
                  Time:{" "}
                  <span className="font-medium text-foreground">
                    {sample.collectedAt && formatDateTime(sample.collectedAt)}
                  </span>
                </span>
              </div>
            ) : (
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Sample not collected
              </div>
            )}
          </div>
        </div>
        <div className="relative flex items-center gap-2">
          {isCollected ? (
            <>
              <span className="rounded-md bg-success-soft px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-success">
                Sample collected
              </span>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-muted"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-9 z-20 w-48 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onViewDetails();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <Eye className="h-4 w-4" /> View Sample Details
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onCollect();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger hover:bg-danger-soft"
                    >
                      <Beaker className="h-4 w-4" /> Recollect Sample
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <button
              onClick={onCollect}
              className="inline-flex items-center gap-2 rounded-md border border-primary bg-surface px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-soft"
            >
              Collect Sample →
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-border px-4 pb-4">
        <div className="py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Tests in this sample
        </div>
        <ul className="divide-y divide-border">
          {sampleTests.map((ot) => {
            const t = getTest(ot.testId);
            if (!t) return null;
            const tm = testStatusMeta[ot.status];
            return (
              <li
                key={ot.testId}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                    <span>
                      {t.code} · {t.department}
                    </span>
                    {ot.assignedTo ? (
                      <span className="inline-flex items-center gap-1 text-primary">
                        <UserPlus className="h-3 w-3" />
                        Assigned: <span className="underline underline-offset-2">{ot.assignedTo}</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => onAssignTest(ot.testId)}
                        className="inline-flex items-center gap-1 text-primary"
                      >
                        <UserPlus className="h-3 w-3" /> Assign
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill tone={tm.tone} label={tm.label} />
                  <TestRowAction order={order} ot={ot} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function TestRowAction({ order, ot }: { order: Order; ot: OrderTest }) {
  if (ot.status === "in_progress" || ot.status === "pending") {
    return (
      <Link
        to="/lims/orders/$orderId/result/$testId"
        params={{ orderId: order.id, testId: ot.testId }}
        className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
      >
        Enter Result →
      </Link>
    );
  }
  if (ot.status === "result_entered") {
    return (
      <Link
        to="/lims/orders/$orderId/result/$testId"
        params={{ orderId: order.id, testId: ot.testId }}
        search={{ mode: "approve" }}
        className="rounded-md border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary-soft"
      >
        Approve Result →
      </Link>
    );
  }
  if (ot.status === "result_approved") {
    return (
      <Link
        to="/lims/orders/$orderId/result/$testId"
        params={{ orderId: order.id, testId: ot.testId }}
        search={{ mode: "view" }}
        className="rounded-md border border-foreground px-3 py-1.5 text-xs font-semibold hover:bg-muted"
      >
        Publish →
      </Link>
    );
  }
  return (
    <Link
      to="/lims/orders/$orderId/report/$testId"
      params={{ orderId: order.id, testId: ot.testId }}
      className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
    >
      View Report →
    </Link>
  );
}
