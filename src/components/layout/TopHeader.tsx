import { Link } from "@tanstack/react-router";
import { Search, MessageCircle, Bell, LayoutGrid, ChevronDown } from "lucide-react";
import { useState } from "react";
import { getCdnAssetUrl, getCdnPath } from "@/lib/cdn";

export function TopHeader() {
  const [showCdnLogo, setShowCdnLogo] = useState(Boolean(getCdnPath()));
  const logoUrl = getCdnAssetUrl("assets/images/logo.gif");

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-border bg-surface px-4 md:px-6">
      <Link to="/lims" className="flex items-center gap-3">
        {showCdnLogo ? (
          <img
            src={logoUrl}
            alt="Global Care Hospital"
            className="h-[40px] w-[40px] rounded-xl object-cover"
            onError={() => setShowCdnLogo(false)}
          />
        ) : (
          <div className="flex h-[40px] w-[40px] items-center justify-center rounded-xl bg-violet-soft text-violet">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M12 2l1.6 4.2L18 8l-4.4 1.8L12 14l-1.6-4.2L6 8l4.4-1.8L12 2zm6 11l1 2.5L21.5 17 19 18l-1 2.5L17 18l-2.5-1 2.5-1L18 13zM5 14l.8 2L8 16.8 5.8 17.6 5 20l-.8-2.4L2 16.8l2.2-.8L5 14z" />
            </svg>
          </div>
        )}
        <span className="text-[21px] font-bold tracking-[-0.04em] text-foreground">
          Global Care Hospital
        </span>
      </Link>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden items-center gap-4 text-muted-foreground md:flex">
          <Search className="h-4.5 w-4.5 stroke-[1.8]" />
          <input
            placeholder="Search anything"
            className="w-[150px] bg-transparent text-[14px] font-medium text-foreground outline-none placeholder:text-[oklch(0.76_0.03_250)] lg:w-[190px]"
          />
        </div>
        <button
          className="hidden rounded-xl p-2 text-[oklch(0.46_0.04_250)] transition-colors hover:bg-muted md:inline-flex"
          aria-label="Messages"
        >
          <MessageCircle className="h-5 w-5 stroke-[1.8]" />
        </button>
        <button
          className="relative hidden rounded-xl p-2 text-[oklch(0.46_0.04_250)] transition-colors hover:bg-muted md:inline-flex"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 stroke-[1.8]" />
          <span className="absolute right-[9px] top-[8px] h-2 w-2 rounded-full bg-info ring-2 ring-surface" />
        </button>
        <button
          className="hidden rounded-xl p-2 text-[oklch(0.46_0.04_250)] transition-colors hover:bg-muted md:inline-flex"
          aria-label="Apps"
        >
          <LayoutGrid className="h-5 w-5 stroke-[1.8]" />
        </button>

        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-2.5 py-1 shadow-[var(--shadow-soft)]">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-violet text-white">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" />
            </svg>
          </div>
          <div className="hidden min-w-[116px] text-left md:block">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Admin
            </div>
            <div className="text-[15px] font-semibold tracking-[-0.03em] text-foreground">
              David Beckham
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}
