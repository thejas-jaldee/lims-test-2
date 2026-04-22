import { Link } from "@tanstack/react-router";
import { Search, MessageCircle, Bell, LayoutGrid, ChevronDown } from "lucide-react";
import { useState } from "react";
import { getCdnAssetUrl, getCdnPath } from "@/lib/cdn";

export function TopHeader() {
  const [showCdnLogo, setShowCdnLogo] = useState(Boolean(getCdnPath()));
  const logoUrl = getCdnAssetUrl("assets/images/logo.gif");

  return (
    <header className="sticky top-0 z-30 flex h-[66px] items-center justify-between border-b border-[oklch(0.89_0.008_250)] bg-surface px-5 md:px-8">
      <Link to="/lims" className="flex items-center gap-4">
        {showCdnLogo ? (
          <img
            src={logoUrl}
            alt="Global Care Hospital"
            className="h-[38px] w-[38px] rounded-[12px] object-cover"
            onError={() => setShowCdnLogo(false)}
          />
        ) : (
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px] bg-violet-soft text-violet">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
              <path d="M12 2l1.6 4.2L18 8l-4.4 1.8L12 14l-1.6-4.2L6 8l4.4-1.8L12 2zm6 11l1 2.5L21.5 17 19 18l-1 2.5L17 18l-2.5-1 2.5-1L18 13zM5 14l.8 2L8 16.8 5.8 17.6 5 20l-.8-2.4L2 16.8l2.2-.8L5 14z" />
            </svg>
          </div>
        )}
        <span className="text-[22px] font-bold tracking-[-0.05em] text-foreground">
          Global Care Hospital
        </span>
      </Link>

      <div className="flex items-center gap-4 md:gap-5">
        <div className="hidden items-center gap-4 text-muted-foreground md:flex">
          <Search className="h-[18px] w-[18px] stroke-[1.9]" />
          <input
            placeholder="Search anything"
            className="w-[190px] bg-transparent text-[14px] font-medium text-foreground outline-none placeholder:text-[oklch(0.77_0.03_250)] lg:w-[220px]"
          />
        </div>
        <button
          className="hidden rounded-xl p-2 text-[oklch(0.42_0.045_250)] transition-colors hover:bg-muted md:inline-flex"
          aria-label="Messages"
        >
          <MessageCircle className="h-[20px] w-[20px] stroke-[1.9]" />
        </button>
        <button
          className="relative hidden rounded-xl p-2 text-[oklch(0.42_0.045_250)] transition-colors hover:bg-muted md:inline-flex"
          aria-label="Notifications"
        >
          <Bell className="h-[20px] w-[20px] stroke-[1.9]" />
          <span className="absolute right-[8px] top-[7px] h-2.5 w-2.5 rounded-full bg-[oklch(0.74_0.12_200)] ring-2 ring-surface" />
        </button>
        <button
          className="hidden rounded-xl p-2 text-[oklch(0.42_0.045_250)] transition-colors hover:bg-muted md:inline-flex"
          aria-label="Apps"
        >
          <LayoutGrid className="h-[20px] w-[20px] stroke-[1.9]" />
        </button>

        <div className="flex items-center gap-3 rounded-[10px] border border-[oklch(0.88_0.008_250)] bg-surface px-3 py-1.5 shadow-none">
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-violet text-white">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-[16px] w-[16px]">
              <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" />
            </svg>
          </div>
          <div className="hidden min-w-[138px] text-left md:block">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Admin
            </div>
            <div className="text-[15px] font-semibold leading-none tracking-[-0.03em] text-foreground">
              David Beckham
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}
