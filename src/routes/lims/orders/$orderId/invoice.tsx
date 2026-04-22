import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
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
import { Barcode } from "@/components/lims/Barcode";
import { Modal } from "@/components/lims/Modal";
import { StatusPill } from "@/components/lims/StatusPill";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  formatINR,
  getTest,
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
    const order = useLimsStore.getState().getOrder(params.orderId);
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
  const getPatient = useLimsStore((s) => s.getPatient);

  const patient = getPatient(order.patientId)!;
  const orderMeta = orderStatusMeta[order.status];
  const balance = Math.max(order.totals.total - order.totals.paid, 0);
  const isPaid = balance <= 0;
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

  const testRows = order.tests
    .map((item) => {
      const test = getTest(item.testId);
      if (!test) return null;
      return {
        id: item.testId,
        code: test.shortName || test.code.replace("-001", ""),
        name: test.name,
        category: test.department,
        type: "Test",
        total: item.price * item.qty,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const invoiceNo = order.invoiceNo ?? "INV-001";
  const orderDisplay = order.number.replace("ORD-", "");
  const invoiceDate = formatLongDate(order.createdAt);
  const paymentDate = order.paymentDate ? formatShortDate(order.paymentDate) : "3/1/2026";
  const paymentStatus = isPaid ? "PAID" : order.paymentStatus === "Partial" ? "PARTIAL" : "UNPAID";
  const paymentTone = isPaid ? "text-success" : order.paymentStatus === "Partial" ? "text-warning" : "text-danger";

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

    logInvoiceActivity(order.id, {
      type: "shared",
      title: "Invoice shared",
      description:
        shareChannel === "email"
          ? `Invoice shared to ${shareRecipient || patient.email} by email.`
          : `Invoice shared to ${shareRecipient || patient.phone} via WhatsApp.`,
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
      <section className="-mx-3 -mt-4 border-b border-border bg-surface px-4 py-4 md:-mx-4 lg:-mx-5">
        <div className="flex items-center gap-2 text-[15px] font-semibold text-foreground sm:text-[16px]">
          <Link
            to="/lims/orders/$orderId"
            params={{ orderId: order.id }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span>Back</span>
        </div>
      </section>

      <section className="mt-5 rounded-[10px] border border-border bg-surface px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="text-[14px] font-semibold uppercase tracking-[-0.02em] text-primary underline decoration-primary/30 underline-offset-3 sm:text-[16px]">
              ORDER #{orderDisplay}
            </div>
            <StatusPill
              tone={orderMeta.tone}
              label={orderMeta.label}
              className="rounded-full px-3 py-1 text-[11px] font-semibold sm:px-4 sm:py-1.5 sm:text-[12px]"
            />
          </div>

          <div className="grid w-full grid-cols-1 gap-2 min-[360px]:grid-cols-2 xl:flex xl:w-auto xl:flex-wrap xl:items-center xl:gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex h-[40px] w-full items-center justify-center gap-2 rounded-[7px] bg-[#f0f1f3] px-4 text-[13px] font-semibold text-foreground hover:bg-[#e9ecef] sm:h-[44px] sm:px-6 sm:text-[15px] xl:w-auto"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={() => {
                setSettleAmount(balance > 0 ? balance.toFixed(2) : "0.00");
                setSettleMethod(order.paymentMethod || "Credit Card");
                setTransactionId(order.transactionId || "");
                setSettleNote("");
                setSettleOpen(true);
                setMoreOpen(false);
              }}
              disabled={isPaid}
              className="inline-flex h-[40px] w-full items-center justify-center gap-2 rounded-[7px] bg-primary px-4 text-[13px] font-semibold text-primary-foreground hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 sm:h-[44px] sm:px-6 sm:text-[15px] xl:w-auto"
            >
              <CheckCircle2 className="hidden h-4 w-4" />
              {isPaid ? "Invoice Settled" : "Settle Invoice"}
            </button>
            <div className="relative min-[360px]:col-span-2 xl:col-auto">
              <button
                onClick={() => setMoreOpen((open) => !open)}
                className="inline-flex h-[40px] w-full items-center justify-center gap-2 rounded-[7px] border border-border bg-surface px-4 text-[13px] font-semibold text-primary hover:bg-muted sm:h-[44px] sm:px-5 sm:text-[15px] xl:w-auto"
              >
                More Action
                <ChevronDown className={cn("h-4 w-4 transition-transform", moreOpen && "rotate-180")} />
              </button>
              {moreOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMoreOpen(false)} />
                  <div className="absolute right-0 top-[46px] z-20 w-[150px] overflow-hidden rounded-[10px] border border-border bg-surface shadow-[0_10px_28px_rgba(15,23,42,0.16)] sm:w-[160px]">
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
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-[10px] border border-border bg-surface-muted">
        <div className="rounded-[10px] bg-surface px-3 py-3 sm:px-5 sm:py-5 md:px-6 md:py-6">
          <div className="mx-auto max-w-[970px] rounded-[18px] border border-[#d9dee7] bg-white px-3 py-4 shadow-[0_2px_12px_rgba(17,24,39,0.05)] min-[360px]:px-4 min-[360px]:py-5 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-11 lg:py-12">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-8">
              <div className="flex min-w-0 flex-col">
                <div className="flex flex-row gap-3 sm:gap-4">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-violet-soft text-violet sm:h-9 sm:w-9">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path d="M12 2l1.6 4.2L18 8l-4.4 1.8L12 14l-1.6-4.2L6 8l4.4-1.8L12 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-[17px] font-bold tracking-[-0.04em] text-foreground min-[360px]:text-[18px] sm:text-[22px] md:text-[24px]">Global Care Hospital</div>
                  
                </div>
                </div>
                <div className="mt-3 space-y-2 text-[12px] text-muted-foreground min-[360px]:text-[13px] sm:mt-5 sm:text-[14px]">
                    <div className="flex items-center gap-2.5">
                      <MapPin className="h-[15px] w-[15px]" />
                      MG Road, Kozhikode - 673001
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Phone className="h-[15px] w-[15px]" />
                      +919633360166
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Mail className="h-[15px] w-[15px]" />
                      info@globalcare.com
                    </div>
                  </div>
              </div>

              <div className="flex flex-col items-start md:items-end">
                <div className="flex flex-wrap items-end gap-2 md:justify-end">
                  <div className="flex h-[34px] w-[78px] items-center justify-start sm:h-[38px] sm:w-[92px] md:justify-end">
                    <div className="origin-left scale-[0.6] sm:origin-right sm:scale-[0.72]">
                      <Barcode value={invoiceNo} />
                    </div>
                  </div>

                  <div className="inline-flex h-[34px] items-center gap-2 rounded-[10px] bg-violet-soft px-3 text-[12px] font-bold text-[#5757ff] sm:h-[38px] sm:px-4 sm:text-[13px]">
                    <ClipboardList className="h-3 w-3" />
                    INVOICE
                  </div>
                </div>
                <div className="mt-2 space-y-0.5 text-left text-[12px] leading-5 min-[360px]:text-[13px] min-[360px]:leading-6 sm:text-[14px] sm:leading-7 md:mt-4 md:text-right md:leading-8">
                  <div>
                    <span className="text-muted-foreground">Invoice #: </span>
                    <span className="font-semibold">{invoiceNo}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Order #: </span>
                    <span className="font-semibold">#{orderDisplay}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date: </span>
                    <span className="font-semibold">{invoiceDate}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-[#e5e7eb]" />

            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 xl:gap-14">
              <div className="max-w-full rounded-[12px] bg-[#f1efe7] px-4 py-4 lg:max-w-[458px]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#a19b8f]">
                  Patient Details
                </div>
                <div className="mt-2.5 text-[12px] text-foreground min-[360px]:text-[13px] sm:text-[14px]">
                  <div className="text-[14px] font-medium min-[360px]:text-[15px] sm:text-[16px]">{patient.name}</div>
                  <div className="mt-1">{patient.id}</div>
                  <div className="mt-1">
                    {patient.age} yrs · {patient.gender}
                  </div>
                  <div className="mt-3 space-y-2 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="h-[14px] w-[14px]" />
                      {patient.phone}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-[14px] w-[14px]" />
                      {patient.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-[14px] w-[14px]" />
                      {patient.address}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-0">
                <MetaRow
                  label="Payment Status:"
                  value={<span className={cn("text-[14px] font-semibold min-[360px]:text-[16px]", paymentTone)}>{paymentStatus}</span>}
                />
                <div className="h-4" />
                <MetaRow label="Payment Method:" value={order.paymentMethod ?? "Credit Card"} />
                <div className="h-4" />
                <MetaRow label="Transaction ID:" value={order.transactionId ?? "TXN878707"} />
                <div className="h-4" />
                <MetaRow label="Payment Date:" value={paymentDate} />
              </div>
            </div>

            <div className="mt-7">
              <div className="mb-3 text-[16px] font-semibold tracking-[-0.02em] text-foreground sm:text-[18px]">Test Details</div>
              <div className="overflow-x-auto rounded-[10px] border border-[#dce1e8]">
                <table className="w-full min-w-[540px] text-sm min-[360px]:min-w-[580px] sm:min-w-[640px]">
                  <thead className="bg-primary text-primary-foreground">
                    <tr className="text-left">
                      <th className="px-4 py-3 text-[13px] font-semibold">Test Code</th>
                      <th className="px-4 py-3 text-[13px] font-semibold">Test Details</th>
                      <th className="px-4 py-3 text-[13px] font-semibold">Category</th>
                      <th className="px-4 py-3 text-[13px] font-semibold">Type</th>
                      <th className="px-4 py-3 text-right text-[13px] font-semibold">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-white">
                    {testRows.map((test) => (
                      <tr key={test.id}>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-[6px] bg-[#d7f2ef] px-2.5 py-1 text-[11px] font-medium text-primary sm:px-3 sm:text-[12px]">
                            {test.code}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[13px] font-medium text-foreground sm:text-[14px]">{test.name}</td>
                        <td className="px-4 py-3 text-[13px] text-muted-foreground sm:text-[14px]">{test.category}</td>
                        <td className="px-4 py-3 text-[13px] text-muted-foreground sm:text-[14px]">{test.type}</td>
                        <td className="px-4 py-3 text-right text-[13px] font-semibold text-foreground sm:text-[14px]">
                          {formatINR(test.total)}
                        </td>
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

            <div className="mt-9 flex justify-end">
              <div className="w-full max-w-[350px]">
                <div className="space-y-4">
                  <SummaryRow label="Total Items" value={`${order.tests.length} selected`} />
                  <SummaryRow label="Doctor Fee" value={order.totals.doctorFee ? formatINR(order.totals.doctorFee) : "0"} />
                  <SummaryRow label="Discount" value={order.totals.discount ? formatINR(order.totals.discount) : "0"} />
                  <SummaryRow label="Subtotal" value={formatINR(order.totals.subtotal)} />
                  <SummaryRow label={`GST (${order.totals.gstPct}%)`} value={formatINR(order.totals.gst)} />
                </div>

                <div className="mt-4 border-t border-dashed border-[#d7dde6] pt-3.5">
                  <SummaryRow
                    label={<span className="text-[18px] font-bold text-foreground">Total</span>}
                    value={<span className="text-[18px] font-bold text-primary">{formatINR(order.totals.total)}</span>}
                  />
                </div>

                <div className="mt-3 border-t border-[#e6e8ee] pt-3">
                  <SummaryRow
                    label={<span className="text-success">Amount Paid:</span>}
                    value={<span className="font-semibold text-success">{formatINR(order.totals.paid)}</span>}
                  />
                  <div className="mt-3" />
                  <SummaryRow
                    label={<span className="text-foreground">Balance Due:</span>}
                    value={<span className="font-semibold text-foreground">{formatINR(balance)}</span>}
                  />
                </div>
              </div>
            </div>

            <div className="mt-10 border-t border-[#e6e8ee] pt-5 text-center text-[10px] text-muted-foreground min-[360px]:mt-12 min-[360px]:text-[11px] sm:mt-20 sm:pt-6 sm:text-[12px] lg:mt-[118px]">
              <div>This is a computer-generated invoice and does not require a signature.</div>
              <div className="mt-1">© 2026 Jaldee Soft Pvt Ltd. All rights reserved.</div>
            </div>
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
            value={invoiceNo}
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

function formatLongDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatShortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
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
        "flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] font-medium hover:bg-muted",
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
            <div className="text-xs text-muted-foreground">{formatLongDate(entry.at)}</div>
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
    <div className="flex items-center justify-between gap-4 text-[14px]">
      <div className="text-[#5f6776]">{label}</div>
      <div className="text-right font-medium text-foreground">{value}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-[14px]">
      <div className="text-[#666c78]">{label}</div>
      <div className="text-right font-medium text-foreground">{value}</div>
    </div>
  );
}
