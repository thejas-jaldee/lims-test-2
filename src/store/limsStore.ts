import { create } from "zustand";
import {
  orders as seedOrders,
  patients as seedPatients,
  labTests as seedTests,
  testPackages as seedPackages,
  type Order,
  type OrderStatus,
  type OrderTest,
  type OrderSample,
  type Patient,
  type LabTest,
  type TestPackage,
  type TimelineEvent,
  type TestStatus,
  type InvoiceActivity,
} from "@/data/lims";

const baseDate = new Date().toISOString();

const buildTimeline = (status: OrderStatus): TimelineEvent[] => {
  const order = [
    "order_confirmed",
    "sample_collected",
    "processing",
    "result_entered",
    "validation",
    "published",
  ] as const;
  const labels: Record<(typeof order)[number], string> = {
    order_confirmed: "Order Confirmed",
    sample_collected: "Sample collected",
    processing: "Processing",
    result_entered: "Result entered",
    validation: "Validation pending",
    published: "Result Published",
  };
  const map: Record<OrderStatus, number> = {
    order_confirmed: 1,
    sample_collected: 2,
    result_entered: 4,
    validation: 5,
    published: 6,
  };
  const reachedIdx = map[status] - 1;
  return order.map((k, i): TimelineEvent => ({
    key: k,
    label: labels[k],
    timestamp: i <= reachedIdx ? baseDate : undefined,
    by: i === 0 ? "Reception" : i <= reachedIdx ? "Tech. Sreeja" : undefined,
    state: i < reachedIdx ? "done" : i === reachedIdx ? "current" : "todo",
  }));
};

interface LimsState {
  orders: Order[];
  patients: Patient[];
  tests: LabTest[];
  packages: TestPackage[];

  getOrder: (id: string) => Order | undefined;
  getPatient: (id: string) => Patient | undefined;
  collectSample: (orderId: string, sampleId: string, by: string) => void;
  assignTest: (orderId: string, testId: string, technician: string) => void;
  setTestStatus: (orderId: string, testId: string, status: TestStatus) => void;
  bulkSetTestStatus: (orderId: string, testIds: string[], status: TestStatus) => void;
  approveTest: (orderId: string, testId: string) => void;
  rejectTest: (orderId: string, testId: string) => void;
  publishTest: (orderId: string, testId: string) => void;
  approveAll: (orderId: string) => void;
  publishAll: (orderId: string) => void;
  settleInvoice: (
    orderId: string,
    details: { amount: number; method: string; transactionId?: string; note?: string; by?: string },
  ) => void;
  cancelInvoice: (orderId: string, details?: { reason?: string; by?: string }) => void;
  logInvoiceActivity: (
    orderId: string,
    activity: Omit<InvoiceActivity, "id" | "at"> & { at?: string },
  ) => void;
  addPatient: (p: Patient) => void;
  addOrder: (o: Order) => void;
  toggleTest: (testId: string) => void;
  togglePackage: (packageId: string) => void;
  updateTestPrice: (testId: string, price: number) => void;
}

const recomputeOrderStatus = (o: Order): Order => {
  const tests = o.tests;
  if (tests.length === 0) return o;
  let status: OrderStatus = o.status;
  if (tests.every((t) => t.status === "result_published")) status = "published";
  else if (tests.every((t) => t.status === "result_approved" || t.status === "result_published"))
    status = "validation";
  else if (tests.some((t) => t.status === "result_entered")) status = "result_entered";
  else if (o.samples.some((s) => s.status === "collected")) {
    if (status === "order_confirmed") status = "sample_collected";
  }
  return { ...o, status, timeline: buildTimeline(status) };
};

const updateOrder = (orders: Order[], id: string, fn: (o: Order) => Order) =>
  orders.map((o) => (o.id === id || o.number === id ? recomputeOrderStatus(fn(o)) : o));

