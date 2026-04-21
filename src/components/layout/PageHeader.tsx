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
    <header className="-mx-3 -mt-4 mb-4 border-b border-border bg-surface px-3 py-2 md:-mx-4 md:px-4 lg:-mx-5 lg:mb-5 lg:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {backTo && (
            <Link
              to={backTo}
              className="flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-muted"
              aria-label="Back"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
          )}
          <div>
            <h1 className="text-[18px] font-semibold tracking-tight text-foreground md:text-[20px]">{title}</h1>
            {subtitle && <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>}
          </div>
        </div>
        {right && <div className="flex items-center gap-2">{right}</div>}
      </div>
    </header>
  );
}
