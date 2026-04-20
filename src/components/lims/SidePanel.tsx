import { X } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: "sm" | "md" | "lg";
  className?: string;
}

const widths = { sm: "w-[380px]", md: "w-[460px]", lg: "w-[560px]" };

export function SidePanel({ open, onClose, title, subtitle, children, footer, width = "md", className }: SidePanelProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={cn("fixed inset-0 z-50 transition-opacity", open ? "opacity-100" : "pointer-events-none opacity-0")}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-[1px]" onClick={onClose} />
      <aside
        className={cn(
          "absolute right-0 top-0 flex h-full max-w-full flex-col border-l border-border bg-surface shadow-2xl transition-transform",
          widths[width],
          open ? "translate-x-0" : "translate-x-full",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            {title && <div className="text-base font-semibold">{title}</div>}
            {subtitle && <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-border bg-surface-muted px-5 py-3">
            {footer}
          </div>
        )}
      </aside>
    </div>
  );
}
