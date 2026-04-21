import { createFileRoute, Outlet } from "@tanstack/react-router";
import { TopHeader } from "@/components/layout/TopHeader";
import { PrimarySidebar } from "@/components/layout/PrimarySidebar";
import { SecondarySidebar } from "@/components/layout/SecondarySidebar";

export const Route = createFileRoute("/lims")({
  component: LimsLayout,
});

function LimsLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopHeader />
      <div className="flex flex-1">
        <PrimarySidebar />
        <SecondarySidebar />
        <main className="flex-1 overflow-x-hidden bg-background px-3 py-4 md:px-4 lg:px-5">
          <div className="mx-auto w-full max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
