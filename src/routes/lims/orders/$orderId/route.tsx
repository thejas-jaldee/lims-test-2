import { createFileRoute, Link, Outlet, notFound, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Edit3,
  FileText,
  ChevronDown,
  MoreHorizontal,
  UserPlus,
  Eye,
  X,
  CheckCheck,
  Beaker,
  ClipboardList,
  Send,
  GitBranch,
  RefreshCw,
  Plus,
  ArrowLeftRight,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Barcode } from "@/components/lims/Barcode";
import { StatusPill } from "@/components/lims/StatusPill";
import { PatientCard } from "@/components/lims/PatientCard";
import { Timeline } from "@/components/lims/Timeline";
import { SampleCollectionDrawer } from "@/components/lims/SampleCollectionDrawer";
import { Modal } from "@/components/lims/Modal";
import {
  getTest,
  referringDoctors,
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
import { getCdnAssetUrl } from "@/lib/cdn";

export const Route = createFileRoute("/lims/orders/$orderId")({
  head: ({ params }) => ({
    meta: [
      { title: `Order ${params.orderId} - LIMS` },
      { name: "description", content: `Lab order ${params.orderId} - samples, tests and timeline.` },
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
  { key: "enter", label: "Enter All Test Results", icon: ClipboardList },
  { key: "approve", label: "Approve Test Results", icon: CheckCheck },
  { key: "publish", label: "Publish All Test Reports", icon: Send },
];

const technicians = ["Tech. Sreeja R.", "Tech. Anand", "Tech. Meera", "Tech. Suresh"];

function OrderDetailsPage() {
  const { orderId } = Route.useLoaderData();
  const navigate = useNavigate();
  const location = useLocation();
  const order = useLimsStore((s) => s.orders.find((o) => o.id === orderId || o.number === orderId)) as Order;
  const collectSample = useLimsStore((s) => s.collectSample);
  const splitSampleAction = useLimsStore((s) => s.splitSample);
  const assignTest = useLimsStore((s) => s.assignTest);
  const updateOrderMeta = useLimsStore((s) => s.updateOrderMeta);
  const bulkSet = useLimsStore((s) => s.bulkSetTestStatus);
  const getPatient = useLimsStore((s) => s.getPatient);

  const patient = getPatient(order.patientId)!;
  const meta = orderStatusMeta[order.status];
  const canonicalBasePath = `/lims/orders/${order.id}`;
  const legacyBasePath = `/lims/orders/${order.number}`;
  const isNestedChildRoute = location.pathname !== canonicalBasePath && location.pathname !== legacyBasePath;
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [drawerSample, setDrawerSample] = useState<OrderSample | null>(null);
  const [sampleDetails, setSampleDetails] = useState<OrderSample | null>(null);
  const [splitSample, setSplitSample] = useState<OrderSample | null>(null);
  const [splitAction, setSplitAction] = useState<"new" | "move" | "recollect">("move");
  const [splitDestination, setSplitDestination] = useState("SPM-BLD-002");
  const [splitSelectedTestIds, setSplitSelectedTestIds] = useState<string[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editPriority, setEditPriority] = useState(order.priority);
  const [editDoctor, setEditDoctor] = useState(order.referredBy);
  const [editSource, setEditSource] = useState<Order["source"]>(order.source);
  const [profileOpen, setProfileOpen] = useState(false);
  const [assignFor, setAssignFor] = useState<string | null>(null);
  const [selectedTechnician, setSelectedTechnician] = useState("Tech. Sreeja R.");
  const [showHeaderIllustration, setShowHeaderIllustration] = useState(true);

  const samplePanelImage = getCdnAssetUrl("assets/images/lims/labflaskicon.png");

  const eligibleTestIds = useMemo(() => {
    if (!bulkAction) return [];
    if (bulkAction === "enter") {
      return order.tests.filter((t) => t.status === "in_progress" || t.status === "pending").map((t) => t.testId);
    }
    if (bulkAction === "approve") {
      return order.tests.filter((t) => t.status === "result_entered").map((t) => t.testId);
    }
    if (bulkAction === "publish") {
      return order.tests.filter((t) => t.status === "result_approved").map((t) => t.testId);
    }
    if (bulkAction === "collect") {
      return order.tests
        .filter((t) => order.samples.some((s) => s.testIds.includes(t.testId) && s.status !== "collected"))
        .map((t) => t.testId);
    }
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
      navigate({
        to: "/lims/orders/$orderId/result/$testId",
        params: { orderId: order.id, testId: selectedTestIds[0] },
      });
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
    <div className="flex flex-col">
      <PageHeader title="Order Details" backTo="/lims/orders" />

      <section className="rounded-[10px] border border-border bg-surface px-2.5 py-2.5 sm:rounded-[12px] sm:px-3 sm:py-3 lg:rounded-[14px] lg:px-4 lg:py-3">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[16px] font-semibold tracking-[-0.04em] text-foreground sm:text-[17px] lg:text-[18px]">
                Order {order.number}
              </h2>
              <StatusPill tone={meta.tone} label={meta.label} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground sm:text-[11px]">
              <span>{formatDateTime(order.createdAt)}</span>
              <span className="flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                {order.source}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                {patient.id}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <Barcode value={`${order.number}-${patient.id.replace("PAT-", "")}`} className="sm:mr-2 lg:mr-4" />
            <button
              onClick={() => {
                setEditPriority(order.priority);
                setEditDoctor(order.referredBy);
                setEditSource(order.source);
                setEditOpen(true);
              }}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[8px] border border-border px-3 text-[11px] font-semibold text-primary hover:bg-muted sm:h-9 sm:text-[12px] lg:h-10 sm:min-w-[120px]"
            >
              <Edit3 className="h-4 w-4" /> Edit Order
            </button>
            <Link
              to="/lims/orders/$orderId/invoice"
              params={{ orderId: order.id }}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[8px] bg-foreground px-3 text-[11px] font-semibold text-background hover:opacity-90 sm:h-9 sm:text-[12px] lg:h-10 sm:min-w-[126px]"
            >
              <FileText className="h-4 w-4" /> View Invoice
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:mt-3 sm:gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-[10px]  border-border  p-0 sm:rounded-[12px] lg:rounded-[14px]">
          <div className="flex flex-col gap-2.5 rounded-[10px] bg-surface border-b border-border px-2.5 py-2.5 sm:px-3 sm:py-3 lg:flex-row lg:items-center lg:justify-between lg:px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-[8px]  p-1 text-primary sm:h-8 sm:w-8 lg:h-9 lg:w-9">
                {showHeaderIllustration ? (
                  <img
                    src={samplePanelImage}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-contain"
                    onError={() => setShowHeaderIllustration(false)}
                  />
                ) : (
                  <Beaker className="h-4 w-4 lg:h-5 lg:w-5" />
                )}
              </div>
              <div>
                <div className="text-[13px] font-semibold text-primary sm:text-[14px] lg:text-[15px]">
                  Samples &amp; Tests
                </div>
                <div className="text-[11px] sm:text-[12px]">
                  <span className="text-muted-foreground">Priority: </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 font-medium",
                      order.priority === "urgent" ? "text-danger" : "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
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
                className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-foreground px-3 text-[11px] font-semibold text-background sm:h-9 sm:px-3.5 sm:text-[12px] lg:h-10"
              >
                Complete All <ChevronDown className="h-4 w-4" />
              </button>
              {bulkOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setBulkOpen(false)} />
                  <div className="absolute right-0 top-12 z-20 w-60 overflow-hidden rounded-[12px] border border-border bg-surface shadow-lg">
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

          <div className="flex flex-col gap-2.5  py-2.5 sm:gap-3  sm:py-3 lg:py-4">
            {order.samples.map((s) => (
              <SampleCard
                key={s.id}
                sample={s}
                order={order}
                onCollect={() => setDrawerSample(s)}
                onViewDetails={() => setSampleDetails(s)}
                onSplitSample={() => {
                  setSplitSample(s);
                  setSplitAction("move");
                  setSplitDestination("SPM-BLD-002");
                  setSplitSelectedTestIds(s.testIds);
                }}
                onAssignTest={(tid) => {
                  setAssignFor(tid);
                  const assignedTech = order.tests.find((t) => t.testId === tid)?.assignedTo;
                  setSelectedTechnician(assignedTech ?? "Tech. Sreeja R.");
                }}
              />
            ))}
            {order.samples.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                No samples added to this order yet.
              </div>
            )}
          </div>
        </section>

        <aside className="flex flex-col gap-3 sm:gap-4">
          <section className="rounded-[10px] border border-border bg-surface p-0 sm:rounded-[12px] lg:rounded-[14px]">
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="text-[13px] font-semibold">Patient</div>
              <button
                onClick={() => setProfileOpen(true)}
                className="rounded-full border border-border px-2.5 py-1 text-[10px] font-medium hover:bg-muted"
              >
                View Profile
              </button>
            </div>
            <div className="px-3 py-3 sm:px-4 sm:py-4">
              <PatientCard patient={patient} />
            </div>
          </section>

          <section className="rounded-[10px] border border-border bg-surface p-0 sm:rounded-[12px] lg:rounded-[14px]">
            <div className="border-b border-border px-3 py-2.5 text-[13px] font-semibold sm:px-4 sm:py-3">Order Timeline</div>
            <div className="px-3 py-3 sm:px-4 sm:py-4">
              <Timeline events={order.timeline} />
            </div>
          </section>
        </aside>
      </div>

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
            <div className="py-6 text-center text-sm text-muted-foreground">No tests eligible for this action.</div>
          ) : (
            <>
              <label className="flex items-center gap-2 border-b border-border pb-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={selectedTestIds.length === eligibleTestIds.length}
                  onChange={(e) => setSelectedTestIds(e.target.checked ? eligibleTestIds : [])}
                />
                <span className="text-sm font-semibold">Select All ({eligibleTestIds.length} eligible)</span>
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
                          setSelectedTestIds((s) => (e.target.checked ? [...s, tid] : s.filter((x) => x !== tid)))
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

      <Modal open={!!sampleDetails} onClose={() => setSampleDetails(null)} title="Sample Details" width="md">
        {sampleDetails && (
          <div className="space-y-3 p-5 text-sm">
            <Row label="Sample ID" value={sampleDetails.id} />
            <Row label="Type" value={sampleDetails.type} />
            <Row label="Status" value={sampleDetails.status.replace("_", " ")} />
            <Row label="Container" value={sampleDetails.container ?? "-"} />
            <Row label="Volume" value={sampleDetails.volume ?? "-"} />
            <Row label="Fasting" value={sampleDetails.fasting ?? "-"} />
            {sampleDetails.collectedBy && (
              <>
                <Row label="Collected By" value={sampleDetails.collectedBy} />
                <Row
                  label="Collected At"
                  value={sampleDetails.collectedAt ? formatDateTime(sampleDetails.collectedAt) : "-"}
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

      <SplitSampleModal
        order={order}
        sample={splitSample}
        selectedTestIds={splitSelectedTestIds}
        splitAction={splitAction}
        destination={splitDestination}
        onSelectedTestIdsChange={setSplitSelectedTestIds}
        onSplitActionChange={setSplitAction}
        onDestinationChange={setSplitDestination}
        onClose={() => setSplitSample(null)}
        onConfirm={() => {
          if (!splitSample || splitSelectedTestIds.length === 0) {
            toast.error("Select at least one test");
            return;
          }
          if (splitAction === "move" && !splitDestination.trim()) {
            toast.error("Enter a destination specimen");
            return;
          }
          splitSampleAction(order.id, splitSample.id, {
            testIds: splitSelectedTestIds,
            action: splitAction,
            destinationId: splitDestination,
          });
          const actionText =
            splitAction === "new"
              ? "moved to a new specimen"
              : splitAction === "move"
                ? `moved to ${splitDestination.trim()}`
                : "marked for recollection";
          toast.success(`${splitSelectedTestIds.length} test(s) ${actionText}`);
          setSplitSample(null);
        }}
      />

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Order"
        width="md"
        footer={
          <>
            <button
              onClick={() => setEditOpen(false)}
              className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                updateOrderMeta(order.id, {
                  priority: editPriority,
                  referredBy: editDoctor,
                  source: editSource,
                });
                toast.success("Order updated");
                setEditOpen(false);
              }}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Save Changes
            </button>
          </>
        }
      >
        <div className="space-y-4 p-5">
          <EditField label="Priority">
            <div className="flex gap-2">
              {(["normal", "urgent"] as const).map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setEditPriority(priority)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm font-medium capitalize",
                    editPriority === priority
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border hover:bg-muted",
                  )}
                >
                  {priority}
                </button>
              ))}
            </div>
          </EditField>
          <EditField label="Referred By">
            <select
              value={editDoctor}
              onChange={(event) => setEditDoctor(event.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none"
            >
              {referringDoctors.map((doctor) => (
                <option key={doctor} value={doctor}>
                  {doctor}
                </option>
              ))}
            </select>
          </EditField>
          <EditField label="Source">
            <select
              value={editSource}
              onChange={(event) => setEditSource(event.target.value as Order["source"])}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none"
            >
              {(["Walk-in", "Referral", "OPD", "IPD"] as const).map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </EditField>
        </div>
      </Modal>

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

      <Modal
        open={!!assignFor}
        onClose={() => setAssignFor(null)}
        title="Assign Technician"
        width="sm"
        footer={
          <button
            onClick={() => {
              if (assignFor) {
                assignTest(order.id, assignFor, selectedTechnician);
                toast.success("Technician assigned");
              }
              setAssignFor(null);
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Assign
          </button>
        }
      >
        <div className="space-y-2 p-5">
          {technicians.map((t) => (
            <label key={t} className="flex items-center gap-2 rounded-md border border-border p-2">
              <input
                type="radio"
                name="tech"
                checked={selectedTechnician === t}
                onChange={() => setSelectedTechnician(t)}
                className="accent-primary"
              />
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

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function SampleCard({
  sample,
  order,
  onCollect,
  onViewDetails,
  onSplitSample,
  onAssignTest,
}: {
  sample: OrderSample;
  order: Order;
  onCollect: () => void;
  onViewDetails: () => void;
  onSplitSample: () => void;
  onAssignTest: (testId: string) => void;
}) {
  const isCollected = sample.status === "collected";
  const sampleTests: OrderTest[] = sample.testIds
    .map((id) => order.tests.find((t) => t.testId === id))
    .filter((t): t is OrderTest => Boolean(t));
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <section className="rounded-[10px] border border-border bg-surface shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-2.5 px-3 py-3 sm:px-4 sm:py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex w-max shrink-0 flex-col items-center justify-center gap-1 rounded-[8px] border border-border bg-surface p-2 sm:w-max">
            <div className="barcode h-5 w-[62px] sm:h-6 sm:w-[68px]" aria-hidden="true" />
            <div className="text-[9px] whitespace-nowrap font-medium tracking-wider text-muted-foreground">{sample.id}</div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <h3 className="text-[14px] font-semibold tracking-[-0.03em] text-foreground sm:text-[15px]">{sample.type}</h3>
              <span className="text-[11px] text-muted-foreground">
                ({sample.testIds.length} test{sample.testIds.length === 1 ? "" : "s"} in this Sample)
              </span>
            </div>
            {isCollected ? (
              <div className="mt-1.5 inline-flex flex-wrap items-center gap-x-2 rounded-[6px] bg-muted px-2.5 py-1.5 text-[10px] text-muted-foreground sm:text-[11px]">
                <span>
                  Collected by: <span className="font-semibold text-foreground">{sample.collectedBy}</span>
                </span>
                <span>
                  Time:{" "}
                  <span className="font-semibold text-foreground">
                    {sample.collectedAt && formatDateTime(sample.collectedAt)}
                  </span>
                </span>
              </div>
            ) : (
              <div className="mt-1.5 inline-flex rounded-[6px] bg-muted px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Sample not collected
              </div>
            )}
          </div>
        </div>

        <div className="relative flex items-center justify-end gap-2">
          {isCollected ? (
            <>
              <span className="rounded-[6px] bg-success-soft px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                Sample collected
              </span>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-border text-muted-foreground hover:bg-muted sm:h-9 sm:w-9"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-10 z-20 w-48 overflow-hidden rounded-[12px] border border-border bg-surface shadow-lg">
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
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <Beaker className="h-4 w-4" /> Recollect Sample
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onSplitSample();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <GitBranch className="h-4 w-4" /> Split Sample
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <button
              onClick={onCollect}
              className="inline-flex h-8 items-center gap-2 rounded-[8px] border-[2px] border-foreground bg-surface px-3.5 text-[11px] font-semibold text-foreground hover:bg-muted sm:h-9 sm:px-4 sm:text-[12px]"
            >
              Collect Sample →
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-border px-3 pb-3 sm:px-4 sm:pb-4">
        <div className="py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Tests in this sample
        </div>
        <ul className="space-y-3">
          {sampleTests.map((ot) => {
            const t = getTest(ot.testId);
            if (!t) return null;
            const tm = testStatusMeta[ot.status];
            return (
              <li key={ot.testId} className="rounded-[10px] border border-border px-3 py-3">
                <div className="flex flex-row justify-between gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <div className="text-[13px] font-semibold sm:text-[14px]">{t.name}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground sm:text-[11px]">
                      <span>
                        {t.code} · {t.department}
                      </span>
                      {ot.assignedTo ? (
                        <span className="inline-flex items-center gap-1 text-primary">
                          <UserPlus className="h-3 w-3" />
                          Assigned: <span className="underline underline-offset-2">{ot.assignedTo}</span>
                        </span>
                      ) : (
                        <button onClick={() => onAssignTest(ot.testId)} className="inline-flex items-center gap-1 text-primary">
                          <UserPlus className="h-3 w-3" /> Assign
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end items-center gap-2.5 xl:justify-end">
                    <StatusPill tone={tm.tone} label={tm.label} />
                    <TestRowAction order={order} ot={ot} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function SplitSampleModal({
  order,
  sample,
  selectedTestIds,
  splitAction,
  destination,
  onSelectedTestIdsChange,
  onSplitActionChange,
  onDestinationChange,
  onClose,
  onConfirm,
}: {
  order: Order;
  sample: OrderSample | null;
  selectedTestIds: string[];
  splitAction: "new" | "move" | "recollect";
  destination: string;
  onSelectedTestIdsChange: (ids: string[]) => void;
  onSplitActionChange: (action: "new" | "move" | "recollect") => void;
  onDestinationChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!sample) return null;

  const sampleTests: OrderTest[] = sample.testIds
    .map((id) => order.tests.find((t) => t.testId === id))
    .filter((t): t is OrderTest => Boolean(t));
  const actionLabel =
    splitAction === "new"
      ? "Create new specimen"
      : splitAction === "move"
        ? `Move to ${destination || "selected specimen"}`
        : "Mark for recollection";

  const toggleTest = (testId: string, checked: boolean) => {
    onSelectedTestIdsChange(
      checked ? [...selectedTestIds, testId] : selectedTestIds.filter((id) => id !== testId),
    );
  };

  return (
    <Modal
      open={!!sample}
      onClose={onClose}
      width="2xl"
      className="max-w-[1040px] rounded-[14px]"
      bodyClassName="max-h-[82vh] overflow-y-auto"
    >
      <div className="p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-warning-soft text-warning">
              <GitBranch className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-[15px] font-semibold tracking-[-0.03em] text-foreground sm:text-[16px]">
                Split {sample.type} Sample
              </h2>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Choose tests and target specimen action.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,1fr)_240px]">
          <section className="rounded-[12px] border border-border bg-surface p-3">
            <div className="mb-3 text-[12px] font-semibold text-foreground">Select tests</div>
            <div className="space-y-2">
              {sampleTests.map((ot) => {
                const test = getTest(ot.testId);
                if (!test) return null;
                const checked = selectedTestIds.includes(ot.testId);
                return (
                  <label
                    key={ot.testId}
                    className={cn(
                      "flex min-h-[68px] cursor-pointer items-center gap-3 rounded-[10px] border px-3 py-2.5 transition",
                      checked ? "border-warning bg-warning-soft/45" : "border-border hover:bg-muted",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => toggleTest(ot.testId, e.target.checked)}
                      className="h-4 w-4 shrink-0 accent-info"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-semibold text-foreground sm:text-[13px]">
                        {test.name} ({test.shortName ?? test.code})
                      </div>
                      <div className="mt-1 text-[10px] text-muted-foreground sm:text-[11px]">
                        {sample.type} / Serum / {sample.id}
                      </div>
                    </div>
                    <StatusPill tone="success" label="Collected" dot={false} className="px-2 py-1 text-[10px]" />
                  </label>
                );
              })}
            </div>
          </section>

          <section className="rounded-[12px] border border-border bg-surface p-3">
            <div className="mb-3 text-[12px] font-semibold text-foreground">Split action</div>
            <div className="space-y-2">
              <SplitActionCard
                checked={splitAction === "new"}
                icon={<Plus className="h-4 w-4" />}
                title="Create new specimen"
                description="Create a fresh specimen for selected tests."
                onChange={() => onSplitActionChange("new")}
              />
              <SplitActionCard
                checked={splitAction === "move"}
                icon={<GitBranch className="h-4 w-4" />}
                title="Move to another specimen"
                description="Attach to an existing specimen instance."
                onChange={() => onSplitActionChange("move")}
                activeClassName="border-warning bg-warning-soft/45"
              >
                <input
                  value={destination}
                  onChange={(e) => onDestinationChange(e.target.value)}
                  className="mt-2 h-9 w-full rounded-[8px] border border-border bg-surface px-3 text-[12px] font-medium outline-none focus:border-primary"
                />
              </SplitActionCard>
              <SplitActionCard
                checked={splitAction === "recollect"}
                icon={<RefreshCw className="h-4 w-4" />}
                title="Mark for recollection"
                description="Keep selected tests pending for fresh collection."
                onChange={() => onSplitActionChange("recollect")}
              />
            </div>
          </section>

          <aside className="rounded-[12px] border border-border bg-[#f5f5f5] p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-foreground">
              <ArrowLeftRight className="h-4 w-4" /> Preview
            </div>
            <dl className="mt-4 space-y-2 text-[12px]">
              <div>
                <dt className="text-muted-foreground">Selected</dt>
                <dd className="font-semibold text-foreground">{selectedTestIds.length}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Source</dt>
                <dd className="font-semibold text-foreground">{sample.type}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Result</dt>
                <dd className="font-semibold text-foreground">{actionLabel}</dd>
              </div>
            </dl>
            <div className="mt-4 rounded-[10px] border border-border bg-muted px-3 py-2 text-[11px] font-semibold text-muted-foreground">
              {sample.id}
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={onClose}
                className="h-9 flex-1 rounded-[8px] border border-border bg-surface px-3 text-[12px] font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={selectedTestIds.length === 0}
                className="h-9 flex-1 rounded-[8px] bg-violet px-3 text-[12px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </aside>
        </div>
      </div>
    </Modal>
  );
}

function SplitActionCard({
  checked,
  icon,
  title,
  description,
  onChange,
  children,
  activeClassName = "border-primary bg-primary-soft/35",
}: {
  checked: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onChange: () => void;
  children?: React.ReactNode;
  activeClassName?: string;
}) {
  return (
    <label
      className={cn(
        "block cursor-pointer rounded-[10px] border border-border p-3 transition hover:bg-muted",
        checked && activeClassName,
      )}
    >
      <div className="flex items-start gap-3">
        <input type="radio" checked={checked} onChange={onChange} className="mt-1 h-3.5 w-3.5 accent-info" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-foreground">
            <span className="text-muted-foreground">{icon}</span>
            {title}
          </div>
          <div className="mt-1 text-[10px] text-muted-foreground sm:text-[11px]">{description}</div>
          {children}
        </div>
      </div>
    </label>
  );
}

function TestRowAction({ order, ot }: { order: Order; ot: OrderTest }) {
  if (ot.status === "pending") {
    return null;
  }
  if (ot.status === "in_progress") {
    return (
      <Link
        to="/lims/orders/$orderId/result/$testId"
        params={{ orderId: order.id, testId: ot.testId }}
        className="inline-flex h-8 items-center rounded-[8px] bg-muted px-3.5 text-[11px] font-medium text-foreground hover:bg-muted/80 sm:h-9 sm:px-4 sm:text-[12px]"
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
        className="inline-flex h-8 items-center rounded-[8px] border-[2px] border-primary px-3.5 text-[11px] font-medium text-primary hover:bg-primary-soft sm:h-9 sm:px-4 sm:text-[12px]"
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
        className="inline-flex h-8 items-center rounded-[8px] border border-foreground px-3.5 text-[11px] font-semibold hover:bg-muted sm:h-9 sm:px-4 sm:text-[12px]"
      >
        View Result →
      </Link>
    );
  }
  return (
    <Link
      to="/lims/orders/$orderId/report/$testId"
      params={{ orderId: order.id, testId: ot.testId }}
      className="inline-flex h-8 items-center rounded-[8px] border border-border px-3.5 text-[11px] font-semibold hover:bg-muted sm:h-9 sm:px-4 sm:text-[12px]"
    >
      View Report →
    </Link>
  );
}
