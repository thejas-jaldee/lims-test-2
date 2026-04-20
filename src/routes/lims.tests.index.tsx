import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search, Filter, Edit3, MoreHorizontal, ChevronDown, ScanBarcode, Tag, ToggleRight, Settings2 } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Modal } from "@/components/lims/Modal";
import { Barcode } from "@/components/lims/Barcode";
import { labTests, testPackages, formatINR } from "@/data/lims";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lims/tests/")({
  head: () => ({
    meta: [
      { title: "Tests & Packages — LIMS" },
      { name: "description", content: "Manage lab tests, parameters and curated test packages." },
    ],
  }),
  component: TestsConfigPage,
});

function TestsConfigPage() {
  const [mode, setMode] = useState<"tests" | "packages">("tests");
  const [modeOpen, setModeOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [q, setQ] = useState("");
  const [barcodeFor, setBarcodeFor] = useState<string | null>(null);

  return (
    <div>
      <PageHeader title={mode === "tests" ? "Tests" : "Test Packages"} backTo="/lims" />

      <section className="rounded-2xl border border-border bg-surface p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 py-2.5 md:max-w-md">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Mode dropdown */}
            <div className="relative">
              <button
                onClick={() => setModeOpen((v) => !v)}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-medium"
              >
                {mode === "tests" ? "Tests" : "Test Packages"}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
              {modeOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setModeOpen(false)} />
                  <div className="absolute right-0 top-12 z-20 w-44 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
                    {(["tests", "packages"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          setMode(m);
                          setModeOpen(false);
                        }}
                        className={cn(
                          "block w-full px-3 py-2 text-left text-sm hover:bg-muted",
                          m === mode && "bg-primary-soft text-primary",
                        )}
                      >
                        {m === "tests" ? "Tests" : "Test Packages"}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-medium">
              <Filter className="h-4 w-4 text-muted-foreground" /> Filter
            </button>
            <div className="relative">
              <button
                onClick={() => setCreateOpen((v) => !v)}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> Create <ChevronDown className="h-4 w-4" />
              </button>
              {createOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setCreateOpen(false)} />
                  <div className="absolute right-0 top-12 z-20 w-48 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
                    <Link
                      to="/lims/tests/new"
                      onClick={() => setCreateOpen(false)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      Create Test
                    </Link>
                    <Link
                      to="/lims/tests/packages/new"
                      onClick={() => setCreateOpen(false)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      Create Test Package
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          {mode === "tests" ? (
            <TestsTable q={q} onBarcode={setBarcodeFor} />
          ) : (
            <PackagesTable q={q} />
          )}
        </div>
      </section>

      {/* Barcode modal */}
      <Modal open={!!barcodeFor} onClose={() => setBarcodeFor(null)} title="Test Barcode" width="sm">
        <div className="flex flex-col items-center gap-4 p-8">
          <div className="flex h-32 w-64 items-center justify-center rounded-md border border-border bg-surface-muted">
            <Barcode value={barcodeFor ?? ""} showValue={false} className="!flex-col-reverse" />
          </div>
          <div className="font-mono text-sm font-semibold tracking-widest">{barcodeFor}</div>
          <div className="flex w-full gap-2">
            <button className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-muted">
              Share
            </button>
            <button className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-muted">
              Print
            </button>
            <button className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Download
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function TestsTable({ q, onBarcode }: { q: string; onBarcode: (code: string) => void }) {
  const filtered = labTests.filter(
    (t) => !q || t.name.toLowerCase().includes(q.toLowerCase()) || t.code.toLowerCase().includes(q.toLowerCase()),
  );
  const [menuFor, setMenuFor] = useState<string | null>(null);
  return (
    <table className="min-w-full">
      <thead>
        <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <th className="py-3 pr-4">Code</th>
          <th className="py-3 pr-4">Test Name</th>
          <th className="py-3 pr-4">Department</th>
          <th className="py-3 pr-4">Category</th>
          <th className="py-3 pr-4">Specimen</th>
          <th className="py-3 pr-4 text-right">Price</th>
          <th className="py-3 pr-4">Status</th>
          <th className="py-3 pr-4 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border text-sm">
        {filtered.map((t) => (
          <tr key={t.id}>
            <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{t.code}</td>
            <td className="py-3 pr-4 font-semibold">{t.name}</td>
            <td className="py-3 pr-4">
              <span className="inline-flex rounded-md bg-info-soft px-2 py-0.5 text-xs font-medium text-info">
                {t.department}
              </span>
            </td>
            <td className="py-3 pr-4 text-muted-foreground">{t.category}</td>
            <td className="py-3 pr-4 text-muted-foreground">{t.specimen}</td>
            <td className="py-3 pr-4 text-right font-semibold">{formatINR(t.price)}</td>
            <td className="py-3 pr-4">
              <StatusChip enabled={t.enabled} />
            </td>
            <td className="py-3 pr-4">
              <div className="relative flex items-center justify-end gap-1">
                <button className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-muted">
                  <Edit3 className="h-3.5 w-3.5" /> Edit Details
                </button>
                <button
                  onClick={() => setMenuFor((c) => (c === t.id ? null : t.id))}
                  className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {menuFor === t.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                    <div className="absolute right-0 top-9 z-20 w-52 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
                      <MenuItem
                        icon={ScanBarcode}
                        label="Test Barcode"
                        onClick={() => {
                          onBarcode(`TEST ${t.shortName ?? t.code} 001`);
                          setMenuFor(null);
                        }}
                      />
                      <MenuItem icon={Tag} label="Edit Price" />
                      <MenuItem icon={Settings2} label="Reference Range Setup" />
                      <MenuItem icon={ToggleRight} label="Change Status" />
                    </div>
                  </>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PackagesTable({ q }: { q: string }) {
  const filtered = testPackages.filter(
    (p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.code.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <table className="min-w-full">
      <thead>
        <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <th className="py-3 pr-4">Code</th>
          <th className="py-3 pr-4">Package Name</th>
          <th className="py-3 pr-4">Test Count</th>
          <th className="py-3 pr-4">Status</th>
          <th className="py-3 pr-4 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border text-sm">
        {filtered.map((p) => (
          <tr key={p.id}>
            <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{p.code}</td>
            <td className="py-3 pr-4">
              <div className="font-semibold">{p.name}</div>
              <div className="line-clamp-1 text-xs text-muted-foreground">{p.description}</div>
            </td>
            <td className="py-3 pr-4 font-semibold text-primary">{p.testCount}</td>
            <td className="py-3 pr-4">
              <StatusChip enabled={p.enabled} />
            </td>
            <td className="py-3 pr-4">
              <div className="flex items-center justify-end gap-1">
                <button className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-muted">
                  <Edit3 className="h-3.5 w-3.5" /> Edit Details
                </button>
                <button className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-muted">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MenuItem({ icon: Icon, label, onClick }: { icon: typeof ScanBarcode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted">
      <Icon className="h-4 w-4 text-muted-foreground" /> {label}
    </button>
  );
}

function StatusChip({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        enabled ? "bg-success-soft text-success" : "bg-muted text-muted-foreground",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", enabled ? "bg-success" : "bg-muted-foreground")} />
      {enabled ? "Enabled" : "Disabled"}
    </span>
  );
}
