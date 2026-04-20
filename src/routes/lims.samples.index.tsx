import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, TestTubes } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusPill } from "@/components/lims/StatusPill";
import { getPatient, formatDateTime, type SampleStatus } from "@/data/lims";
import { useLimsStore } from "@/store/limsStore";

export const Route = createFileRoute("/lims/samples/")({
  head: () => ({
    meta: [
      { title: "Samples — LIMS" },
      { name: "description", content: "Track all collected and pending samples across orders." },
    ],
  }),
  component: SamplesIndex,
});

const statusMeta: Record<SampleStatus, { label: string; tone: "warning" | "success" | "danger" }> = {
  not_collected: { label: "Not Collected", tone: "warning" },
  collected: { label: "Collected", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
};

type Filter = "all" | SampleStatus;

function SamplesIndex() {
  const orders = useLimsStore((s) => s.orders);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const all = orders.flatMap((o) =>
      o.samples.map((s) => ({
        ...s,
        orderId: o.id,
        orderNumber: o.number,
        patient: getPatient(o.patientId),
      })),
    );
    return all.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!term) return true;
      return (
        r.id.toLowerCase().includes(term) ||
        r.orderNumber.toLowerCase().includes(term) ||
        r.patient?.name.toLowerCase().includes(term) ||
        r.type.toLowerCase().includes(term)
      );
    });
  }, [orders, q, filter]);

  const counts = useMemo(() => {
    const all = orders.flatMap((o) => o.samples);
    return {
      all: all.length,
      not_collected: all.filter((s) => s.status === "not_collected").length,
      collected: all.filter((s) => s.status === "collected").length,
      rejected: all.filter((s) => s.status === "rejected").length,
    };
  }, [orders]);

  return (
    <div>
      <PageHeader
        title="Samples"
        subtitle={`${counts.all} sample${counts.all === 1 ? "" : "s"} across all orders`}
      />

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by sample, order, patient or specimen…"
              className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-1">
            {(["all", "not_collected", "collected", "rejected"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors " +
                  (filter === f
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted")
                }
              >
                {f === "all" ? "All" : statusMeta[f].label} ({counts[f]})
              </button>
            ))}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-surface-muted">
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Sample</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Specimen</th>
              <th className="px-4 py-3">Container</th>
              <th className="px-4 py-3">Collected</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => {
              const meta = statusMeta[r.status];
              return (
                <tr key={`${r.orderId}-${r.id}`} className="hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <TestTubes className="h-3.5 w-3.5 text-muted-foreground" /> {r.id}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to="/lims/orders/$orderId"
                      params={{ orderId: r.orderId }}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {r.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.patient?.name ?? "—"}</div>
                    <div className="font-mono text-xs text-muted-foreground">{r.patient?.id}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.type}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.container ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {r.collectedAt ? formatDateTime(r.collectedAt) : "—"}
                    {r.collectedBy && (
                      <div className="text-[11px]">by {r.collectedBy}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill tone={meta.tone} label={meta.label} />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No samples match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
