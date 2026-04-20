import { cn } from "@/lib/utils";

type Tone = "info" | "warning" | "danger" | "success" | "violet" | "neutral";

const toneClass: Record<Tone, string> = {
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-[oklch(0.45_0.13_70)]",
  danger: "bg-danger-soft text-danger",
  success: "bg-success-soft text-success",
  violet: "bg-violet-soft text-violet",
  neutral: "bg-muted text-muted-foreground",
};

interface StatusPillProps {
  tone: Tone;
  label: string;
  dot?: boolean;
  className?: string;
}

export function StatusPill({ tone, label, dot = true, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        toneClass[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {label}
    </span>
  );
}

interface PriorityDotProps {
  priority: "normal" | "urgent";
}

export function PriorityDot({ priority }: PriorityDotProps) {
  const isUrgent = priority === "urgent";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        isUrgent ? "text-danger" : "text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          isUrgent ? "bg-danger" : "border border-border-strong bg-transparent",
        )}
      />
      {isUrgent ? "Urgent" : "Normal"}
    </span>
  );
}
