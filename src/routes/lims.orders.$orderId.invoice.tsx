import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Printer, MoreVertical, Share2, Download, X, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Barcode } from "@/components/lims/Barcode";
import {
  getOrder,
  getPatient,
  getTest,
  formatDate,
  formatDateTime,
  formatINR,
  type Order,
} from "@/data/lims";
import { useLimsStore } from "@/store/limsStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lims/orders/$orderId/invoice")({
  head: ({ params }) => ({
    meta: [
      { title: `Invoice ${params.orderId} — LIMS` },
      { name: "description", content: `Invoice details for order ${params.orderId}.` },
    ],
  }),
  loader: ({ params }): { order: Order } => {
    const order = getOrder(params.orderId);
    if (!order) throw notFound();
    return { order };
  },
  component: InvoicePage,
  notFoundComponent: () => (
    <div className="p-8 text-center text-sm text-muted-foreground">
      Invoice not found.{" "}
      <Link to="/lims/orders" className="text-primary">
        Back
      </Link>
    </div>
  ),
});

function InvoicePage() {
  const loaderData = Route.useLoaderData() as { order: Order };
  const liveOrder = useLimsStore((s) => s.orders.find((o) => o.id === loaderData.order.id));
  const order = liveOrder ?? loaderData.order;
  const settleInvoice = useLimsStore((s) => s.settleInvoice);
  const cancelInvoice = useLimsStore((s) => s.cancelInvoice);
  const patient = getPatient(order.patientId)!;
  const [moreOpen, setMoreOpen] = useState(false);
  const isPaid = order.paymentStatus === "Paid";
  const balance = Math.max(0, order.totals.total - order.totals.paid);

  const handleSettle = () => {
    if (isPaid) return;
    settleInvoice(order.id);
    toast.success("Invoice settled");
  };

  const handleCancel = () => {
    cancelInvoice(order.id);
    setMoreOpen(false);
    toast.success("Invoice marked unpaid");
  };

  return (
    <div>
      <PageHeader
        title="Invoice Details"
        backTo="/lims/orders/$orderId"
        right={
          <>
            <button className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium hover:bg-muted">
              <Printer className="h-4 w-4" /> Print
            </button>
            <button
              onClick={handleSettle}
              disabled={isPaid}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-foreground px-4 text-sm font-semibold text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" /> {isPaid ? "Settled" : "Settle Invoice"}
            </button>
            <div className="relative">
              <button
                onClick={() => setMoreOpen((v) => !v)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface hover:bg-muted"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {moreOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMoreOpen(false)} />
                  <div className="absolute right-0 top-12 z-20 w-44 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
                    {[
                      { label: "Share", icon: Share2, onClick: () => { window.navigator.share?.({ title: order.invoiceNo ?? order.number }).catch(() => {}); setMoreOpen(false); } },
                      { label: "Download", icon: Download, onClick: () => { window.print(); setMoreOpen(false); } },
                      { label: "Cancel", icon: X, danger: true, onClick: handleCancel },
                    ].map((m) => (
                      <button
                        key={m.label}
                        onClick={m.onClick}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted",
                          m.danger && "text-danger",
                        )}
                      >
                        <m.icon className="h-4 w-4" /> {m.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        }
      />

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        {/* Hospital header */}
        <div className="grid grid-cols-1 gap-6 border-b border-border p-6 md:grid-cols-[1fr_auto]">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-soft text-violet">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
                <path d="M12 2l1.6 4.2L18 8l-4.4 1.8L12 14l-1.6-4.2L6 8l4.4-1.8L12 2z" />
              </svg>
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">Global Care Hospital</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Main Road, Thrissur, Kerala — 680001 · +91 487 2999 999 · info@globalcare.in
              </div>
              <div className="mt-3">
                <span className="inline-flex items-center rounded-md bg-foreground px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-background">
                  Invoice
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Barcode value={order.invoiceNo} />
            <div className="text-right text-xs">
              <div>
                <span className="text-muted-foreground">Invoice No: </span>
                <span className="font-semibold">{order.invoiceNo ?? `INV-${order.number}`}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Order No: </span>
                <span className="font-semibold text-primary">{order.number}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Date: </span>
                <span className="font-semibold">{formatDate(order.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Patient + Payment */}
        <div className="grid grid-cols-1 gap-6 border-b border-border p-6 md:grid-cols-2">
          <div>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Bill To
            </div>
            <div className="text-base font-semibold">{patient.name}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {patient.id} · {patient.age} yr · {patient.gender}
            </div>
            <div className="mt-2 space-y-0.5 text-xs">
              <div>{patient.phone}</div>
              <div>{patient.email}</div>
              <div className="text-muted-foreground">{patient.address}</div>
            </div>
          </div>
          <div className="rounded-xl bg-surface-muted p-4">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Payment Summary
            </div>
            <dl className="space-y-2 text-sm">
              <Row
                label="Payment Status"
                value={
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      isPaid ? "bg-success-soft text-success" : "bg-warning-soft text-[oklch(0.45_0.13_70)]",
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {order.paymentStatus ?? "Unpaid"}
                  </span>
                }
              />
              <Row label="Payment Method" value={order.paymentMethod ?? "—"} />
              <Row label="Transaction ID" value={<span className="font-mono text-xs">{order.transactionId ?? "—"}</span>} />
              <Row label="Payment Date" value={order.paymentDate ? formatDateTime(order.paymentDate) : "—"} />
            </dl>
          </div>
        </div>

        {/* Test details */}
        <div className="p-6">
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Test Code</th>
                  <th className="px-4 py-3">Test Details</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {order.tests.map((ot) => {
                  const t = getTest(ot.testId);
                  if (!t) return null;
                  return (
                    <tr key={ot.testId}>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.code}</td>
                      <td className="px-4 py-3 font-medium">{t.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{t.category}</td>
                      <td className="px-4 py-3 text-muted-foreground">{t.specimen}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatINR(ot.price * ot.qty)}</td>
                    </tr>
                  );
                })}
                {order.tests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No items on this invoice.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <dl className="w-full max-w-sm space-y-2 text-sm">
              <Row label="Total Items" value={order.tests.length} />
              <Row label="Doctor Fee" value={formatINR(order.totals.doctorFee)} />
              <Row label="Discount" value={`- ${formatINR(order.totals.discount)}`} />
              <Row label="Subtotal" value={formatINR(order.totals.subtotal)} />
              <Row label={`GST (${order.totals.gstPct}%)`} value={formatINR(order.totals.gst)} />
              <div className="my-2 h-px bg-border" />
              <Row
                label={<span className="text-base font-semibold text-foreground">Total</span>}
                value={<span className="text-base font-bold text-foreground">{formatINR(order.totals.total)}</span>}
              />
              <Row label="Amount Paid" value={<span className="text-success">{formatINR(order.totals.paid)}</span>} />
              <Row
                label={<span className="font-semibold text-danger">Balance Due</span>}
                value={<span className="font-bold text-danger">{formatINR(balance)}</span>}
              />
            </dl>
          </div>
        </div>

        <div className="border-t border-border bg-surface-muted px-6 py-3 text-center text-[11px] text-muted-foreground">
          This is a computer generated invoice and does not require a signature.
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
