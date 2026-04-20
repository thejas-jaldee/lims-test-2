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
  <svg viewBox="0 0 64 64" className="h-12 w-12">
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
  <svg viewBox="0 0 64 64" className="h-12 w-12">
    <rect x="12" y="10" width="40" height="46" rx="4" fill="#E0E7FF" />
    <rect x="18" y="18" width="28" height="8" rx="2" fill="#6366F1" />
    <text x="32" y="24.5" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="700">ORDER</text>
    <rect x="18" y="32" width="28" height="3" rx="1.5" fill="#A5B4FC" />
    <rect x="18" y="38" width="20" height="3" rx="1.5" fill="#A5B4FC" />
    <rect x="18" y="44" width="24" height="3" rx="1.5" fill="#A5B4FC" />
  </svg>
);
const SamplesIcon = () => (
  <svg viewBox="0 0 64 64" className="h-12 w-12">
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
  <svg viewBox="0 0 64 64" className="h-12 w-12">
    <path d="M22 10h20v14L52 50a4 4 0 01-3.5 6h-33A4 4 0 0112 50l10-26V10z" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
    <path d="M18 42h28l4 8a2 2 0 01-1.8 3H15.8A2 2 0 0114 50l4-8z" fill="#F59E0B" />
    <circle cx="26" cy="46" r="2" fill="#fff" />
    <circle cx="36" cy="48" r="1.5" fill="#fff" />
  </svg>
);
const TestPackageIcon = () => (
  <svg viewBox="0 0 64 64" className="h-12 w-12">
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
  <svg viewBox="0 0 64 64" className="h-12 w-12">
    <path d="M20 18h12l4 22H16l4-22z" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5" />
    <rect x="22" y="14" width="8" height="6" rx="1" fill="#F59E0B" />
    <circle cx="44" cy="40" r="10" fill="#10B981" />
    <path d="M40 40l3 3 5-6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);
const PatientsIcon = () => (
  <svg viewBox="0 0 64 64" className="h-12 w-12">
    <circle cx="32" cy="32" r="22" fill="none" stroke="#F472B6" strokeWidth="6" strokeDasharray="20 8" />
    <circle cx="32" cy="26" r="6" fill="#8B5CF6" />
    <path d="M20 44c2-6 7-9 12-9s10 3 12 9" fill="#8B5CF6" />
  </svg>
);
const ReportsIcon = () => (
  <svg viewBox="0 0 64 64" className="h-12 w-12">
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
    <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", item.bg, item.fg)}>
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
    <div className="flex flex-col gap-6">
      {/* Header + Quick Actions */}
      <section className="rounded-2xl bg-surface p-7 shadow-[var(--shadow-card)]">
        <h1 className="text-2xl font-semibold tracking-tight">LIMS Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back! Here&apos;s your lab overview.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {quickActions.map(({ label, to, Icon }) => (
            <Link
              key={label}
              to={to}
              className="group flex flex-col items-center gap-3 rounded-xl bg-surface p-5 text-center shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
            >
              <Icon />
              <span className="text-xs font-medium text-foreground leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* KPIs */}
      <section>
        <h2 className="mb-3 text-base font-semibold">Sample Workflow Status</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {dashboardKpis.map((kpi) => {
            const positive = kpi.delta.startsWith("+");
            return (
              <div key={kpi.key} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                  <KpiBadge kind={kpi.icon} />
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold leading-none">{kpi.value}</span>
                  {"suffix" in kpi && kpi.suffix && (
                    <span className="text-sm font-medium text-muted-foreground">{kpi.suffix}</span>
                  )}
                </div>
                <div className="mt-2 text-xs">
                  <span className={cn("font-medium", positive ? "text-success" : "text-danger")}>
                    {kpi.delta}
                  </span>{" "}
                  <span className="text-muted-foreground">vs. last week</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Most Ordered Tests">
          <ResponsiveContainer width="100%" height="100%">
            <RBarChart data={mostOrderedTests as unknown as Array<{ code: string; value: number; color: string }>} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 4" stroke="oklch(0.92 0.008 250)" vertical={false} />
              <XAxis dataKey="code" axisLine={false} tickLine={false} tick={{ fill: "oklch(0.55 0.02 250)", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "oklch(0.55 0.02 250)", fontSize: 11 }} domain={[0, 250]} ticks={[0, 50, 100, 150, 200, 250]} />
              <Tooltip
                cursor={{ fill: "oklch(0.96 0.01 250)" }}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid oklch(0.9 0.01 250)",
                  fontSize: 12,
                  padding: "6px 10px",
                }}
                labelFormatter={() => "Orders"}
                formatter={(value: number, _name, item) => [`${item?.payload?.code}  ${value}`, ""]}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={36}>
                {mostOrderedTests.map((d) => (
                  <Cell key={d.code} fill={d.color} />
                ))}
              </Bar>
            </RBarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            {mostOrderedTests.map((d) => (
              <div key={d.code} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                {d.code}
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Order Volume">
          <ResponsiveContainer width="100%" height="100%">
            <RLineChart data={orderVolume7d as unknown as Array<{ day: string; value: number }>} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 4" stroke="oklch(0.92 0.008 250)" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "oklch(0.55 0.02 250)", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "oklch(0.55 0.02 250)", fontSize: 11 }} domain={[0, 250]} ticks={[0, 50, 100, 150, 200, 250]} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid oklch(0.9 0.01 250)",
                  fontSize: 12,
                  padding: "6px 10px",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="oklch(0.62 0.13 175)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "oklch(0.62 0.13 175)" }}
                activeDot={{ r: 5 }}
              />
            </RLineChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      {/* Machine Integration */}
      <section>
        <h2 className="mb-3 text-base font-semibold">Machine Integration Status</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {machineSummary.map((m, idx) => {
            const Icon = m.icon === "monitor" ? Monitor : m.icon === "flask" ? Beaker : AlertCircle;
            const tone =
              m.tone === "info"
                ? "bg-[oklch(0.62_0.18_245)] text-white"
                : m.tone === "warning"
                  ? "bg-[oklch(0.75_0.14_60)] text-white"
                  : "bg-[oklch(0.62_0.22_25)] text-white";
            return (
              <div
                key={`${m.key}-${idx}`}
                className="flex items-center gap-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-card)]"
              >
                <div className={cn("flex h-16 w-16 items-center justify-center rounded-xl", tone)}>
                  <Icon className="h-8 w-8" strokeWidth={2.2} />
                </div>
                <div>
                  <div className="text-2xl font-semibold leading-none">{m.value}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{m.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Analyzers + Technician */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-card)]">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Monitor className="h-4 w-4 text-muted-foreground" /> Connected Analyzers
          </div>
          <ul className="divide-y divide-border">
            {connectedAnalyzers.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 rounded-full",
                      a.online ? "bg-success" : "bg-danger",
                    )}
                  />
                  <div>
                    <div className="text-sm font-medium">{a.name}</div>
                    <div className="text-xs text-muted-foreground">{a.id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {a.online && (
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Queue</div>
                      <div className="text-sm font-semibold">{a.queue} samples</div>
                    </div>
                  )}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                      a.online ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {a.online ? "Online" : "Offline"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-card)]">
          <div className="mb-3 text-sm font-semibold">Technician Performance</div>
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-muted-foreground">
                <th className="py-2">Technician</th>
                <th className="py-2">Completed</th>
                <th className="py-2">Pending</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {technicianPerformance.map((t) => (
                <tr key={t.name} className="text-sm">
                  <td className="py-3 font-medium">{t.name}</td>
                  <td className="py-3">{t.completed}</td>
                  <td className="py-3">
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-warning-soft px-2 text-xs font-semibold text-[oklch(0.5_0.13_70)]">
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
    <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-base font-semibold">{title}</div>
        <button className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">
          <Calendar className="h-3.5 w-3.5" /> Last 7 Days
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="h-64 w-full">{children}</div>
    </div>
  );
}
