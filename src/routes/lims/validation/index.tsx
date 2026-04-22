import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, XCircle, Eye, Search, Filter, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusPill } from "@/components/lims/StatusPill";
import { getPatient, formatDateTime, orderStatusMeta } from "@/data/lims";
import { useLimsStore } from "@/store/limsStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lims/validation/")({
  head: () => ({
    meta: [
      { title: "Validation Queue — LIMS" },
      { name: "description", content: "Approve, reject or escalate lab results awaiting medical validation." },
    ],
  }),
  component: ValidationQueuePage,
});

function ValidationQueuePage() {
  const orders = useLimsStore((s) => s.orders);
  const approveAll = useLimsStore((s) => s.approveAll);
  const bulkSet = useLimsStore((s) => s.bulkSetTestStatus);
  const queue = orders.filter((o) => o.status === "result_entered" || o.status === "validation");
  const [q, setQ] = useState("");

  const filtered = queue.filter((o) => {
    if (!q) return true;
    const p = getPatient(o.patientId);
    return (
      o.number.toLowerCase().includes(q.toLowerCase()) ||
      p?.name.toLowerCase().includes(q.toLowerCase()) ||
      false
    );
  });

  const handleApprove = (orderId: string) => {
    approveAll(orderId);
    toast.success(`Order ${orderId} approved`);
  };

  const handleReject = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const ids = order.tests.filter((t) => t.status === "result_entered").map((t) => t.testId);
    bulkSet(orderId, ids, "in_progress");
    toast.error(`Order ${orderId} returned to entry`);
  };

  return (
    <div>
      <PageHeader
        title="Validation Queue"
        subtitle="Review lab results submitted by technicians and approve for publishing."
        backTo="/lims"
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Awaiting Validation" value={queue.length} tone="warning" />
        <Stat label="Critical Flags" value={1} tone="danger" icon={<AlertTriangle className="h-4 w-4" />} />
        <Stat label="Approved Today" value={28} tone="success" />
        <Stat label="Avg. TAT" value="3.4 hrs" tone="info" />
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by order, patient…"
            className="h-10 w-72 rounded-md border border-border bg-surface pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <button className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-medium hover:bg-muted">
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full">
          <thead className="bg-muted/40">
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Tests</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {filtered.map((o) => {
              const p = getPatient(o.patientId);
              const meta = orderStatusMeta[o.status];
              return (
                <tr key={o.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      to="/lims/orders/$orderId"
                      params={{ orderId: o.id }}
                      className="font-mono text-xs font-semibold text-primary hover:underline"
                    >
                      {o.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{p?.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p?.id} · {p?.age}y {p?.gender}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{o.testCount} tests</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={meta.tone} label={meta.label} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to="/lims/orders/$orderId"
                        params={{ orderId: o.id }}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                      >
                        <Eye className="h-3.5 w-3.5" /> Review
                      </Link>
                      <button
                        onClick={() => handleApprove(o.id)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-success-soft px-2.5 py-1.5 text-xs font-semibold text-success hover:opacity-90"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(o.id)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-danger-soft px-2.5 py-1.5 text-xs font-semibold text-danger hover:opacity-90"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Nothing waiting for validation. Great work!
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number | string;
  tone: "warning" | "danger" | "success" | "info";
  icon?: React.ReactNode;
}) {
  const map = {
    warning: "bg-warning-soft text-[oklch(0.5_0.13_70)]",
    danger: "bg-danger-soft text-danger",
    success: "bg-success-soft text-success",
    info: "bg-info-soft text-info",
  } as const;
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {icon && <div className={cn("flex h-7 w-7 items-center justify-center rounded-md", map[tone])}>{icon}</div>}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
