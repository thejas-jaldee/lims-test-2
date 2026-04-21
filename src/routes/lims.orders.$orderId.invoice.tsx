import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Copy,
  CreditCard,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Printer,
  Share2,
  UserRound,
  Wallet,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Barcode } from "@/components/lims/Barcode";
import { Modal } from "@/components/lims/Modal";
import { StatusPill } from "@/components/lims/StatusPill";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  formatDate,
  formatDateTime,
  formatINR,
  getPatient,
  getTest,
  getOrder,
  orderStatusMeta,
  type InvoiceActivity,
  type Order,
} from "@/data/lims";
import { cn } from "@/lib/utils";
import { useLimsStore } from "@/store/limsStore";

export const Route = createFileRoute("/lims/orders/$orderId/invoice")({
  head: ({ params }) => ({
    meta: [
      { title: `Invoice ${params.orderId} — LIMS` },
      { name: "description", content: `Invoice details for order ${params.orderId}.` },
    ],
  }),
  loader: ({ params }): { orderId: string } => {
    const order = getOrder(params.orderId);
    if (!order) throw notFound();
    return { orderId: params.orderId };
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

type ShareChannel = "email" | "whatsapp" | "copy";

function InvoicePage() {
  const { orderId } = Route.useLoaderData();
  const order = useLimsStore((s) => s.orders.find((item) => item.id === orderId || item.number === orderId)) as Order;
  const settleInvoice = useLimsStore((s) => s.settleInvoice);
  const cancelInvoice = useLimsStore((s) => s.cancelInvoice);
  const logInvoiceActivity = useLimsStore((s) => s.logInvoiceActivity);

  const patient = getPatient(order.patientId)!;
  const orderMeta = orderStatusMeta[order.status];
  const balance = Math.max(order.totals.total - order.totals.paid, 0);
  const isPaid = balance <= 0;
  const isPartial = order.paymentStatus === "Partial";
  const activity = order.invoiceActivity ?? [];
  const invoiceUrl =
    typeof window === "undefined"
      ? `/lims/orders/${order.id}/invoice`
      : `${window.location.origin}/lims/orders/${order.id}/invoice`;

  const [moreOpen, setMoreOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const [shareChannel, setShareChannel] = useState<ShareChannel>("email");
  const [shareRecipient, setShareRecipient] = useState(patient.email);
  const [shareMessage, setShareMessage] = useState(
    `Hello ${patient.name}, your invoice ${order.invoiceNo ?? order.number} is ready.`,
  );

  const [settleAmount, setSettleAmount] = useState(balance > 0 ? balance.toFixed(2) : "0.00");
  const [settleMethod, setSettleMethod] = useState(order.paymentMethod || "Credit Card");
  const [transactionId, setTransactionId] = useState(order.transactionId || "");
  const [settleNote, setSettleNote] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    setSettleAmount(balance > 0 ? balance.toFixed(2) : "0.00");
  }, [balance]);

  const paymentTone = useMemo(() => {
    if (isPaid) return "text-success";
    if (isPartial) return "text-warning";
    return "text-danger";
  }, [isPaid, isPartial]);

  const paymentLabel = useMemo(() => {
    if (isPaid) return "PAID";
    if (isPartial) return "PARTIAL";
    return "UNPAID";
  }, [isPaid, isPartial]);

  const invoiceDate = useMemo(() => {
    const d = new Date(order.createdAt);
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }, [order.createdAt]);

  const testRows = order.tests
    .map((item) => {
      const test = getTest(item.testId);
      if (!test) return null;
      return {
        id: item.testId,
        code: test.shortName || test.code,
        name: test.name,
        category: test.department,
        type: test.specimen === "N/A" ? "Service" : "Test",
        total: item.price * item.qty,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const openSettleDialog = () => {
    setSettleAmount(balance > 0 ? balance.toFixed(2) : "0.00");
    setSettleMethod(order.paymentMethod || "Credit Card");
    setTransactionId(order.transactionId || "");
    setSettleNote("");
    setSettleOpen(true);
    setMoreOpen(false);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
    logInvoiceActivity(order.id, {
      type: "printed",
      title: "Invoice printed",
      description: "Printed from invoice detail page.",
      by: "Admin User",
    });
    toast.success("Invoice sent to printer");
  };

  const handleShare = async () => {
    if (shareChannel === "copy") {
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(invoiceUrl);
        }
        logInvoiceActivity(order.id, {
          type: "shared",
          title: "Invoice link copied",
          description: "Invoice URL copied to clipboard.",
          by: "Admin User",
        });
        toast.success("Invoice link copied");
        setShareOpen(false);
        return;
      } catch {
        toast.error("Unable to copy the invoice link");
        return;
      }
    }

    const description =
      shareChannel === "email"
        ? `Invoice shared to ${shareRecipient || patient.email} by email.`
        : `Invoice shared to ${shareRecipient || patient.phone} via WhatsApp.`;

    logInvoiceActivity(order.id, {
      type: "shared",
      title: "Invoice shared",
      description,
      by: "Admin User",
    });
    toast.success(shareChannel === "email" ? "Invoice emailed" : "Invoice shared via WhatsApp");
    setShareOpen(false);
  };

  const handleSettle = () => {
    const amount = Number(settleAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amount > balance) {
      toast.error("Amount cannot exceed the current balance");
      return;
    }

    settleInvoice(order.id, {
      amount,
      method: settleMethod,
      transactionId: transactionId.trim() || undefined,
      note: settleNote.trim() || undefined,
      by: "Cashier · Admin",
    });
    toast.success(amount === balance ? "Invoice settled" : "Payment recorded");
    setSettleOpen(false);
  };

  const handleCancelInvoice = () => {
    cancelInvoice(order.id, {
      reason: cancelReason.trim() || undefined,
      by: "Admin User",
    });
    toast.success("Invoice cancelled");
    setCancelOpen(false);
    setMoreOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Invoice Details"
        backTo={`/lims/orders/${order.id}`}
        right={
          <>
            <button
              onClick={handlePrint}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-semibold hover:bg-muted"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={openSettleDialog}
              disabled={isPaid}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isPaid ? "Invoice Settled" : isPartial ? "Add Payment" : "Settle Invoice"}
            </button>
            <div className="relative">
              <button
                onClick={() => setMoreOpen((open) => !open)}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-semibold hover:bg-muted"
              >
                More Action
                <ChevronDown className={cn("h-4 w-4 transition-transform", moreOpen && "rotate-180")} />
              </button>
              {moreOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMoreOpen(false)} />
                  <div className="absolute right-0 top-12 z-20 w-52 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
                    <MenuButton
                      icon={Share2}
                      label="Share Invoice"
                      onClick={() => {
                        setShareChannel("email");
                        setShareRecipient(patient.email);
                        setShareOpen(true);
                        setMoreOpen(false);
                      }}
                    />
                    <MenuButton
                      icon={ClipboardList}
                      label="Log"
                      onClick={() => {
                        setLogOpen(true);
                        setMoreOpen(false);
                      }}
                    />
                    <MenuButton
                      icon={XCircle}
                      label="Cancel Invoice"
                      tone="danger"
                      onClick={() => {
                        setCancelOpen(true);
                        setMoreOpen(false);
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </>
        }
      />

      <section className="rounded-2xl border border-border bg-surface px-6 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-[15px] font-semibold text-primary underline decoration-primary/40 underline-offset-4">
              ORDER #{order.number}
            </h2>
            <StatusPill tone={orderMeta.tone} label={orderMeta.label} />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Invoice: {order.invoiceNo ?? `INV-${order.number}`}</span>
            <span className="hidden h-1 w-1 rounded-full bg-muted-foreground md:block" />
            <span>Created {formatDate(order.createdAt)}</span>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-[28px] border border-border bg-surface p-5 shadow-card md:p-8">
        <div className="mx-auto max-w-5xl rounded-[26px] border border-border bg-white px-6 py-8 shadow-soft md:px-12 md:py-10">
          <div className="flex flex-col gap-8 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-soft text-violet">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
                  <path d="M12 2l1.6 4.2L18 8l-4.4 1.8L12 14l-1.6-4.2L6 8l4.4-1.8L12 2z" />
                </svg>
              </div>
              <div>
                <div className="text-[19px] font-bold tracking-tight text-foreground md:text-[21px]">
                  Global Care Hospital
                </div>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    MG Road, Kozhikode - 673001
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    +91 9633360166
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    info@globalcare.com
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 md:items-end">
              <Barcode value={order.invoiceNo ?? order.number} />
              <div className="inline-flex items-center rounded-xl bg-violet-soft px-4 py-2 text-lg font-bold text-violet">
                INVOICE
              </div>
              <div className="space-y-1 text-sm md:text-right">
                <div>
                  <span className="text-muted-foreground">Invoice #: </span>
                  <span className="font-semibold">{order.invoiceNo ?? `INV-${order.number}`}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Order #: </span>
                  <span className="font-semibold">{order.number}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Date: </span>
                  <span className="font-semibold">{invoiceDate}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl bg-[oklch(0.967_0.006_90)] p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Patient Details
              </div>
              <div className="mt-3 space-y-2">
                <div className="text-[26px] font-semibold tracking-tight text-foreground">{patient.name}</div>
                <div className="text-sm text-muted-foreground">
                  {patient.id} · {patient.age} yrs · {patient.gender}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 text-primary" />
                    {patient.phone}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 text-primary" />
                    {patient.email}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    {patient.address}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-4 rounded-2xl border border-border p-5">
              <MetaRow
                label="Payment Status"
                value={<span className={cn("text-xl font-bold tracking-wide", paymentTone)}>{paymentLabel}</span>}
              />
              <MetaRow label="Payment Method" value={order.paymentMethod ?? "Not settled"} />
              <MetaRow
                label="Transaction ID"
                value={
                  <span className="font-mono text-xs text-foreground">{order.transactionId ?? "Not available"}</span>
                }
              />
              <MetaRow
                label="Payment Date"
                value={order.paymentDate ? formatDateTime(order.paymentDate) : "Pending"}
              />
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-3 text-[28px] font-semibold tracking-tight text-foreground">Test Details</div>
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-primary text-primary-foreground">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-semibold">Test Code</th>
                    <th className="px-4 py-3 font-semibold">Test Details</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 text-right font-semibold">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {testRows.map((test) => (
                    <tr key={test.id}>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-md bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                          {test.code}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{test.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{test.category}</td>
                      <td className="px-4 py-3 text-muted-foreground">{test.type}</td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">{formatINR(test.total)}</td>
                    </tr>
                  ))}
                  {testRows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No items on this invoice.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <div className="w-full max-w-[360px] rounded-2xl border border-border bg-surface-muted/60 p-5">
              <div className="space-y-3">
                <SummaryRow label="Total Items" value={`${order.tests.length} selected`} />
                <SummaryRow label="Doctor Fee" value={formatINR(order.totals.doctorFee)} />
                <SummaryRow label="Discount" value={formatINR(order.totals.discount)} />
                <SummaryRow label="Subtotal" value={formatINR(order.totals.subtotal)} />
                <SummaryRow label={`GST (${order.totals.gstPct}%)`} value={formatINR(order.totals.gst)} />
              </div>
              <div className="my-4 border-t border-dashed border-border" />
              <div className="space-y-3">
                <SummaryRow
                  label={<span className="text-xl font-bold text-foreground">Total</span>}
                  value={<span className="text-2xl font-bold text-primary">{formatINR(order.totals.total)}</span>}
                />
                <SummaryRow
                  label={<span className="font-medium text-success">Amount Paid</span>}
                  value={<span className="font-semibold text-success">{formatINR(order.totals.paid)}</span>}
                />
                <SummaryRow
                  label={<span className="font-medium text-foreground">Balance Due</span>}
                  value={
                    <span className={cn("font-semibold", balance > 0 ? "text-foreground" : "text-success")}>
                      {formatINR(balance)}
                    </span>
                  }
                />
              </div>
            </div>
          </div>

          <div className="mt-20 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            <div>This is a computer-generated invoice and does not require a signature.</div>
            <div className="mt-1">© 2026 Jaldee Soft Pvt Ltd. All rights reserved.</div>
          </div>
        </div>
      </section>

      <Modal
        open={settleOpen}
        onClose={() => setSettleOpen(false)}
        title="Settle Invoice"
        width="md"
        footer={
          <>
            <button
              onClick={() => setSettleOpen(false)}
              className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Close
            </button>
            <button
              onClick={handleSettle}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Confirm Payment
            </button>
          </>
        }
      >
        <div className="space-y-4 p-5">
          <InfoStrip icon={Wallet} label="Outstanding Balance" value={formatINR(balance)} />
          <Field label="Amount Received">
            <Input value={settleAmount} onChange={(e) => setSettleAmount(e.target.value)} inputMode="decimal" />
          </Field>
          <Field label="Payment Method">
            <select
              value={settleMethod}
              onChange={(e) => setSettleMethod(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {["Credit Card", "UPI", "Cash", "Bank Transfer"].map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Transaction ID">
            <Input
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter reference / transaction id"
            />
          </Field>
          <Field label="Note">
            <Textarea
              value={settleNote}
              onChange={(e) => setSettleNote(e.target.value)}
              placeholder="Optional internal note for settlement log"
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Share Invoice"
        width="md"
        footer={
          <>
            <button
              onClick={() => setShareOpen(false)}
              className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleShare()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Share Now
            </button>
          </>
        }
      >
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ShareChoice
              icon={Mail}
              label="Email"
              active={shareChannel === "email"}
              onClick={() => {
                setShareChannel("email");
                setShareRecipient(patient.email);
              }}
            />
            <ShareChoice
              icon={MessageSquare}
              label="WhatsApp"
              active={shareChannel === "whatsapp"}
              onClick={() => {
                setShareChannel("whatsapp");
                setShareRecipient(patient.phone);
              }}
            />
            <ShareChoice
              icon={Copy}
              label="Copy Link"
              active={shareChannel === "copy"}
              onClick={() => {
                setShareChannel("copy");
                setShareRecipient(invoiceUrl);
              }}
            />
          </div>

          <Field label={shareChannel === "copy" ? "Invoice URL" : "Recipient"}>
            <Input value={shareRecipient} onChange={(e) => setShareRecipient(e.target.value)} />
          </Field>

          <Field label="Message">
            <Textarea value={shareMessage} onChange={(e) => setShareMessage(e.target.value)} rows={4} />
          </Field>
        </div>
      </Modal>

      <Modal open={logOpen} onClose={() => setLogOpen(false)} title="Invoice Log" width="lg">
        <div className="space-y-4 p-5">
          {activity.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No invoice activity recorded yet.
            </div>
          ) : (
            activity.map((entry) => <LogCard key={entry.id} entry={entry} />)
          )}
        </div>
      </Modal>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel Invoice"
        width="md"
        footer={
          <>
            <button
              onClick={() => setCancelOpen(false)}
              className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Keep Invoice
            </button>
            <button
              onClick={handleCancelInvoice}
              className="rounded-md bg-danger px-4 py-2 text-sm font-semibold text-danger-foreground"
            >
              Cancel Invoice
            </button>
          </>
        }
      >
        <div className="space-y-4 p-5">
          <InfoStrip
            icon={XCircle}
            label="This action will reset the payment state"
            value={order.invoiceNo ?? `INV-${order.number}`}
            tone="danger"
          />
          <Field label="Reason">
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Add a reason for cancellation"
              rows={4}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

function MenuButton({
  icon: Icon,
  label,
  onClick,
  tone,
}: {
  icon: typeof Share2;
  label: string;
  onClick: () => void;
  tone?: "danger";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium hover:bg-muted",
        tone === "danger" && "text-danger hover:bg-danger-soft",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function ShareChoice({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Mail;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border px-4 py-4 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary-soft text-primary"
          : "border-border bg-surface text-muted-foreground hover:bg-muted",
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function InfoStrip({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CreditCard;
  label: string;
  value: string;
  tone?: "danger";
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-2xl border px-4 py-3",
        tone === "danger" ? "border-danger/20 bg-danger-soft" : "border-border bg-surface-muted",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            tone === "danger" ? "bg-danger text-danger-foreground" : "bg-primary text-primary-foreground",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="text-sm font-medium text-foreground">{label}</div>
      </div>
      <div className="text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function LogCard({ entry }: { entry: InvoiceActivity }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <ActivityIcon type={entry.type} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div className="text-sm font-semibold text-foreground">{entry.title}</div>
            <div className="text-xs text-muted-foreground">{formatDateTime(entry.at)}</div>
          </div>
          {entry.description && <div className="mt-1 text-sm text-muted-foreground">{entry.description}</div>}
          <div className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-primary">
            <UserRound className="h-3.5 w-3.5" />
            {entry.by}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityIcon({ type }: { type: InvoiceActivity["type"] }) {
  if (type === "payment") return <Wallet className="h-5 w-5" />;
  if (type === "printed") return <Printer className="h-5 w-5" />;
  if (type === "shared") return <Share2 className="h-5 w-5" />;
  if (type === "cancelled") return <XCircle className="h-5 w-5" />;
  return <ClipboardList className="h-5 w-5" />;
}

function MetaRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-right font-medium text-foreground">{value}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-right text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
