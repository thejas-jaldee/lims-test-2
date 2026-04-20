import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search, Trash2, GripVertical, FileText, Tag, ChevronDown, Pencil, Activity, Wallet } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionCard, FieldLabel } from "@/components/lims/SectionCard";
import { SelectTestsModal } from "@/components/lims/SelectTestsModal";
import { ClinicalDescriptionModal } from "@/components/lims/ClinicalDescriptionModal";
import { labTests } from "@/data/lims";

export const Route = createFileRoute("/lims/tests/packages/new")({
  head: () => ({
    meta: [
      { title: "Create Test Package — LIMS" },
      { name: "description", content: "Create a reusable lab test package." },
    ],
  }),
  component: CreatePackagePage,
});

function CreatePackagePage() {
  const [selected, setSelected] = useState<string[]>(["CBC-001", "LFT-001"]);
  const [picker, setPicker] = useState(false);
  const [clinical, setClinical] = useState(false);

  return (
    <div>
      <PageHeader title="Create New Test Package" backTo="/lims/tests" />

      <div className="grid grid-cols-1 gap-4">
        <SectionCard title="Package Details" icon={Pencil} iconTone="info">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Package Name *">
              <input className="input" defaultValue="Complete Blood Count" />
            </Field>
            <Field label="Abbreviation">
              <input className="input" defaultValue="CBC" />
            </Field>
            <Field label="Code">
              <input className="input" defaultValue="TCBC" />
            </Field>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => setClinical(true)} className="inline-flex items-center gap-1.5 rounded-md bg-primary-soft px-3 py-1.5 text-xs font-medium text-primary hover:opacity-90">
              <FileText className="h-3.5 w-3.5" /> + Clinical description
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md bg-primary-soft px-3 py-1.5 text-xs font-medium text-primary hover:opacity-90">
              <Tag className="h-3.5 w-3.5" /> + Label
            </button>
          </div>
        </SectionCard>

        <SectionCard
          title="Tests"
          icon={Activity}
          iconTone="success"
          right={
            <button onClick={() => setPicker(true)} className="inline-flex h-9 items-center gap-2 rounded-md bg-foreground px-3 text-xs font-semibold text-background">
              View All Tests
            </button>
          }
        >
          <div className="mb-3 flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input placeholder="Search by test/package name or code…" className="flex-1 bg-transparent text-sm outline-none" />
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="w-8 px-3 py-2.5"></th>
                  <th className="px-3 py-2.5">Code</th>
                  <th className="px-3 py-2.5">Test Name</th>
                  <th className="px-3 py-2.5">Department</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {selected.map((id) => {
                  const t = labTests.find((x) => x.id === id);
                  if (!t) return null;
                  return (
                    <tr key={id}>
                      <td className="px-3 py-3 text-muted-foreground"><GripVertical className="h-4 w-4" /></td>
                      <td className="px-3 py-3 font-mono text-xs">{t.code}</td>
                      <td className="px-3 py-3 font-medium">{t.name}</td>
                      <td className="px-3 py-3 text-muted-foreground">{t.department}</td>
                      <td className="px-3 py-3 text-right">
                        <button onClick={() => setSelected((s) => s.filter((x) => x !== id))} className="rounded-md p-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {selected.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">No tests added yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Pricing" icon={Wallet} iconTone="violet">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Field label="Select Store">
              <SelectInput options={["Lab A", "Main Lab", "Branch — Kochi"]} />
            </Field>
            <Field label="Catalog">
              <SelectInput options={["Catalog 1", "Standard", "Premium"]} />
            </Field>
            <Field label="Price(₹)"><input className="input" defaultValue="5000" /></Field>
            <Field label="TAX"><SelectInput options={["GST 18%", "GST 5%", "None"]} /></Field>
          </div>
          <div className="mt-3">
            <button className="inline-flex items-center gap-1.5 rounded-md bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary">
              <Plus className="h-3.5 w-3.5" /> Another Price
            </button>
          </div>
        </SectionCard>

        <div className="flex items-center gap-3 px-1 pb-4">
          <Link to="/lims/tests" className="rounded-md border border-border bg-surface px-5 py-2 text-sm font-medium hover:bg-muted">Cancel</Link>
          <button className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Create Test Package</button>
        </div>
      </div>

      <SelectTestsModal open={picker} onClose={() => setPicker(false)} initialSelected={selected} onSave={setSelected} />
      <ClinicalDescriptionModal open={clinical} onClose={() => setClinical(false)} />

      <style>{`.input{height:2.5rem;width:100%;border-radius:0.375rem;border:1px solid var(--color-border);background:var(--color-surface);padding:0 0.75rem;font-size:0.875rem;outline:none}.input:focus{border-color:var(--color-primary)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><FieldLabel>{label}</FieldLabel>{children}</div>;
}
function SelectInput({ options }: { options: string[] }) {
  return (
    <div className="relative">
      <select className="input pr-9">{options.map((o) => <option key={o}>{o}</option>)}</select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
