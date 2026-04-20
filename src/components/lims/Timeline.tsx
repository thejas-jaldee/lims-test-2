import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { type TimelineEvent, formatDateTime } from "@/data/lims";

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="space-y-4">
      {events.map((ev, i) => {
        const last = i === events.length - 1;
        const isDone = ev.state === "done";
        const isCurrent = ev.state === "current";
        return (
          <li key={ev.key} className="relative pl-8">
            <span
              className={cn(
                "absolute left-0 top-0.5 flex h-5 w-5 items-center justify-center rounded-full",
                isDone ? "bg-primary text-primary-foreground" : isCurrent ? "bg-warning text-warning-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {isDone ? <Check className="h-3 w-3" strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
            </span>
            {!last && <span className={cn("absolute left-2 top-6 h-[calc(100%+4px)] w-px", isDone ? "bg-primary/30" : "bg-border")} />}
            <div className={cn("text-sm font-semibold", ev.state === "todo" ? "text-muted-foreground" : "text-foreground")}>{ev.label}</div>
            <div className="text-xs text-muted-foreground">
              {ev.timestamp ? `${formatDateTime(ev.timestamp)}${ev.by ? ` · ${ev.by}` : ""}` : "—"}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