const appendInvoiceActivity = (
  order: Order,
  activity: Omit<InvoiceActivity, "id" | "at"> & { at?: string },
): Order => ({
  ...order,
  invoiceActivity: [
    {
      id: `invoice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at: activity.at ?? new Date().toISOString(),
      ...activity,
    },
    ...(order.invoiceActivity ?? []),
  ],
});

export const useLimsStore = create<LimsState>((set, get) => ({
  orders: seedOrders,
  patients: seedPatients,
  tests: seedTests,
  packages: seedPackages,

  getOrder: (id) => get().orders.find((o) => o.id === id || o.number === id),
  getPatient: (id) => get().patients.find((p) => p.id === id),

  collectSample: (orderId, sampleId, by) =>
    set((s) => ({
      orders: updateOrder(s.orders, orderId, (o) => ({
        ...o,
        samples: o.samples.map((sm): OrderSample =>
          sm.id === sampleId
            ? { ...sm, status: "collected", collectedBy: by, collectedAt: new Date().toISOString() }
            : sm,
        ),
        tests: o.tests.map((t): OrderTest =>
          o.samples.find((sm) => sm.id === sampleId)?.testIds.includes(t.testId) && t.status === "pending"
            ? { ...t, status: "in_progress" }
            : t,
        ),
      })),
    })),

  assignTest: (orderId, testId, technician) =>
    set((s) => ({
      orders: updateOrder(s.orders, orderId, (o) => ({
        ...o,
        tests: o.tests.map((t): OrderTest =>
          t.testId === testId ? { ...t, assignedTo: technician } : t,
        ),
      })),
    })),

  setTestStatus: (orderId, testId, status) =>
    set((s) => ({
      orders: updateOrder(s.orders, orderId, (o) => ({
        ...o,
        tests: o.tests.map((t): OrderTest => (t.testId === testId ? { ...t, status } : t)),
      })),
    })),

  bulkSetTestStatus: (orderId, testIds, status) =>
    set((s) => ({
      orders: updateOrder(s.orders, orderId, (o) => ({
        ...o,
        tests: o.tests.map((t): OrderTest =>
          testIds.includes(t.testId) ? { ...t, status } : t,
        ),
      })),
    })),

  approveTest: (orderId, testId) => get().setTestStatus(orderId, testId, "result_approved"),
  rejectTest: (orderId, testId) => get().setTestStatus(orderId, testId, "in_progress"),
  publishTest: (orderId, testId) => get().setTestStatus(orderId, testId, "result_published"),

  approveAll: (orderId) =>
    set((s) => ({
      orders: updateOrder(s.orders, orderId, (o) => ({
        ...o,
        tests: o.tests.map((t): OrderTest =>
          t.status === "result_entered" ? { ...t, status: "result_approved" } : t,
        ),
      })),
    })),

  publishAll: (orderId) =>
    set((s) => ({
      orders: updateOrder(s.orders, orderId, (o) => ({
        ...o,
        tests: o.tests.map((t): OrderTest =>
          t.status === "result_approved" || t.status === "result_entered"
            ? { ...t, status: "result_published" }
            : t,
        ),
      })),
    })),

  settleInvoice: (orderId, details) =>
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId && o.number !== orderId) return o;
        const nextPaid = Math.min(o.totals.total, o.totals.paid + Math.max(details.amount, 0));
        const nextStatus: Order["paymentStatus"] =
          nextPaid <= 0 ? "Unpaid" : nextPaid >= o.totals.total ? "Paid" : "Partial";
        return appendInvoiceActivity(
          {
            ...o,
            paymentStatus: nextStatus,
            paymentMethod: details.method || o.paymentMethod,
            transactionId: details.transactionId || o.transactionId,
            paymentDate: new Date().toISOString(),
            totals: { ...o.totals, paid: nextPaid },
          },
          {
            type: "payment",
            title: nextStatus === "Paid" ? "Invoice settled" : "Payment recorded",
            description:
              details.note?.trim() ||
              `${details.method} payment recorded for ₹${Math.max(details.amount, 0).toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}.`,
            by: details.by?.trim() || "Billing Desk",
          },
        );
      }),
    })),

  cancelInvoice: (orderId, details) =>
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId && o.number !== orderId) return o;
        return appendInvoiceActivity(
          {
            ...o,
            paymentStatus: "Unpaid",
            paymentMethod: undefined,
            transactionId: undefined,
            paymentDate: undefined,
            totals: { ...o.totals, paid: 0 },
          },
          {
            type: "cancelled",
            title: "Invoice cancelled",
            description: details?.reason?.trim() || "Invoice was cancelled and payment reset.",
            by: details?.by?.trim() || "Billing Desk",
          },
        );
      }),
    })),

  logInvoiceActivity: (orderId, activity) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId || o.number === orderId ? appendInvoiceActivity(o, activity) : o,
      ),
    })),

  addPatient: (p) => set((s) => ({ patients: [p, ...s.patients] })),
  addOrder: (o) => set((s) => ({ orders: [o, ...s.orders] })),

  toggleTest: (testId) =>
    set((s) => ({
      tests: s.tests.map((t) => (t.id === testId ? { ...t, enabled: !t.enabled } : t)),
    })),

  togglePackage: (packageId) =>
    set((s) => ({
      packages: s.packages.map((p) => (p.id === packageId ? { ...p, enabled: !p.enabled } : p)),
    })),

  updateTestPrice: (testId, price) =>
    set((s) => ({
      tests: s.tests.map((t) => (t.id === testId ? { ...t, price } : t)),
    })),
}));

export { buildTimeline };
