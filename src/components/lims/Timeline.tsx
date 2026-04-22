import { cn } from "@/lib/utils";
import { type TimelineEvent, formatDateTime } from "@/data/lims";

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="space-y-5">
      {events.map((ev, i) => {
        const last = i === events.length - 1;
        const isDone = ev.state === "done";
        const isCurrent = ev.state === "current";

        return (
          <li key={ev.key} className="relative pl-7">
            <span
              className={cn(
                "absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-surface",
                isDone
                  ? "bg-primary"
                  : isCurrent
                    ? "bg-[oklch(0.78_0.16_55)]"
                    : "bg-[oklch(0.87_0.004_250)]",
              )}
            />
            {!last && (
              <span
                className={cn(
                  "absolute left-[6px] top-5 h-[calc(100%+8px)] w-px",
                  isDone || isCurrent ? "bg-[oklch(0.82_0.03_175)]" : "bg-border",
                )}
              />
            )}
            <div className={cn("text-[15px] font-semibold", ev.state === "todo" ? "text-muted-foreground" : "text-foreground")}>
              {ev.label}
            </div>
            <div className="mt-1 text-[12px] text-muted-foreground">
              {ev.timestamp ? `${formatDateTime(ev.timestamp)}${ev.by ? ` · ${ev.by}` : ""}` : "-"}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
