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
import { cn } from "@/lib/utils";

// Illustrated quick-action icons (inline SVG to match the reference)
const CreateOrderIcon = () => (
  <svg viewBox="0 0 64 64" className="h-9 w-9">
    <rect x="10" y="14" width="34" height="42" rx="4" fill="#FDE7C7" />
    <rect x="14" y="20" width="22" height="3" rx="1.5" fill="#F4A261" />
    <rect x="14" y="27" width="18" height="3" rx="1.5" fill="#F4A261" />
    <rect x="14" y="34" width="22" height="3" rx="1.5" fill="#F4A261" />
    <circle cx="46" cy="20" r="10" fill="#E76F51" />
    <path d="M42 20h8M46 16v8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="48" cy="46" r="8" fill="#2A9D8F" />
    <path d="M44 46l3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);
const OrdersIcon = () => (
  <svg viewBox="0 0 64 64" className="h-9 w-9">
    <rect x="12" y="10" width="40" height="46" rx="4" fill="#E0E7FF" />
    <rect x="18" y="18" width="28" height="8" rx="2" fill="#6366F1" />
    <text x="32" y="24.5" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="700">ORDER</text>
    <rect x="18" y="32" width="28" height="3" rx="1.5" fill="#A5B4FC" />
    <rect x="18" y="38" width="20" height="3" rx="1.5" fill="#A5B4FC" />
    <rect x="18" y="44" width="24" height="3" rx="1.5" fill="#A5B4FC" />
  </svg>
);
const SamplesIcon = () => (
  <svg viewBox="0 0 64 64" className="h-9 w-9">
    {[12, 24, 36, 48].map((x, i) => (
      <g key={i}>
        <rect x={x - 4} y="14" width="8" height="36" rx="2" fill="#fff" stroke="#94A3B8" strokeWidth="1.5" />
        <rect x={x - 4} y="30" width="8" height="20" rx="2" fill="#EF4444" />
        <rect x={x - 5} y="12" width="10" height="4" rx="1" fill="#3B82F6" />
      </g>
    ))}
  </svg>
);
const TestsIcon = () => (
  <svg viewBox="0 0 64 64" className="h-9 w-9">
    <path d="M22 10h20v14L52 50a4 4 0 01-3.5 6h-33A4 4 0 0112 50l10-26V10z" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
    <path d="M18 42h28l4 8a2 2 0 01-1.8 3H15.8A2 2 0 0114 50l4-8z" fill="#F59E0B" />
    <circle cx="26" cy="46" r="2" fill="#fff" />
    <circle cx="36" cy="48" r="1.5" fill="#fff" />
  </svg>
);
const TestPackageIcon = () => (
  <svg viewBox="0 0 64 64" className="h-9 w-9">
    <rect x="10" y="14" width="44" height="36" rx="3" fill="#EDE9FE" />
    <rect x="10" y="14" width="44" height="10" fill="#8B5CF6" />
    <rect x="14" y="28" width="6" height="3" rx="1" fill="#8B5CF6" />
    <rect x="22" y="28" width="10" height="3" rx="1" fill="#C4B5FD" />
    <rect x="14" y="34" width="14" height="3" rx="1" fill="#C4B5FD" />
    <rect x="14" y="40" width="20" height="3" rx="1" fill="#C4B5FD" />
    <text x="44" y="22" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="700">A B</text>
  </svg>
);
const ValidateIcon = () => (
  <svg viewBox="0 0 64 64" className="h-9 w-9">
    <path d="M20 18h12l4 22H16l4-22z" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5" />
    <rect x="22" y="14" width="8" height="6" rx="1" fill="#F59E0B" />
    <circle cx="44" cy="40" r="10" fill="#10B981" />
    <path d="M40 40l3 3 5-6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);
const PatientsIcon = () => (
  <svg viewBox="0 0 64 64" className="h-9 w-9">
    <circle cx="32" cy="32" r="22" fill="none" stroke="#F472B6" strokeWidth="6" strokeDasharray="20 8" />
    <circle cx="32" cy="26" r="6" fill="#8B5CF6" />
    <path d="M20 44c2-6 7-9 12-9s10 3 12 9" fill="#8B5CF6" />
  </svg>
);
const ReportsIcon = () => (
  <svg viewBox="0 0 64 64" className="h-9 w-9">
    <rect x="14" y="10" width="32" height="44" rx="3" fill="#fff" stroke="#94A3B8" strokeWidth="1.5" />
    <rect x="20" y="16" width="20" height="3" rx="1" fill="#CBD5E1" />
    <rect x="20" y="22" width="14" height="3" rx="1" fill="#CBD5E1" />
    <rect x="20" y="28" width="18" height="3" rx="1" fill="#CBD5E1" />
    <rect x="20" y="34" width="12" height="3" rx="1" fill="#CBD5E1" />
    <circle cx="44" cy="46" r="10" fill="#F59E0B" />
    <path d="M44 40v6l4 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);

const quickActions = [
  { label: "Create Order", to: "/lims/orders/new", Icon: CreateOrderIcon },
  { label: "Orders", to: "/lims/orders", Icon: OrdersIcon },
  { label: "Samples", to: "/lims/samples", Icon: SamplesIcon },
  { label: "Tests", to: "/lims/tests", Icon: TestsIcon },
  { label: "Test Package", to: "/lims/tests", Icon: TestPackageIcon },
  { label: "Validate", to: "/lims/validation", Icon: ValidateIcon },
  { label: "Patients", to: "/lims/patients", Icon: PatientsIcon },
  { label: "Reports", to: "/lims/reports", Icon: ReportsIcon },
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
          {quickActions.map(({ label, to, Icon }) => (
            <Link
              key={label}
              to={to}
              className="group flex min-h-[108px] flex-col items-center justify-center gap-2 rounded-[10px] border border-[oklch(0.94_0.008_250)] bg-surface px-2.5 py-3 text-center shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
            >
              <div className="scale-100">
                <Icon />
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
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-[31px] font-bold leading-none tracking-[-0.06em] text-[oklch(0.34_0.05_250)]">
                    {typeof kpi.value === "number" && kpi.value < 10 ? `0${kpi.value}` : kpi.value}
                  </span>
                  {"suffix" in kpi && kpi.suffix && (
                    <span className="text-[12px] font-semibold tracking-[-0.03em] text-[oklch(0.38_0.04_250)]">
                      {kpi.suffix}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-baseline justify-end gap-1 text-[10px] tracking-[-0.02em]">
                  <span className={cn("font-medium", positive ? "text-[oklch(0.65_0.17_165)]" : "text-danger")}>
                    {kpi.delta}
                  </span>{" "}
                  <span className="text-[oklch(0.42_0.04_250)]">vs. last week</span>
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
          <div className="mt-2.5 flex items-center gap-4 text-[10px] font-medium text-[oklch(0.62_0.025_250)]">
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
                  <div className="text-[32px] font-bold leading-none tracking-[-0.06em] text-[oklch(0.34_0.05_250)]">
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
