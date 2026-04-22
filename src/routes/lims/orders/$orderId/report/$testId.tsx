import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Printer, Share2, Download, Edit3 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Barcode } from "@/components/lims/Barcode";
import { getTest, formatDate, type Order } from "@/data/lims";
import { useLimsStore } from "@/store/limsStore";

export const Route = createFileRoute("/lims/orders/$orderId/report/$testId")({
  head: ({ params }) => ({
    meta: [
      { title: `Report ${params.testId} — LIMS` },
      { name: "description", content: `Final lab report for test ${params.testId}.` },
    ],
  }),
  loader: ({ params }): { order: Order; testId: string } => {
    const order = useLimsStore.getState().getOrder(params.orderId);
    if (!order) throw notFound();
    return { order, testId: params.testId };
  },
  component: ReportView,
});

function ReportView() {
  const { order, testId } = Route.useLoaderData() as { order: Order; testId: string };
  const getPatient = useLimsStore((s) => s.getPatient);
  const test = getTest(testId);
  const patient = getPatient(order.patientId)!;
  if (!test) return <div className="p-8 text-center">Test not found.</div>;
  const params = test.parameters ?? [];

  return (
    <div>
      <PageHeader
        title="Report"
        backTo="/lims/orders/$orderId"
        right={
          <>
            <button className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-medium hover:bg-muted">
              <Printer className="h-4 w-4" /> Print
            </button>
            <button className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-medium hover:bg-muted">
              <Share2 className="h-4 w-4" /> Share
            </button>
            <button className="inline-flex h-10 items-center gap-2 rounded-md bg-foreground px-4 text-sm font-semibold text-background hover:opacity-90">
              <Download className="h-4 w-4" /> Download
            </button>
          </>
        }
      />

      <div className="mb-3 flex items-center justify-between rounded-xl border border-border bg-surface p-3">
        <div className="text-sm">
          <span className="text-muted-foreground">Report Layout: </span>
          <span className="font-semibold">Classic Standard</span>
        </div>
        <button className="inline-flex items-center gap-1 text-sm font-medium text-primary">
          <Edit3 className="h-3.5 w-3.5" /> Change
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <section className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="grid grid-cols-[1fr_auto] gap-6 border-b border-border p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-soft text-violet">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
                  <path d="M12 2l1.6 4.2L18 8l-4.4 1.8L12 14l-1.6-4.2L6 8l4.4-1.8L12 2z" />
                </svg>
              </div>
              <div>
                <div className="text-xl font-bold">Global Care Hospital</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Main Road, Thrissur, Kerala — 680001 · +91 487 2999 999
                </div>
              </div>
            </div>
            <Barcode value={`${order.number}-RPT`} />
          </div>

          <div className="grid grid-cols-2 gap-4 border-b border-border p-6 text-xs md:grid-cols-4">
            <Meta label="Report No" value={`RPT-${order.number}`} />
            <Meta label="Order Date" value={formatDate(order.createdAt)} />
            <Meta label="Report Date" value={formatDate(order.createdAt)} />
            <Meta label="Ref. Doctor" value={order.referredBy} />
          </div>

          <div className="border-b border-border p-6">
            <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Patient</div>
                <div className="mt-1 text-base font-semibold">{patient.name}</div>
                <div className="text-xs text-muted-foreground">{patient.id} · {patient.age}y {patient.gender}</div>
              </div>
              <div className="text-sm md:text-right">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Test</div>
                <div className="mt-1 font-semibold">{test.name}</div>
                <div className="text-xs text-muted-foreground">{test.code} · {test.department}</div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-strong text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-2">Test Result</th>
                  <th className="py-2">Result</th>
                  <th className="py-2">Unit</th>
                  <th className="py-2">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {params.map((p) => (
                  <tr key={p.parameter}>
                    <td className="py-3 font-medium">{p.parameter}</td>
                    <td className="py-3 font-bold">{((p.rangeLow + p.rangeHigh) / 2).toFixed(1)}</td>
                    <td className="py-3 text-muted-foreground">{p.unit}</td>
                    <td className="py-3 text-muted-foreground">{p.rangeLow} – {p.rangeHigh}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Peripheral Blood Film
              </div>
              <p className="mt-2 text-sm">
                Normocytic normochromic RBCs, no abnormal cells seen. Platelets adequate on smear.
              </p>
            </div>

            <div className="mt-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Clinical Interpretation / Remarks
              </div>
              <p className="mt-2 text-sm">
                Within normal limits. No clinically significant abnormalities detected. Suggest routine follow-up.
              </p>
            </div>

            <div className="mt-10 flex items-end justify-end">
              <div className="text-right">
                <div className="border-b border-border pb-1 text-sm font-semibold italic">Dr. Anand K.</div>
                <div className="mt-1 text-xs text-muted-foreground">MBBS, MD Pathology · Reg. KMC-19283</div>
                <div className="text-[10px] text-muted-foreground">Digitally verified · {formatDate(order.createdAt)}</div>
              </div>
            </div>
          </div>
        </section>

        <aside className="rounded-2xl border border-border bg-surface p-5">
          <div className="text-sm font-semibold">Recipient</div>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Patient" value={patient.name} />
            <Row label="Phone" value={patient.phone} />
            <Row label="Email" value={<span className="text-xs">{patient.email}</span>} />
            <Row label="Ref. Doctor" value={order.referredBy} />
          </dl>
        </aside>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
