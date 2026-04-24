import { X } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  closeClassName?: string;
}

const widths = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
  "2xl": "max-w-5xl",
};

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = "lg",
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
  closeClassName,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-xl",
          widths[width],
          className,
        )}
      >
        {title && (
          <div
            className={cn(
              "flex items-center justify-between border-b border-border px-5 py-4",
              headerClassName,
            )}
          >
            <div className="text-base font-semibold">{title}</div>
            <button
              onClick={onClose}
              className={cn("rounded-md p-1 text-muted-foreground hover:bg-muted", closeClassName)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className={cn("max-h-[70vh] overflow-y-auto", bodyClassName)}>{children}</div>
        {footer && (
          <div
            className={cn(
              "flex items-center justify-end gap-2  border-border  px-5 py-3",
              footerClassName,
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
