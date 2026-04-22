import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { TopHeader } from "@/components/layout/TopHeader";
import { PrimarySidebar } from "@/components/layout/PrimarySidebar";
import { SecondarySidebar } from "@/components/layout/SecondarySidebar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lims")({
  component: LimsLayout,
});

function LimsLayout() {
  const location = useLocation();
  const isDashboard = location.pathname === "/lims" || location.pathname === "/lims/";

  useEffect(() => {
    document.body.style.overflow = "";
    document.body.style.pointerEvents = "";

    return () => {
      document.body.style.overflow = "";
      document.body.style.pointerEvents = "";
    };
  }, [location.pathname, location.search]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopHeader />
      <div className="flex flex-1">
        <PrimarySidebar />
        <SecondarySidebar />
        <main
          className={cn(
            "flex-1 overflow-x-hidden px-3 py-0 md:px-4 lg:px-5",
            isDashboard ? "bg-background" : "bg-surface-muted",
          )}
        >
          <div className="mx-auto w-full max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
