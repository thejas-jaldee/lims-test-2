import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, UserPlus, Phone, Mail } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLimsStore } from "@/store/limsStore";

export const Route = createFileRoute("/lims/patients/")({
  head: () => ({
    meta: [
      { title: "Patients — LIMS" },
      { name: "description", content: "Browse and manage registered patients." },
    ],
  }),
  component: PatientsIndex,
});

function PatientsIndex() {
  const patients = useLimsStore((s) => s.patients);
  const orders = useLimsStore((s) => s.orders);
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return patients
      .map((p) => ({
        ...p,
        orderCount: orders.filter((o) => o.patientId === p.id).length,
      }))
      .filter(
        (p) =>
          !term ||
          p.name.toLowerCase().includes(term) ||
          p.id.toLowerCase().includes(term) ||
          p.phone.includes(term),
      );
  }, [patients, orders, q]);

  return (
    <div>
      <PageHeader
        title="Patients"
        subtitle={`${patients.length} registered patient${patients.length === 1 ? "" : "s"}`}
        right={
          <Link
            to="/lims/orders/new"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" /> New Patient
          </Link>
        }
      />

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex items-center gap-3 border-b border-border p-4">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, ID or phone…"
              className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <span className="text-xs text-muted-foreground">{rows.length} result{rows.length === 1 ? "" : "s"}</span>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-surface-muted">
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Age / Gender</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3 text-right">Orders</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <div className="font-medium">{p.name}</div>
                  <div className="font-mono text-xs text-muted-foreground">{p.id}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {p.age} yr · {p.gender}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Phone className="h-3 w-3 text-muted-foreground" /> {p.phone}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" /> {p.email}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{p.address}</td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary-soft px-2 text-xs font-semibold text-primary">
                    {p.orderCount}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No patients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
