import { Link } from "@tanstack/react-router";
import { Search, MessageCircle, Bell, LayoutGrid, ChevronDown } from "lucide-react";

export function TopHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface px-4 md:px-6">
      <Link to="/lims" className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-violet-soft text-violet">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path d="M12 2l1.6 4.2L18 8l-4.4 1.8L12 14l-1.6-4.2L6 8l4.4-1.8L12 2zm6 11l1 2.5L21.5 17 19 18l-1 2.5L17 18l-2.5-1 2.5-1L18 13zM5 14l.8 2L8 16.8 5.8 17.6 5 20l-.8-2.4L2 16.8l2.2-.8L5 14z" />
          </svg>
        </div>
        <span className="text-lg font-semibold tracking-tight text-foreground">
          Global Care Hospital
        </span>
      </Link>

      <div className="flex items-center gap-3 md:gap-5">
        <div className="hidden items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 md:flex md:w-72 lg:w-96">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search anything"
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <button
          className="hidden rounded-md p-2 text-muted-foreground hover:bg-muted md:inline-flex"
          aria-label="Messages"
        >
          <MessageCircle className="h-5 w-5" />
        </button>
        <button
          className="relative hidden rounded-md p-2 text-muted-foreground hover:bg-muted md:inline-flex"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-info" />
        </button>
        <button
          className="hidden rounded-md p-2 text-muted-foreground hover:bg-muted md:inline-flex"
          aria-label="Apps"
        >
          <LayoutGrid className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-soft text-violet">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" />
            </svg>
          </div>
          <div className="hidden text-left md:block">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Admin
            </div>
            <div className="text-sm font-semibold text-foreground">David Beckham</div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}
