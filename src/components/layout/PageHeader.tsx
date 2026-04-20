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
    <div className="flex flex-col gap-3 px-1 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
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
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle && <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>}
        </div>
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}
