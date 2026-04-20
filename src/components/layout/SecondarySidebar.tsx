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
        "relative hidden shrink-0 flex-col border-r border-border bg-surface py-3 md:flex",
        collapsed ? "w-0 overflow-hidden border-r-0" : "w-[232px]",
      )}
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-3 z-10 hidden h-6 w-6 items-center justify-center rounded-md bg-foreground text-background shadow md:flex"
        aria-label="Toggle sidebar"
      >
        <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform", collapsed && "rotate-180")} />
      </button>

      {!collapsed && (
        <>
          <div className="px-3 pb-3">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground"
            >
              Thrissur
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <nav className="flex flex-col gap-0.5 px-2">
            {items.map((item) => {
              const Icon = item.icon;
              const isLims = item.label === "LIMS";
              const isActive =
                (item.to && location.pathname.startsWith(item.to)) ||
                (isLims && location.pathname.startsWith("/lims"));
              const inner = (
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/80 hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-foreground/60")}
                    strokeWidth={1.75}
                  />
                  <span className={cn("font-medium", isActive && "font-semibold")}>{item.label}</span>
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
