import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  Trash2,
  FileText,
  Printer,
  ArrowDown,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PriorityDot, StatusPill } from "@/components/lims/StatusPill";
import { formatDateTime, orderStatusMeta, type OrderStatus } from "@/data/lims";
import { cn } from "@/lib/utils";
import { useLimsStore } from "@/store/limsStore";

export const Route = createFileRoute("/lims/orders/")({
  head: () => ({
    meta: [
      { title: "Lab Orders Global Care Hospital" },
      { name: "description", content: "Search, filter and manage all lab orders in one place." },
    ],
  }),
  component: OrdersListPage,
});

const PAGE_SIZE = 9;
const REFERENCE_TOTAL_COUNT = 230;

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
  const getPatient = useLimsStore((s) => s.getPatient);
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
      const matchPriority = priorityFilter === "all" || o.priority === priorityFilter;
      return matchQ && matchStatus && matchPriority;
    });
  }, [getPatient, orders, priorityFilter, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="flex flex-col">
      <PageHeader title="Orders" backTo="/lims" />

      <section className="min-w-0 w-full overflow-hidden rounded-[12px] border border-[oklch(0.9_0.008_250)] bg-surface p-0 shadow-none sm:rounded-[14px] sm:shadow-[var(--shadow-card)] lg:rounded-[18px]">
        <div className="flex flex-col gap-3 border-b border-[oklch(0.93_0.008_250)] px-4 py-4 sm:px-5 md:flex-row md:items-start md:justify-between lg:items-center lg:px-8 lg:py-5">
          <div className="flex h-11 min-w-0 w-full flex-1 items-center gap-3 rounded-[12px] border border-[oklch(0.86_0.01_250)] bg-surface px-4 sm:h-12 sm:px-5 lg:h-[46px] lg:max-w-[520px]">
            <Search className="h-4 w-4 text-[oklch(0.56_0.03_250)] sm:h-[18px] sm:w-[18px]" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search"
              className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-[oklch(0.63_0.025_250)] sm:text-[15px]"
            />
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 md:flex-nowrap md:justify-end sm:gap-3">
            <div className="relative flex-1 min-w-[150px] md:min-w-[140px] sm:flex-none">
              <button
                onClick={() => setStatusOpen((v) => !v)}
                className="inline-flex h-11 w-full items-center justify-between gap-3 rounded-[10px] border border-[oklch(0.86_0.01_250)] bg-surface px-4 text-[14px] font-semibold text-foreground sm:h-12 sm:text-[15px] lg:h-[46px] lg:min-w-[150px]"
              >
                {STATUS_OPTIONS.find((s) => s.key === statusFilter)?.label}
                <ChevronDown className="h-4 w-4 text-[oklch(0.42_0.04_250)]" />
              </button>
              {statusOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} />
                  <div className="absolute left-0 top-12 z-20 w-full min-w-[210px] overflow-hidden rounded-[12px] border border-border bg-surface shadow-lg sm:right-0 sm:left-auto sm:w-56 sm:min-w-56 sm:top-14">
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

            <div className="relative flex-none">
              <button
                onClick={() => setFilterOpen((v) => !v)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-[oklch(0.86_0.01_250)] bg-surface text-[14px] font-semibold text-foreground sm:h-12 sm:w-auto sm:justify-start sm:gap-2 sm:px-5 sm:text-[15px] lg:h-[46px]"
                aria-label="Filter"
              >
                <Filter className="h-4 w-4 text-primary sm:h-[18px] sm:w-[18px]" />
                <span className="hidden sm:inline">Filter</span>
                {priorityFilter !== "all" && (
                  <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground sm:static sm:ml-1">
                    1
                  </span>
                )}
              </button>
              {filterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                  <div className="absolute right-0 top-12 z-20 w-[220px] rounded-[12px] border border-border bg-surface p-3 shadow-lg sm:top-14 sm:w-56">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Priority
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(["all", "normal", "urgent"] as const).map((priority) => (
                        <button
                          key={priority}
                          onClick={() => {
                            setPriorityFilter(priority);
                            setPage(1);
                          }}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs capitalize",
                            priorityFilter === priority
                              ? "border-primary bg-primary-soft text-primary"
                              : "border-border text-muted-foreground hover:bg-muted",
                          )}
                        >
                          {priority}
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
              className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] bg-primary text-[14px] font-semibold text-primary-foreground hover:bg-primary/90 md:w-auto md:shrink-0 sm:h-12 sm:w-auto sm:gap-2 sm:px-5 sm:text-[15px] lg:h-[46px]"
              aria-label="Create Order"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-surface/15 sm:h-6 sm:w-6">
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
              <span className="hidden sm:inline">Create Order</span>
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full lg:min-w-full">
            <thead>
              <tr className="bg-[oklch(0.95_0.004_250)] text-left text-[11px] font-semibold uppercase tracking-[-0.02em] text-[oklch(0.5_0.025_250)] sm:text-[12px]">
                <th className="px-4 py-3 pr-3 sm:px-5 sm:py-4 lg:px-8 lg:pr-4">Order ID</th>
                <th className="py-3 pr-3 sm:py-4 lg:pr-4">Patient</th>
                <th className="py-3 pr-3 sm:py-4 lg:pr-4">Test Count</th>
                <th className="py-3 pr-3 sm:py-4 lg:pr-4">
                  <span className="inline-flex items-center gap-1">
                    Priority
                    <ArrowDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </span>
                </th>
                <th className="py-3 pr-3 sm:py-4 lg:pr-4">
                  <span className="inline-flex items-center gap-1">
                    Status
                    <ArrowDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </span>
                </th>
                <th className="py-3 pr-3 sm:py-4 lg:pr-4">Refered By</th>
                <th className="py-3 pl-3 pr-4 text-right sm:py-4 sm:pr-5 lg:pl-4 lg:pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[oklch(0.92_0.008_250)]">
              {pageRows.map((o) => {
                const patient = getPatient(o.patientId);
                const meta = orderStatusMeta[o.status];

                return (
                  <tr key={o.id} className="text-sm hover:bg-muted/20">
                    <td className="px-4 py-4 pr-3 align-middle sm:px-5 sm:py-5 lg:px-8 lg:pr-4">
                      <div className="text-[14px] font-semibold text-foreground sm:text-[15px]">{o.number}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground sm:text-[12px]">
                        {formatDateTime(o.createdAt)}
                      </div>
                    </td>
                    <td className="py-4 pr-3 align-middle sm:py-5 lg:pr-4">
                      {patient && (
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-soft text-[12px] font-semibold text-[oklch(0.34_0.08_165)] sm:h-11 sm:w-11 sm:text-[13px]">
                            {patient.name
                              .split(" ")
                              .map((segment) => segment[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                          <div>
                            <div className="text-[14px] font-semibold text-foreground sm:text-[15px]">
                              {patient.name}
                            </div>
                            <div className="mt-1 text-[11px] text-muted-foreground sm:text-[12px]">
                              {patient.age} yr · {patient.gender}
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-4 pr-3 align-middle text-[15px] font-semibold text-primary sm:py-5 sm:text-[16px] lg:pr-4">
                      {o.testCount}
                    </td>
                    <td className="py-4 pr-3 align-middle sm:py-5 lg:pr-4">
                      <PriorityDot priority={o.priority} />
                    </td>
                    <td className="py-4 pr-3 align-middle sm:py-5 lg:pr-4">
                      <StatusPill tone={meta.tone} label={meta.label} />
                    </td>
                    <td className="py-4 pr-3 align-middle text-[14px] text-foreground sm:py-5 sm:text-[15px] lg:pr-4">
                      {o.referredBy}
                    </td>
                    <td className="py-4 pl-3 pr-4 align-middle sm:py-5 sm:pr-5 lg:pl-4 lg:pr-8">
                      <div className="relative flex items-center justify-end gap-2">
                        <Link
                          to="/lims/orders/$orderId"
                          params={{ orderId: o.id }}
                          className="inline-flex h-10 items-center rounded-[8px] border border-[oklch(0.86_0.01_250)] px-3 text-[13px] font-medium text-primary hover:bg-primary-soft sm:h-[42px] sm:px-4 sm:text-[14px] lg:h-[46px]"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => setMenuFor((current) => (current === o.id ? null : o.id))}
                          className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-[oklch(0.86_0.01_250)] text-muted-foreground hover:bg-muted sm:h-[42px] sm:w-[42px] lg:h-[46px] lg:w-[46px]"
                          aria-label="More"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {menuFor === o.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                            <div className="absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-[12px] border border-border bg-surface shadow-lg sm:top-12">
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

        <div className="flex flex-col items-start justify-between gap-4 px-4 py-5 text-sm text-muted-foreground sm:px-5 md:flex-row md:items-center lg:px-8 lg:py-6">
          <div className="text-[14px] text-[oklch(0.46_0.02_250)] sm:text-[15px]">
            Showing {pageRows.length} of {REFERENCE_TOTAL_COUNT} tests
          </div>
          <div className="flex w-full flex-wrap items-center gap-1.5 text-[14px] sm:w-auto sm:gap-2 sm:text-[15px]">
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={safePage <= 1}
              className="inline-flex h-9 items-center gap-1 rounded-md px-1 text-[14px] text-[oklch(0.46_0.03_250)] disabled:opacity-50 sm:gap-2 sm:text-[15px]"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            {[1, 2].map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={cn(
                  "h-9 w-9 rounded-md text-[14px] sm:text-[15px]",
                  n === safePage ? "bg-primary font-semibold text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {n}
              </button>
            ))}
            <span className="inline-flex h-9 items-center px-2 text-[14px] text-muted-foreground sm:text-[15px]">...</span>
            {[5, 6].map((n) => (
              <span
                key={n}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-md text-[14px] sm:text-[15px]",
                  n === 5 ? "font-semibold text-primary" : "text-muted-foreground",
                )}
              >
                {n}
              </span>
            ))}
            <button
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={safePage >= totalPages}
              className="inline-flex h-9 items-center gap-1 rounded-md px-1 text-[14px] text-[oklch(0.46_0.03_250)] disabled:opacity-50 sm:gap-2 sm:text-[15px]"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
