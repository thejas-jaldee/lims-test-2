import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Monitor,
  Beaker,
  AlertCircle,
  Calendar,
  ChevronDown,
} from "lucide-react";
import {
  BarChart as RBarChart,
  Bar,
  LineChart as RLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  dashboardKpis,
  mostOrderedTests,
  orderVolume7d,
  machineSummary,
  connectedAnalyzers,
  technicianPerformance,
} from "@/data/lims";
import { getCdnPath } from "@/lib/cdn";
import { cn } from "@/lib/utils";

const cdpath = getCdnPath();
const createorderIconSrc = cdpath
  ? `${cdpath}/assets/images/lims/createorder.gif`
  : "/assets/images/lims/createorder.gif";
  const ordersIconSrc = cdpath
  ? `${cdpath}/assets/images/lims/orders.gif`
  : "/assets/images/lims/orders.gif";
  const patientsIconSrc = cdpath
  ? `${cdpath}/assets/images/lims/patients.gif`
  : "/assets/images/lims/patients.gif";
  const reportsIconSrc = cdpath
  ? `${cdpath}/assets/images/lims/reports.gif`
  : "/assets/images/lims/reports.gif";
  const samplesIconSrc = cdpath
  ? `${cdpath}/assets/images/lims/samples.gif`
  : "/assets/images/lims/samples.gif";
  const testpackageIconSrc = cdpath
  ? `${cdpath}/assets/images/lims/testpackage.gif`
  : "/assets/images/lims/testpackage.gif";
  const validateIconSrc = cdpath
  ? `${cdpath}/assets/images/lims/validate.gif`
  : "/assets/images/lims/validate.gif";
  

const quickActions = [
  { label: "Create Order", to: "/lims/orders/new", iconSrc: createorderIconSrc },
  { label: "Orders", to: "/lims/orders", iconSrc: ordersIconSrc },
  { label: "Samples", to: "/lims/samples", iconSrc: samplesIconSrc },
  { label: "Tests", to: "/lims/tests", iconSrc: reportsIconSrc },
  { label: "Test Package", to: "/lims/tests", iconSrc: testpackageIconSrc },
  { label: "Validate", to: "/lims/validation", iconSrc: validateIconSrc },
  { label: "Patients", to: "/lims/patients", iconSrc: patientsIconSrc },
  { label: "Reports", to: "/lims/reports", iconSrc: reportsIconSrc },
] as const;

// KPI badge icons (small colored squares on the right of each KPI card)
const KpiBadge = ({ kind }: { kind: string }) => {
  const map: Record<string, { bg: string; fg: string; svg: React.ReactNode }> = {
    hourglass: {
      bg: "bg-warning-soft",
      fg: "text-[oklch(0.6_0.15_55)]",
      svg: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2h12M6 22h12M6 2v6l6 4 6-4V2M6 22v-6l6-4 6 4v6" strokeLinejoin="round" />
        </svg>
      ),
    },
    flask: {
      bg: "bg-info-soft",
      fg: "text-info",
      svg: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 3h6M10 3v7L4 20a2 2 0 002 3h12a2 2 0 002-3l-6-10V3" strokeLinejoin="round" />
        </svg>
      ),
    },
    clipboard: {
      bg: "bg-violet-soft",
      fg: "text-violet",
      svg: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="5" y="4" width="14" height="18" rx="2" />
          <path d="M9 2h6v4H9z" />
          <path d="M9 13l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    alert: {
      bg: "bg-danger-soft",
      fg: "text-danger",
      svg: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 3 22 20 2 20 12 3" strokeLinejoin="round" />
          <path d="M12 10v4M12 17h0" strokeLinecap="round" />
        </svg>
      ),
    },
    timer: {
      bg: "bg-success-soft",
      fg: "text-success",
      svg: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2 2M9 2h6" strokeLinecap="round" />
        </svg>
      ),
    },
  };
  const item = map[kind] ?? map.hourglass;
  return (
    <div className={cn("flex h-9 w-9 items-center justify-center rounded-[12px]", item.bg, item.fg)}>
      {item.svg}
    </div>
  );
};

export const Route = createFileRoute("/lims/")({
  head: () => ({
    meta: [
      { title: "LIMS Dashboard — Global Care Hospital" },
      {
        name: "description",
        content:
          "Live overview of lab orders, samples, validations, machine integration and technician performance.",
      },
    ],
  }),
  component: LimsDashboard,
});

