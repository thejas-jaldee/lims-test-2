import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Download, Mail, MapPin, Phone, Printer, Share2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getTest, type Order } from "@/data/lims";
import { useLimsStore } from "@/store/limsStore";

export const Route = createFileRoute("/lims/orders/$orderId/report/$testId")({
  head: ({ params }) => ({
    meta: [
      { title: `Report ${params.testId} - LIMS` },
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

const cbcRows = [
  { test: "Haemoglobin", result: "15", unit: "mg/dL", reference: "13.0-17.0" },
  { test: "WBC Count", result: "8", unit: "×10³", reference: "4.0-11.0" },
  { test: "Platelet Count", result: "160", unit: "×10³", reference: "150-400" },
  { test: "MCV", result: "80", unit: "fL", reference: "80-100" },
  { test: "MCH", result: "30", unit: "pg", reference: "27-32" },
  { test: "MCHC", result: "34", unit: "U/L", reference: "35-140" },
];

function ReportView() {
  const { order, testId } = Route.useLoaderData() as { order: Order; testId: string };
  const getPatient = useLimsStore((s) => s.getPatient);
  const test = getTest(testId);
  const patient = getPatient(order.patientId);

  if (!test || !patient) return <div className="p-8 text-center">Report not found.</div>;

  const reportRows =
    test.id === "CBC-001"
      ? cbcRows
      : (test.parameters ?? []).map((parameter) => ({
          test: parameter.parameter,
          result: String((parameter.rangeLow + parameter.rangeHigh) / 2),
          unit: parameter.unit,
          reference: `${parameter.rangeLow}-${parameter.rangeHigh}`,
        }));

  return (
    <div className="bg-surface-muted pb-9">
      <PageHeader title="Report" backTo="/lims/orders/$orderId" />

      <div className="mx-auto w-full  px-3 sm:px-4 lg:px-5">
        <section className="rounded-[9px] bg-surface px-3 py-3 sm:px-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Link
              to="/lims/orders/$orderId"
              params={{ orderId: order.id }}
              className="text-[18px] font-semibold uppercase tracking-[-0.03em] text-primary underline decoration-primary/45 underline-offset-[5px]"
            >
              Order #{order.number}
            </Link>

            <div className="flex flex-wrap gap-2.5">
              <button className="inline-flex h-[36px] items-center justify-center gap-1.5 rounded-[6px] bg-[#d9d9db] px-4 text-[11px] font-bold text-[#101010]">
                <Printer className="h-3.5 w-3.5" />
                Print
              </button>
              <button className="inline-flex h-[36px] items-center justify-center gap-1.5 rounded-[6px] border border-border bg-surface px-4 text-[11px] font-bold text-[#101010]">
                <Share2 className="h-3.5 w-3.5" />
                Share
              </button>
              <button className="inline-flex h-[36px] items-center justify-center gap-1.5 rounded-[6px] bg-black px-5 text-[11px] font-bold text-white">
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
            </div>
          </div>
        </section>

        <section className="mt-3 rounded-[9px] bg-surface px-3 py-4 sm:px-4 lg:px-8">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[#1a1915]">
            <span>Selected Report Layout :</span>
            <span className="text-[14px] font-bold">Classic Standard</span>
            <button className="font-bold text-primary underline underline-offset-4">Change</button>
          </div>

          <div className="mt-4 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_385px]">
            <article className="min-w-0 rounded-[14px] border border-[#d8d3c8] bg-white px-3.5 py-4 sm:px-6 lg:px-8">
              <header className="grid gap-3.5 border-b-[3px] border-primary pb-6 lg:grid-cols-[minmax(0,1fr)_255px] lg:items-start">
                <div>
                  <h2 className="text-[26px] font-bold tracking-[-0.03em] text-primary">
                    Global Care Hospital
                  </h2>
                  <p className="mt-2.5 text-[11px] leading-5 text-[#6b6960]">
                    MG Road, Kozhikode - 673001
                    <br />
                    Phone: +91 495 280 1000 · NABL Accredited
                  </p>
                </div>
                <dl className="space-y-1 text-[11px] text-[#6b6960] lg:text-right">
                  <ReportMeta label="Report No" value={`RPT-2026-${order.number.replace("ORD-", "")}`} />
                  <ReportMeta label="Order Date" value="17 Mar 2026" />
                  <ReportMeta label="Report Date" value="17 Mar 2026" />
                  <ReportMeta label="Ref. Doctor" value="Dr. Anand K." />
                </dl>
              </header>

              <section className="mt-5 rounded-[10px] bg-[#f3f3f3] px-3.5 py-3.5">
                <div className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#969289]">
                  Patient Details
                </div>
                <div className="mt-2 text-[16px] font-semibold text-[#1a1915]">{patient.name}</div>
                <div className="mt-1 text-[12px] tracking-[0.08em] text-[#1a1915]">{patient.id}</div>
                <div className="mt-1 text-[12px] text-[#1a1915]">
                  {patient.age} yrs · {patient.gender}
                </div>
                <div className="mt-3 space-y-2 text-[10px] text-[#4b586f]">
                  <IconLine icon={<Phone className="h-3 w-3" />} text="+91 98765 43210" />
                  <IconLine icon={<Mail className="h-3 w-3" />} text="arjunmenon@gmail.com" />
                  <IconLine icon={<MapPin className="h-3 w-3" />} text="Thrissur,Kerala - 673614" />
                </div>
              </section>

              <h3 className="mt-10 text-center text-[26px] font-extrabold uppercase tracking-[0.08em] text-black">
                {test.name}
              </h3>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-[675px] w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="bg-black text-left text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                      <th className="px-3.5 py-3">Test Result</th>
                      <th className="px-3.5 py-3">Result</th>
                      <th className="px-3.5 py-3">Unit</th>
                      <th className="px-3.5 py-3">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportRows.map((row, index) => (
                      <tr
                        key={row.test}
                        className={index % 2 === 1 ? "bg-[#eeece7]" : "bg-white"}
                      >
                        <td className="border-b border-[#ded9cf] px-3.5 py-3 text-[#1a1915]">{row.test}</td>
                        <td className="border-b border-[#ded9cf] px-3.5 py-3 font-bold text-[#1a1915]">
                          {row.result}
                        </td>
                        <td className="border-b border-[#ded9cf] px-3.5 py-3 text-[#1a1915]">{row.unit}</td>
                        <td className="border-b border-[#ded9cf] px-3.5 py-3 text-[#1a1915]">
                          {row.reference}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-10 border-b border-[#ded9cf] pb-5 text-[12px]">
                <span className="uppercase">Peripheral Blood Film: </span>
                <span className="ml-6 font-semibold">Macrocytic</span>
              </div>

              <div className="border-b border-[#ded9cf] py-5 text-[12px]">
                <div className="uppercase">Clinical Interpretation / Remarks :</div>
                <div className="mt-3 font-semibold">Normal CBC</div>
              </div>

              <div className="border-b border-[#ded9cf] py-5 text-[12px]">
                <div className="uppercase">Instrument Printout / Image</div>
              </div>

              <footer className="mt-[100px] border-t border-[#ded9cf] pt-6 text-right">
                <div className="text-[16px] font-bold text-[#1a1915]">Dr. Rekha Suresh</div>
                <div className="mt-2.5 text-[12px] text-[#6b6960]">MD Pathology · Lab Director</div>
                <div className="mt-2.5 text-[10px] text-[#8c887d]">
                  Digitally verified · 17 Mar 2026, 11:30 AM
                </div>
              </footer>
            </article>

            <aside className="h-max rounded-[14px] border border-[#d8d3c8] bg-white">
              <div className="border-b border-[#d8d3c8] px-4 py-3.5 text-[16px] font-bold">Recipient</div>
              <dl className="px-4 py-4 text-[13px]">
                <RecipientRow label="Patient" value={patient.name} />
                <RecipientRow label="Phone" value="+91 98430 21234" />
                <RecipientRow label="Email" value="arjun@gmail.com" underlined />
                <RecipientRow label="Ref. Doctor" value="Dr. Anand K." last />
              </dl>
            </aside>
          </div>
        </section>
      </div>
    </div>
  );
}

function ReportMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="inline font-bold text-[#6b6960]">{label}: </dt>
      <dd className="inline">{value}</dd>
    </div>
  );
}

function IconLine({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      {icon}
      <span>{text}</span>
    </div>
  );
}

function RecipientRow({
  label,
  value,
  underlined,
  last,
}: {
  label: string;
  value: string;
  underlined?: boolean;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-3.5 py-3.5 ${last ? "" : "border-b border-[#ded9cf]"}`}>
      <dt className="text-[#6b6960]">{label}</dt>
      <dd className={`text-right font-semibold text-[#1a1915] ${underlined ? "underline underline-offset-4" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
