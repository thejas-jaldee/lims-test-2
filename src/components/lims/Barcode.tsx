import { cn } from "@/lib/utils";

interface BarcodeProps {
  value?: string;
  className?: string;
  showValue?: boolean;
}

/**
 * Decorative barcode used in order and invoice headers.
 * It is visual only and not intended for scanning.
 */
export function Barcode({ value, className, showValue = true }: BarcodeProps) {
  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <div className="barcode h-9 w-[136px] sm:h-10 sm:w-[150px]" aria-hidden="true" />
      {showValue && value && (
        <div className="text-[10px] font-medium tracking-[0.06em] text-muted-foreground sm:text-[11px]">
          {value}
        </div>
      )}
    </div>
  );
}
