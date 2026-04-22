import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Trash2, GripVertical, ChevronDown, FileText, Tag, Search, Pencil, FlaskConical, Activity, Wallet } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionCard, FieldLabel } from "@/components/lims/SectionCard";
import { ParameterModal } from "@/components/lims/ParameterModal";
import { ClinicalDescriptionModal } from "@/components/lims/ClinicalDescriptionModal";
import { departments, type TestParameter } from "@/data/lims";

export const Route = createFileRoute("/lims/tests/new")({
  head: () => ({
    meta: [
      { title: "Create Test — LIMS" },
      { name: "description", content: "Configure a new lab test definition." },
    ],
  }),
  component: CreateTestPage,
});

function CreateTestPage() {
  const [params, setParams] = useState<TestParameter[]>([
    { id: "P1", code: "HB", name: "Haemoglobin", type: "numeric", unit: "g/L" },
    { id: "P2", code: "RBC", name: "RBC", type: "numeric", unit: "million/µL" },
    { id: "P3", code: "HCT", name: "Hematocrit", type: "numeric", unit: "%" },
    { id: "P4", code: "MCV", name: "Neutrophils", type: "formula", unit: "fL" },
  ]);
  const [paramModal, setParamModal] = useState(false);
  const [clinicalOpen, setClinicalOpen] = useState(false);
  const [editingParam, setEditingParam] = useState<TestParameter | null>(null);

  return (
    <div>
      <PageHeader title="Create New Test" backTo="/lims/tests" />

      <div className="grid grid-cols-1 gap-4">
        <SectionCard title="Test Details" icon={Pencil} iconTone="info">
          {/* Search existing tests */}
          <FieldLabel>Test Name</FieldLabel>
          <div className="mb-5 flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input placeholder="Search tests..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Test Name *">
              <input className="input" defaultValue="Complete Blood Count (CBC)" />
            </Field>
            <Field label="Abbreviation *">
              <input className="input" defaultValue="CBC" />
            </Field>
            <Field label="Test Code">
              <input className="input" placeholder="CBC01" />
            </Field>
            <Field label="Department *">
              <SelectInput options={departments} />
            </Field>
            <Field label="Category">
              <SelectInput options={["Clinical Pathology", "Biochemistry", "Hematology"]} />
            </Field>
            <Field label="Sub Category">
              <SelectInput options={["General Hematology", "Routine", "Special"]} />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setClinicalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary-soft px-3 py-1.5 text-xs font-medium text-primary hover:opacity-90"
            >
              <FileText className="h-3.5 w-3.5" /> + Clinical description
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md bg-primary-soft px-3 py-1.5 text-xs font-medium text-primary hover:opacity-90">
              <Tag className="h-3.5 w-3.5" /> + Label
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Specimen & Processing" icon={FlaskConical} iconTone="warning">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Specimen Type *">
              <SelectInput options={["Blood", "Urine", "Stool", "Tissue"]} />
            </Field>
            <Field label="Container">
              <SelectInput options={["EDTA", "SST", "Sterile"]} />
            </Field>
            <Field label="Shelf Life">
              <div className="flex gap-2">
                <input className="input flex-1" defaultValue="5" />
                <div className="w-32"><SelectInput options={["Hours", "Days"]} /></div>
              </div>
            </Field>
          </div>
          <div className="mt-3">
            <button className="inline-flex items-center gap-1.5 rounded-md bg-primary-soft px-3 py-1.5 text-xs font-medium text-primary hover:opacity-90">
              + Add Collection Instruction
            </button>
          </div>
        </SectionCard>

        <SectionCard
          title="Test Parameters"
          icon={Activity}
          iconTone="success"
          right={
            <button
              onClick={() => { setEditingParam(null); setParamModal(true); }}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-foreground px-3 text-xs font-semibold text-background hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" /> Parameter
            </button>
          }
          padding="none"
        >
          <table className="w-full text-sm">
            <thead className="bg-surface-muted">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="w-8 px-3 py-2.5"></th>
                <th className="px-3 py-2.5">Code</th>
                <th className="px-3 py-2.5">Name</th>
                <th className="px-3 py-2.5">Result Type</th>
                <th className="px-3 py-2.5">Unit</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {params.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-3 text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                  </td>
                  <td className="px-3 py-3 font-mono text-xs font-bold">{p.code}</td>
                  <td className="px-3 py-3">{p.name}</td>
                  <td className="px-3 py-3 capitalize text-foreground">{p.type}</td>
                  <td className="px-3 py-3 text-foreground">{p.unit ?? "—"}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditingParam(p); setParamModal(true); }}
                        className="rounded-md border border-border px-3 py-1 text-xs font-medium hover:bg-muted"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setParams((arr) => arr.filter((x) => x.id !== p.id))}
                        className="rounded-md border border-danger/40 p-1.5 text-danger hover:bg-danger-soft"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        <SectionCard title="Pricing" icon={Wallet} iconTone="violet">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Field label="Select Store *">
              <SelectInput options={["Lab A", "Main Lab", "Branch — Kochi"]} />
            </Field>
            <Field label="Catalog">
              <SelectInput options={["Catalog 1", "Standard", "Premium"]} />
            </Field>
            <Field label="Price (₹)">
              <input className="input" defaultValue="5000" />
            </Field>
            <Field label="TAX">
              <SelectInput options={["GST 18%", "GST 5%", "None"]} />
            </Field>
          </div>
          <div className="mt-3">
            <button className="inline-flex items-center gap-1.5 rounded-md bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary">
              + Another Price
            </button>
          </div>
        </SectionCard>

        <div className="flex items-center gap-3 px-1 pb-4">
          <Link to="/lims/tests" className="rounded-md border border-border bg-surface px-5 py-2 text-sm font-medium hover:bg-muted">
            Cancel
          </Link>
          <button className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            Create Test
          </button>
        </div>
      </div>

      <ParameterModal
        open={paramModal}
        onClose={() => { setParamModal(false); setEditingParam(null); }}
        onSave={(p) => {
          if (editingParam) {
            setParams((arr) => arr.map((x) => (x.id === editingParam.id ? { ...p, id: editingParam.id } : x)));
          } else {
            setParams((arr) => [...arr, p]);
          }
        }}
      />
      <ClinicalDescriptionModal open={clinicalOpen} onClose={() => setClinicalOpen(false)} />

      <style>{`.input{height:2.5rem;width:100%;border-radius:0.375rem;border:1px solid var(--color-border);background:var(--color-surface);padding:0 0.75rem;font-size:0.875rem;outline:none}.input:focus{border-color:var(--color-primary)}`}</style>
    </div>
  );
}

function Field({ label, children, optional }: { label: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <div>
      <FieldLabel optional={optional}>{label}</FieldLabel>
      {children}
    </div>
  );
}

function SelectInput({ options }: { options: string[] }) {
  return (
    <div className="relative">
      <select className="input appearance-none pr-9">
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
