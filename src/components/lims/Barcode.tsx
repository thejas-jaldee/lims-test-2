import { cn } from "@/lib/utils";

interface BarcodeProps {
  value?: string;
  className?: string;
  showValue?: boolean;
}

/**
 * Decorative SVG-style barcode for invoice / order headers.
 * Not a real barcode — the design uses it as a visual element only.
 */
export function Barcode({ value, className, showValue = true }: BarcodeProps) {
  return (
    <div className={cn("flex flex-col items-end gap-1", className)}>
      <div className="barcode h-12 w-44 rounded-sm" aria-hidden="true" />
      {showValue && value && (
        <div className="text-[11px] font-medium tracking-wider text-muted-foreground">{value}</div>
      )}
    </div>
  );
}
