import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, FileText, Download } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusPill } from "@/components/lims/StatusPill";
import { getTest, formatDateTime } from "@/data/lims";
import { useLimsStore } from "@/store/limsStore";

export const Route = createFileRoute("/lims/reports/")({
  head: () => ({
    meta: [
      { title: "Reports — LIMS" },
      { name: "description", content: "Browse all approved and published lab reports." },
    ],
  }),
  component: ReportsIndex,
});

function ReportsIndex() {
  const orders = useLimsStore((s) => s.orders);
  const getPatient = useLimsStore((s) => s.getPatient);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "result_approved" | "result_published">("all");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const all = orders.flatMap((o) =>
      o.tests
        .filter((t) => t.status === "result_approved" || t.status === "result_published")
        .map((t) => ({
          ...t,
          orderId: o.id,
          orderNumber: o.number,
          patient: getPatient(o.patientId),
          test: getTest(t.testId),
          createdAt: o.createdAt,
        })),
    );
    return all.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!term) return true;
      return (
        r.test?.name.toLowerCase().includes(term) ||
        r.test?.code.toLowerCase().includes(term) ||
        r.orderNumber.toLowerCase().includes(term) ||
        r.patient?.name.toLowerCase().includes(term)
      );
    });
  }, [orders, q, filter]);

  const counts = useMemo(() => {
    const all = orders.flatMap((o) => o.tests);
    return {
      all: all.filter((t) => t.status === "result_approved" || t.status === "result_published").length,
      result_approved: all.filter((t) => t.status === "result_approved").length,
      result_published: all.filter((t) => t.status === "result_published").length,
    };
  }, [orders]);

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle={`${counts.all} report${counts.all === 1 ? "" : "s"} ready to share`}
      />

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by test, order or patient…"
              className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-1">
            {([
              { key: "all", label: "All" },
              { key: "result_approved", label: "Approved" },
              { key: "result_published", label: "Published" },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors " +
                  (filter === f.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted")
                }
              >
                {f.label} ({counts[f.key]})
              </button>
            ))}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-surface-muted">
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Test</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={`${r.orderId}-${r.testId}`} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 font-medium">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {r.test?.name}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">{r.test?.code}</div>
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
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatDateTime(r.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <StatusPill
                    tone={r.status === "result_published" ? "success" : "violet"}
                    label={r.status === "result_published" ? "Published" : "Approved"}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to="/lims/orders/$orderId/report/$testId"
                    params={{ orderId: r.orderId, testId: r.testId }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium hover:bg-muted"
                  >
                    <Download className="h-3.5 w-3.5" /> View
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No reports yet. Approve or publish a test result to see it here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
