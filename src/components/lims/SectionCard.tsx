import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type IconTone = "info" | "warning" | "success" | "violet" | "primary";

interface SectionCardProps {
  title?: ReactNode;
  right?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  padding?: "default" | "tight" | "none";
  icon?: React.ComponentType<{ className?: string }>;
  iconTone?: IconTone;
}

const iconToneClass: Record<IconTone, string> = {
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-[oklch(0.55_0.16_55)]",
  success: "bg-success-soft text-success",
  violet: "bg-violet-soft text-violet",
  primary: "bg-primary-soft text-primary",
};

export function SectionCard({ title, right, subtitle, children, className, bodyClassName, padding = "default", icon: Icon, iconTone = "info" }: SectionCardProps) {
  return (
    <section className={cn("rounded-2xl border border-border bg-surface", className)}>
      {(title || right) && (
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", iconToneClass[iconTone])}>
                <Icon className="h-4.5 w-4.5" />
              </div>
            )}
            <div>
              {title && <div className="text-base font-semibold">{title}</div>}
              {subtitle && <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>}
            </div>
          </div>
          {right && <div className="flex items-center gap-2">{right}</div>}
        </header>
      )}
      <div className={cn(padding === "default" && "p-5", padding === "tight" && "p-3", bodyClassName)}>{children}</div>
    </section>
  );
}

export function FieldLabel({ children, optional }: { children: ReactNode; optional?: boolean }) {
  return (
    <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-foreground">
      {children}
      {optional && <span className="text-[10px] font-normal uppercase text-muted-foreground">Optional</span>}
    </label>
  );
}
