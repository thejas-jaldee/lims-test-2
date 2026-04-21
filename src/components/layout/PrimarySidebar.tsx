import { Link } from "@tanstack/react-router";
import {
  Home,
  CalendarDays,
  ShieldPlus,
  ShoppingCart,
  TrendingUp,
  Landmark,
  ChevronsRight,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrimaryItem {
  label: string;
  icon: LucideIcon;
  to?: string;
  active?: boolean;
}

const items: PrimaryItem[] = [
  { label: "Home", icon: Home },
  { label: "Bookings", icon: CalendarDays },
  { label: "Health", icon: ShieldPlus, to: "/lims", active: true },
  { label: "Karty", icon: ShoppingCart },
  { label: "Lending", icon: TrendingUp },
  { label: "Finance", icon: Landmark },
  { label: "More", icon: ChevronsRight },
  { label: "Settings", icon: Settings },
];

export function PrimarySidebar() {
  return (
    <aside className="hidden w-[74px] shrink-0 flex-col items-stretch gap-1 border-r border-border bg-surface py-4 md:flex">
      {items.map((item) => {
        const Icon = item.icon;
        const inner = (
          <div
            className={cn(
              "flex flex-col items-center gap-1.5 border-r-[3px] border-transparent px-2 py-3 text-[10px] font-semibold tracking-[-0.02em] transition-colors",
              item.active
                ? "bg-primary-soft text-primary border-r-primary"
                : "text-[oklch(0.68_0.025_250)] hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className={cn("h-5 w-5", item.active && "text-primary")} strokeWidth={1.8} />
            <span className="text-center leading-none">{item.label}</span>
          </div>
        );
        return item.to ? (
          <Link key={item.label} to={item.to}>
            {inner}
          </Link>
        ) : (
          <button key={item.label} type="button" className="text-left">
            {inner}
          </button>
        );
      })}
    </aside>
  );
}
