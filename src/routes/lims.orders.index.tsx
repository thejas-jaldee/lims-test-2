import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Filter, Plus, MoreHorizontal, ChevronLeft, ChevronRight, ArrowDown, Eye, Trash2, FileText, Printer } from "lucide-react";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusPill, PriorityDot } from "@/components/lims/StatusPill";
import { orderStatusMeta, getPatient, formatDateTime, type OrderStatus } from "@/data/lims";
import { useLimsStore } from "@/store/limsStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lims/orders/")({
  head: () => ({
    meta: [
      { title: "Lab Orders — Global Care Hospital" },
      { name: "description", content: "Search, filter and manage all lab orders in one place." },
    ],
  }),
  component: OrdersListPage,
});

const PAGE_SIZE = 6;
const STATUS_OPTIONS: Array<{ key: OrderStatus | "all"; label: string }> = [
  { key: "all", label: "All Orders" },
  { key: "order_confirmed", label: "Order Confirmed" },
  { key: "sample_collected", label: "Sample Collected" },
  { key: "result_entered", label: "Result Entered" },
  { key: "validation", label: "Validation" },
  { key: "published", label: "Published" },
];

function OrdersListPage() {
  const orders = useLimsStore((s) => s.orders);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "normal" | "urgent">("all");
  const [page, setPage] = useState(1);
  const [statusOpen, setStatusOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const p = getPatient(o.patientId);
      const matchQ =
        !q ||
        o.number.toLowerCase().includes(q) ||
        (p?.name.toLowerCase().includes(q) ?? false) ||
        o.referredBy.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      const matchPrio = priorityFilter === "all" || o.priority === priorityFilter;
      return matchQ && matchStatus && matchPrio;
    });
  }, [orders, query, statusFilter, priorityFilter]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="flex flex-col">
      <PageHeader title="Orders" backTo="/lims" />

      <section className="rounded-2xl border border-border bg-surface p-4 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full max-w-xl items-center gap-2 rounded-md border border-border bg-surface px-3 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by order #, patient, doctor"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setStatusOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2.5 text-sm font-medium"
              >
                {STATUS_OPTIONS.find((s) => s.key === statusFilter)?.label}
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
              </button>
              {statusOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} />
                  <div className="absolute right-0 top-12 z-20 w-52 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s.key}
                        onClick={() => {
                          setStatusFilter(s.key);
                          setStatusOpen(false);
                          setPage(1);
                        }}
                        className={cn(
                          "block w-full px-3 py-2 text-left text-sm hover:bg-muted",
                          s.key === statusFilter && "bg-primary-soft text-primary",
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setFilterOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2.5 text-sm font-medium"
              >
                <Filter className="h-4 w-4 text-muted-foreground" /> Filter
                {priorityFilter !== "all" && (
                  <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                    1
                  </span>
                )}
              </button>
              {filterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                  <div className="absolute right-0 top-12 z-20 w-56 rounded-lg border border-border bg-surface p-3 shadow-lg">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Priority
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(["all", "normal", "urgent"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => {
                            setPriorityFilter(p);
                            setPage(1);
                          }}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs capitalize",
                            priorityFilter === p
                              ? "border-primary bg-primary-soft text-primary"
                              : "border-border text-muted-foreground hover:bg-muted",
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setPriorityFilter("all");
                        setStatusFilter("all");
                        setQuery("");
                        setFilterOpen(false);
                      }}
                      className="mt-3 w-full rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                    >
                      Reset filters
                    </button>
                  </div>
                </>
              )}
            </div>
            <Link
              to="/lims/orders/new"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Create Order
            </Link>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="py-3 pr-4">Order ID</th>
                <th className="py-3 pr-4">Patient</th>
                <th className="py-3 pr-4">Test Count</th>
                <th className="py-3 pr-4">Priority</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Referred By</th>
                <th className="py-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageRows.map((o) => {
                const patient = getPatient(o.patientId);
                const meta = orderStatusMeta[o.status];
                return (
                  <tr key={o.id} className="text-sm hover:bg-muted/30">
                    <td className="py-4 pr-4">
                      <div className="font-semibold text-foreground">{o.number}</div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</div>
                    </td>
                    <td className="py-4 pr-4">
                      {patient && (
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success-soft text-xs font-semibold text-success">
                            {patient.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{patient.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {patient.age} yr · {patient.gender}
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-4 pr-4 font-semibold text-primary">{o.testCount}</td>
                    <td className="py-4 pr-4">
                      <PriorityDot priority={o.priority} />
                    </td>
                    <td className="py-4 pr-4">
                      <StatusPill tone={meta.tone} label={meta.label} />
                    </td>
                    <td className="py-4 pr-4 text-foreground">{o.referredBy}</td>
                    <td className="py-4">
                      <div className="relative flex items-center justify-end gap-2">
                        <Link
                          to="/lims/orders/$orderId"
                          params={{ orderId: o.id }}
                          className="inline-flex items-center rounded-md border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary-soft"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => setMenuFor((c) => (c === o.id ? null : o.id))}
                          className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-muted"
                          aria-label="More"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {menuFor === o.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                            <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
                              <Link
                                to="/lims/orders/$orderId"
                                params={{ orderId: o.id }}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                              >
                                <Eye className="h-4 w-4" /> View Details
                              </Link>
                              <Link
                                to="/lims/orders/$orderId/invoice"
                                params={{ orderId: o.id }}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                              >
                                <FileText className="h-4 w-4" /> View Invoice
                              </Link>
                              <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted">
                                <Printer className="h-4 w-4" /> Print Slip
                              </button>
                              <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger hover:bg-danger-soft">
                                <Trash2 className="h-4 w-4" /> Cancel Order
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                    No orders match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
          <div>
            Showing {pageRows.length} of {rows.length} orders
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2 text-xs disabled:opacity-50"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={cn(
                  "h-8 w-8 rounded-md text-xs",
                  n === safePage
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2 text-xs disabled:opacity-50"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
