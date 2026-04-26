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
    <div className="bg-surface-muted pb-10">
      <PageHeader title="Report" backTo="/lims/orders/$orderId" />

      <div className="mx-auto w-full max-w-[1390px] px-3 sm:px-4 lg:px-6">
        <section className="rounded-[10px] bg-surface px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link
              to="/lims/orders/$orderId"
              params={{ orderId: order.id }}
              className="text-[22px] font-semibold uppercase tracking-[-0.03em] text-primary underline decoration-primary/45 underline-offset-[6px]"
            >
              Order #{order.number}
            </Link>

            <div className="flex flex-wrap gap-3">
              <button className="inline-flex h-[44px] items-center justify-center gap-2 rounded-[7px] bg-[#d9d9db] px-6 text-[15px] font-bold text-[#101010]">
                <Printer className="h-5 w-5" />
                Print
              </button>
              <button className="inline-flex h-[44px] items-center justify-center gap-2 rounded-[7px] border border-border bg-surface px-6 text-[15px] font-bold text-[#101010]">
                <Share2 className="h-5 w-5" />
                Share
              </button>
              <button className="inline-flex h-[44px] items-center justify-center gap-2 rounded-[7px] bg-black px-7 text-[15px] font-bold text-white">
                <Download className="h-5 w-5" />
                Download
              </button>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[10px] bg-surface px-4 py-6 sm:px-6 lg:px-10">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[16px] text-[#1a1915]">
            <span>Selected Report Layout :</span>
            <span className="text-[18px] font-bold">Classic Standard</span>
            <button className="font-bold text-primary underline underline-offset-4">Change</button>
          </div>

          <div className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1fr)_390px]">
            <article className="min-w-0 rounded-[15px] border border-[#d8d3c8] bg-white px-5 py-6 sm:px-8 lg:px-10">
              <header className="grid gap-5 border-b-[3px] border-primary pb-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
                <div>
                  <h2 className="text-[30px] font-bold tracking-[-0.03em] text-primary">
                    Global Care Hospital
                  </h2>
                  <p className="mt-4 text-[15px] leading-7 text-[#6b6960]">
                    MG Road, Kozhikode - 673001
                    <br />
                    Phone: +91 495 280 1000 · NABL Accredited
                  </p>
                </div>
                <dl className="space-y-2 text-[15px] text-[#6b6960] lg:text-right">
                  <ReportMeta label="Report No" value={`RPT-2026-${order.number.replace("ORD-", "")}`} />
                  <ReportMeta label="Order Date" value="17 Mar 2026" />
                  <ReportMeta label="Report Date" value="17 Mar 2026" />
                  <ReportMeta label="Ref. Doctor" value="Dr. Anand K." />
                </dl>
              </header>

              <section className="mt-7 rounded-[11px] bg-[#f3f3f3] px-5 py-5">
                <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#969289]">
                  Patient Details
                </div>
                <div className="mt-3 text-[20px] font-semibold text-[#1a1915]">{patient.name}</div>
                <div className="mt-2 text-[16px] tracking-[0.08em] text-[#1a1915]">{patient.id}</div>
                <div className="mt-2 text-[16px] text-[#1a1915]">
                  {patient.age} yrs · {patient.gender}
                </div>
                <div className="mt-5 space-y-3 text-[14px] text-[#4b586f]">
                  <IconLine icon={<Phone className="h-4 w-4" />} text="+91 98765 43210" />
                  <IconLine icon={<Mail className="h-4 w-4" />} text="arjunmenon@gmail.com" />
                  <IconLine icon={<MapPin className="h-4 w-4" />} text="Thrissur,Kerala - 673614" />
                </div>
              </section>

              <h3 className="mt-12 text-center text-[30px] font-extrabold uppercase tracking-[0.08em] text-black">
                {test.name}
              </h3>

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-[680px] w-full border-collapse text-[16px]">
                  <thead>
                    <tr className="bg-black text-left text-[14px] font-bold uppercase tracking-[0.08em] text-white">
                      <th className="px-5 py-4">Test Result</th>
                      <th className="px-5 py-4">Result</th>
                      <th className="px-5 py-4">Unit</th>
                      <th className="px-5 py-4">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportRows.map((row, index) => (
                      <tr
                        key={row.test}
                        className={index % 2 === 1 ? "bg-[#eeece7]" : "bg-white"}
                      >
                        <td className="border-b border-[#ded9cf] px-5 py-4 text-[#1a1915]">{row.test}</td>
                        <td className="border-b border-[#ded9cf] px-5 py-4 font-bold text-[#1a1915]">
                          {row.result}
                        </td>
                        <td className="border-b border-[#ded9cf] px-5 py-4 text-[#1a1915]">{row.unit}</td>
                        <td className="border-b border-[#ded9cf] px-5 py-4 text-[#1a1915]">
                          {row.reference}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-12 border-b border-[#ded9cf] pb-7 text-[16px]">
                <span className="uppercase">Peripheral Blood Film: </span>
                <span className="ml-8 font-semibold">Macrocytic</span>
              </div>

              <div className="border-b border-[#ded9cf] py-7 text-[16px]">
                <div className="uppercase">Clinical Interpretation / Remarks :</div>
                <div className="mt-4 font-semibold">Normal CBC</div>
              </div>

              <div className="border-b border-[#ded9cf] py-7 text-[16px]">
                <div className="uppercase">Instrument Printout / Image</div>
              </div>

              <footer className="mt-28 border-t border-[#ded9cf] pt-8 text-right">
                <div className="text-[20px] font-bold text-[#1a1915]">Dr. Rekha Suresh</div>
                <div className="mt-4 text-[16px] text-[#6b6960]">MD Pathology · Lab Director</div>
                <div className="mt-4 text-[14px] text-[#8c887d]">
                  Digitally verified · 17 Mar 2026, 11:30 AM
                </div>
              </footer>
            </article>

            <aside className="h-max rounded-[15px] border border-[#d8d3c8] bg-white">
              <div className="border-b border-[#d8d3c8] px-6 py-5 text-[20px] font-bold">Recipient</div>
              <dl className="px-6 py-6 text-[17px]">
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
    <div className="flex items-center gap-3">
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
    <div className={`flex items-center justify-between gap-4 py-4 ${last ? "" : "border-b border-[#ded9cf]"}`}>
      <dt className="text-[#6b6960]">{label}</dt>
      <dd className={`text-right font-semibold text-[#1a1915] ${underlined ? "underline underline-offset-4" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
