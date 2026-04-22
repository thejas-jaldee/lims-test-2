import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutGrid,
  UserPlus,
  BedDouble,
  FlaskConical,
  Users,
  UsersRound,
  FileText,
  BarChart3,
  FolderClosed,
  CheckSquare,
  MonitorSmartphone,
  UserCog,
  ScrollText,
  Settings,
  ChevronDown,
  ChevronLeft,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SecondaryItem {
  label: string;
  icon: LucideIcon;
  to?: string;
  active?: boolean;
}

const items: SecondaryItem[] = [
  { label: "Overview", icon: LayoutGrid },
  { label: "OP-Patient", icon: UserPlus },
  { label: "In-Patient", icon: BedDouble },
  { label: "LIMS", icon: FlaskConical, to: "/lims" },
  { label: "Patients", icon: Users },
  { label: "Users", icon: UsersRound },
  { label: "Finance", icon: FileText },
  { label: "Reports", icon: BarChart3 },
  { label: "Drive", icon: FolderClosed },
  { label: "Tasks", icon: CheckSquare },
  { label: "Membership", icon: MonitorSmartphone },
  { label: "Leads", icon: UserCog },
  { label: "Audit Log", icon: ScrollText },
  { label: "Settings", icon: Settings },
];

export function SecondarySidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative hidden shrink-0 flex-col border-r border-[oklch(0.9_0.008_250)] bg-surface py-4 md:flex",
        collapsed ? "w-0 overflow-hidden border-r-0" : "w-[208px]",
      )}
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-[11px] top-[-15px] z-100 hidden h-7 w-7 items-center justify-center rounded-[8px] bg-[oklch(0.16_0_0)] text-white shadow-[0_10px_18px_oklch(0.16_0_0_/_0.24)] md:flex"
        aria-label="Toggle sidebar"
      >
        <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform", collapsed && "rotate-180")} />
      </button>

      {!collapsed && (
        <>
          <div className="px-3 pb-4">
            <button
              type="button"
              className="flex h-[46px] w-full items-center justify-between rounded-[12px] border border-[oklch(0.87_0.01_250)] bg-surface px-4 text-[14px] font-medium tracking-[-0.03em] text-[oklch(0.58_0.03_250)] shadow-[inset_0_1px_0_oklch(1_0_0)]"
            >
              Thrissur
              <ChevronDown className="h-4 w-4 text-[oklch(0.56_0.04_250)]" />
            </button>
          </div>

          <nav className="flex flex-col gap-1 px-3">
            {items.map((item) => {
              const Icon = item.icon;
              const isLims = item.label === "LIMS";
              const isActive =
                (item.to && location.pathname.startsWith(item.to)) ||
                (isLims && location.pathname.startsWith("/lims"));
              const inner = (
                <div
                  className={cn(
                    "flex items-center gap-2.5 rounded-[10px] px-3 py-[11px] text-[13px] tracking-[-0.025em] transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-none"
                      : "text-[oklch(0.64_0.024_250)] hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-[oklch(0.64_0.024_250)]")}
                    strokeWidth={1.8}
                  />
                  <span className={cn("font-semibold", isActive && "font-semibold")}>{item.label}</span>
                </div>
              );
              return item.to ? (
                <Link key={item.label} to={item.to}>
                  {inner}
                </Link>
              ) : (
                <button key={item.label} type="button" className="w-full text-left">
                  {inner}
                </button>
              );
            })}
          </nav>
        </>
      )}
    </aside>
  );
}