function LimsDashboard() {
  return (
    <div className="flex flex-col gap-4">
      {/* Header + Quick Actions */}
      <section className="rounded-[12px] bg-surface px-4 pb-4 pt-5 shadow-[var(--shadow-card)]">
        <h1 className="text-[26px] font-bold tracking-[-0.05em] text-black">LIMS Dashboard</h1>
        <p className="mt-1 text-[14px] font-medium tracking-[-0.03em] text-[oklch(0.78_0.02_250)]">
          Welcome back! Here&apos;s your lab overview.
        </p>

        <div className="mt-4 border-t border-[oklch(0.94_0.008_250)] pt-4" />

        <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-8">
          {quickActions.map(({ label, to, iconSrc }) => (
            <Link
              key={label}
              to={to}
              className="group flex min-h-[108px] flex-col items-center justify-center gap-2 rounded-[10px] border border-[oklch(0.94_0.008_250)] bg-surface px-2.5 py-3 text-center shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
            >
              <div className="scale-100">
                <img
                  src={iconSrc}
                  alt=""
                  aria-hidden="true"
                  className="h-[58px] w-[58px] object-contain"
                />
              </div>
              <span className="text-[13px] font-semibold leading-tight tracking-[-0.03em] text-[oklch(0.44_0.04_250)]">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* KPIs */}
      <section>
        <h2 className="mb-2.5 text-[16px] font-bold tracking-[-0.04em] text-[oklch(0.35_0.04_250)]">
          Sample Workflow Status
        </h2>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
          {dashboardKpis.map((kpi) => {
            const positive = kpi.delta.startsWith("+");
            return (
              <div
                key={kpi.key}
                className="rounded-[10px] bg-surface px-3.5 py-3 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="max-w-[110px] text-[11px] font-medium tracking-[-0.03em] text-[oklch(0.67_0.02_250)]">
                    {kpi.label}
                  </span>
                  <KpiBadge kind={kpi.icon} />
                </div>
                <div className="justify-between flex items-baseline gap-1.5">
                  <span className="text-[25px] font-bold leading-none tracking-[-0.06em] text-[oklch(0.34_0.05_250)]">
                    {typeof kpi.value === "number" && kpi.value < 10 ? `0${kpi.value}` : kpi.value}
                  </span>
                  {"suffix" in kpi && kpi.suffix && (
                    <span className="text-[12px] font-semibold tracking-[-0.03em] text-[oklch(0.38_0.04_250)]">
                      {kpi.suffix}
                    </span>
                  )}
                   <div className="mt-2 flex items-baseline justify-end gap-1 text-[10px] tracking-[-0.02em]">
                  <span className={cn("font-medium", positive ? "text-[oklch(0.65_0.17_165)]" : "text-danger")}>
                    {kpi.delta}
                  </span>{" "}
                  <span className="text-[oklch(0.42_0.04_250)]">vs. last week</span>
                </div>
                </div>
               
              </div>
            );
          })}
        </div>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <ChartCard title="Most Ordered Tests">
          <ResponsiveContainer width="100%" height="100%">
            <RBarChart data={mostOrderedTests as unknown as Array<{ code: string; value: number; color: string }>} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="0" stroke="oklch(0.93 0.008 250)" vertical={false} />
              <XAxis dataKey="code" axisLine={false} tickLine={false} tick={{ fill: "oklch(0.65 0.025 250)", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "oklch(0.65 0.025 250)", fontSize: 12 }} domain={[0, 250]} ticks={[0, 50, 100, 150, 200, 250]} />
              <Tooltip
                cursor={{ fill: "oklch(0.96 0.01 250)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid oklch(0.92 0.01 250)",
                  fontSize: 12,
                  padding: "12px 16px",
                  boxShadow: "0 18px 36px oklch(0.2 0.01 250 / 0.08)",
                }}
                labelFormatter={() => "Orders"}
                formatter={(value: number, _name, item) => [`${item?.payload?.code}  ${value}`, ""]}
              />
              <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={48}>
                {mostOrderedTests.map((d) => (
                  <Cell key={d.code} fill={d.color} />
                ))}
              </Bar>
            </RBarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 text-[7px] font-medium text-[oklch(0.62_0.025_250)]">
            {mostOrderedTests.map((d) => (
              <div key={d.code} className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                {d.code}
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Order Volume">
          <ResponsiveContainer width="100%" height="100%">
            <RLineChart data={orderVolume7d as unknown as Array<{ day: string; value: number }>} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="6 7" stroke="oklch(0.9 0.012 230)" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "oklch(0.65 0.025 250)", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "oklch(0.65 0.025 250)", fontSize: 12 }} domain={[0, 250]} ticks={[0, 50, 100, 150, 200, 250]} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid oklch(0.92 0.01 250)",
                  fontSize: 12,
                  padding: "12px 16px",
                  boxShadow: "0 18px 36px oklch(0.2 0.01 250 / 0.08)",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="oklch(0.68 0.15 188)"
                strokeWidth={5}
                dot={false}
                activeDot={{ r: 6, fill: "oklch(0.68 0.15 188)" }}
              />
            </RLineChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      {/* Machine Integration */}
      <section>
        <h2 className="mb-2.5 text-[16px] font-bold tracking-[-0.04em] text-[oklch(0.35_0.04_250)]">
          Machine Integration Status
        </h2>
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          {machineSummary.map((m, idx) => {
            const Icon = m.icon === "monitor" ? Monitor : m.icon === "flask" ? Beaker : AlertCircle;
            const tone =
              m.tone === "info"
                ? "bg-[linear-gradient(180deg,oklch(0.48_0.14_245),oklch(0.72_0.16_235))] text-white"
                : m.tone === "warning"
                  ? "bg-[linear-gradient(180deg,oklch(0.74_0.16_60),oklch(0.86_0.12_80))] text-white"
                  : "bg-[linear-gradient(180deg,oklch(0.59_0.22_25),oklch(0.71_0.18_22))] text-white";
            return (
              <div
                key={`${m.key}-${idx}`}
                className="flex items-center gap-3 rounded-[10px] bg-surface p-3 shadow-[var(--shadow-card)]"
              >
                <div className={cn("flex h-[56px] w-[56px] items-center justify-center rounded-[12px]", tone)}>
                  <Icon className="h-7 w-7" strokeWidth={2.4} />
                </div>
                <div>
                  <div className="text-[27px] font-bold leading-none tracking-[-0.06em] text-[oklch(0.34_0.05_250)]">
                    {m.value}
                  </div>
                  <div className="mt-1 text-[12px] font-medium tracking-[-0.03em] text-[oklch(0.66_0.024_250)]">
                    {m.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Analyzers + Technician */}
      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="rounded-[10px] bg-surface px-4 py-3 shadow-[var(--shadow-card)]">
          <div className="mb-2 flex items-center gap-2 text-[14px] font-semibold tracking-[-0.03em]">
            <Monitor className="h-4 w-4 text-[oklch(0.52_0.02_250)]" /> Connected Analyzers
          </div>
          <ul className="divide-y divide-border">
            {connectedAnalyzers.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-1.5 h-3 w-3 rounded-full",
                      a.online ? "bg-success" : "bg-danger",
                    )}
                  />
                  <div>
                    <div className="text-[14px] font-medium tracking-[-0.03em]">{a.name}</div>
                    <div className="mt-0.5 text-[11px] text-[oklch(0.66_0.024_250)]">{a.id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {a.online && (
                    <div className="text-right">
                      <div className="text-[10px] text-[oklch(0.66_0.024_250)]">Queue</div>
                      <div className="text-[12px] font-medium tracking-[-0.03em]">{a.queue} samples</div>
                    </div>
                  )}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
                      a.online ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
                    )}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {a.online ? "Online" : "Offline"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[10px] bg-surface px-4 py-3 shadow-[var(--shadow-card)]">
          <div className="mb-2 text-[14px] font-semibold tracking-[-0.03em]">Technician Performance</div>
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] font-medium text-[oklch(0.5_0.02_250)]">
                <th className="py-2">Technician</th>
                <th className="py-2">Completed</th>
                <th className="py-2">Pending</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {technicianPerformance.map((t) => (
                <tr key={t.name} className="text-[14px] tracking-[-0.03em]">
                  <td className="py-3 font-medium">{t.name}</td>
                  <td className="py-3 text-[oklch(0.35_0.04_250)]">{t.completed}</td>
                  <td className="py-2">
                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-warning-soft px-2 text-[12px] font-semibold text-[oklch(0.5_0.13_70)]">
                      {t.pending}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[10px] bg-surface p-3.5 shadow-[var(--shadow-card)]">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[15px] font-bold tracking-[-0.04em] text-[oklch(0.35_0.04_250)]">
          {title}
        </div>
        <button className="inline-flex items-center gap-1.5 px-1 py-1 text-[11px] font-semibold tracking-[-0.03em] text-primary">
          <Calendar className="h-3.5 w-3.5" /> Last 7 Days
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="h-[270px] w-full">{children}</div>
    </div>
  );
}
