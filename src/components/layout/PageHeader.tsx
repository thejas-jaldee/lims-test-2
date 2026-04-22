import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  backTo?: string;
  right?: ReactNode;
  subtitle?: ReactNode;
}

export function PageHeader({ title, backTo, right, subtitle }: PageHeaderProps) {
  return (
    <header className="mx-3  mb-5 border-b border-[oklch(0.9_0.008_250)] bg-surface px-4 py-4 md:-mx-4 md:px-6 lg:-mx-5 lg:mb-6 lg:px-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          {backTo && (
            <Link
              to={backTo}
              className="flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-muted"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
          )}
          <div>
            <h1 className="text-[17px] font-semibold tracking-[-0.03em] text-foreground md:text-[18px]">{title}</h1>
            {subtitle && <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>}
          </div>
        </div>
        {right && <div className="flex items-center gap-2">{right}</div>}
      </div>
    </header>
  );
}
