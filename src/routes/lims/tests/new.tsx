import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  Beaker,
  ChevronDown,
  ClipboardList,
  FileText,
  GripVertical,
  Plus,
  Search,
  Tag,
  Trash2,
  Wallet,
} from "lucide-react";
import { useState, type ComponentType, type ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ClinicalDescriptionModal } from "@/components/lims/ClinicalDescriptionModal";
import { ParameterModal } from "@/components/lims/ParameterModal";
import { departments, type TestParameter } from "@/data/lims";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lims/tests/new")({
  head: () => ({
    meta: [
      { title: "Create Test - LIMS" },
      { name: "description", content: "Configure a new lab test definition." },
    ],
  }),
  component: CreateTestPage,
});

type IconTone = "blue" | "orange" | "teal" | "purple";

const iconToneClass: Record<IconTone, string> = {
  blue: "bg-[#eaf1ff] text-[#2f6fed]",
  orange: "bg-[#fff0e6] text-[#d86b20]",
  teal: "bg-[#e1f3ef] text-[#006c5b]",
  purple: "bg-[#f3e8ff] text-[#7c3aed]",
};

const fieldInputClass =
  "h-[38px] w-full rounded-[6px] border border-[#dfe5ec] bg-white px-3 text-[13px] font-medium text-[#111827] outline-none transition placeholder:text-[#98a2b3] focus:border-[#006c5b] focus:ring-2 focus:ring-[#006c5b]/10";

function CreateTestPage() {
  const [params, setParams] = useState<TestParameter[]>([
    { id: "P1", code: "HB", name: "Haemoglobin", type: "numeric", unit: "g/L" },
    { id: "P2", code: "RBC", name: "RBC", type: "numeric", unit: "million/\u00B5L" },
    { id: "P3", code: "HCT", name: "Hematocrit", type: "numeric", unit: "%" },
    { id: "P4", code: "MCV", name: "Neutrophils", type: "formula", unit: "fL" },
  ]);
  const [paramModal, setParamModal] = useState(false);
  const [clinicalOpen, setClinicalOpen] = useState(false);
  const [editingParam, setEditingParam] = useState<TestParameter | null>(null);

  return (
    <div className="min-h-full bg-[#f4f5f7] pb-5 text-[#111827]">
            <PageHeader title="Create New Test" backTo="/lims/tests" />

      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4 px-3 py-4 sm:px-4 lg:px-5">
        {/* <header className="flex min-h-10 items-center gap-2">
          <Link
            to="/lims/tests"
            aria-label="Back to tests"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] text-[#1f2937] hover:bg-white"
          >
            <ArrowLeft className="h-[19px] w-[19px]" />
          </Link>
          <h1 className="text-[20px] font-semibold leading-7 text-[#111827]">Create New Test</h1>
        </header> */}

        <div className="flex flex-col gap-4">
          <LimsCard title="Test Details" icon={ClipboardList} tone="blue">
            <label className="flex h-[38px] items-center gap-2 rounded-[6px] border border-[#dfe5ec] bg-white px-3 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
              <Search className="h-4 w-4 text-[#667085]" />
              <input
                placeholder="Search tests..."
                className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[#111827] outline-none placeholder:text-[#98a2b3]"
              />
            </label>

            <FormGrid className="mt-5">
              <Field label="Test Name" required>
                <input className={fieldInputClass} defaultValue="Complete Blood Count (CBC)" />
              </Field>
              <Field label="Abbreviation" required>
                <input className={fieldInputClass} defaultValue="CBC" />
              </Field>
              <Field label="Test Code">
                <input className={fieldInputClass} defaultValue="CBC01" />
              </Field>
              <Field label="Department" required>
                <SelectInput options={departments} />
              </Field>
              <Field label="Category">
                <SelectInput options={["Clinical Pathology", "Biochemistry", "Hematology"]} />
              </Field>
              <Field label="Sub Category">
                <SelectInput options={["General Hematology", "Routine", "Special"]} />
              </Field>
            </FormGrid>

            <GhostActions>
              <GhostButton onClick={() => setClinicalOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                Clinical description
              </GhostButton>
              <GhostButton>
                <Plus className="h-3.5 w-3.5" />
                Label
              </GhostButton>
            </GhostActions>
          </LimsCard>

          <LimsCard title="Specimen & Processing" icon={Beaker} tone="orange">
            <FormGrid>
              <Field label="Specimen Type" required>
                <SelectInput options={["Blood", "Urine", "Stool", "Tissue"]} />
              </Field>
              <Field label="Container">
                <SelectInput options={["EDTA", "SST", "Sterile"]} />
              </Field>
              <Field label="Shelf Life">
                <div className="grid grid-cols-[minmax(0,1fr)_116px] gap-2">
                  <input className={fieldInputClass} defaultValue="5" />
                  <SelectInput options={["Hours", "Days"]} />
                </div>
              </Field>
            </FormGrid>

            <GhostActions>
              <GhostButton>
                <Plus className="h-3.5 w-3.5" />
                Collection Instruction
              </GhostButton>
            </GhostActions>
          </LimsCard>

          <LimsCard
            title="Test Parameters"
            icon={Activity}
            tone="teal"
            right={
              <button
                onClick={() => {
                  setEditingParam(null);
                  setParamModal(true);
                }}
                className="inline-flex h-[34px] items-center gap-1.5 rounded-[6px] bg-[#111827] px-3 text-[12px] font-semibold text-white hover:bg-[#1f2937]"
              >
                <Plus className="h-3.5 w-3.5" />
                Parameter
              </button>
            }
            bodyClassName="p-0"
          >
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full border-collapse text-left">
                <thead>
                  <tr className="h-[42px] border-y border-[#e5e9ef] bg-[#f7f8fa] text-[11px] font-semibold uppercase text-[#667085]">
                    <th className="w-11 px-4" aria-label="Drag handle" />
                    <th className="w-[16%] px-4">Code</th>
                    <th className="w-[32%] px-4">Name</th>
                    <th className="w-[20%] px-4">Result Type</th>
                    <th className="w-[16%] px-4">Unit</th>
                    <th className="w-[16%] px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {params.map((parameter) => (
                    <tr
                      key={parameter.id}
                      className="h-[54px] border-b border-[#e8edf2] bg-white text-[13px] text-[#111827]"
                    >
                      <td className="px-4 text-[#98a2b3]">
                        <GripVertical className="h-4 w-4" />
                      </td>
                      <td className="px-4 font-semibold">{parameter.code}</td>
                      <td className="px-4 font-medium">{parameter.name}</td>
                      <td className="px-4 capitalize text-[#344054]">{parameter.type}</td>
                      <td className="px-4 text-[#344054]">{parameter.unit ?? "-"}</td>
                      <td className="px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingParam(parameter);
                              setParamModal(true);
                            }}
                            className="h-[30px] rounded-[5px] border border-[#dfe5ec] bg-white px-3 text-[12px] font-semibold text-[#344054] hover:bg-[#f7f8fa]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              setParams((items) => items.filter((item) => item.id !== parameter.id))
                            }
                            className="flex h-[30px] w-[30px] items-center justify-center rounded-[5px] border border-[#ffb4b8] bg-white text-[#ff5a5f] hover:bg-[#fff1f2]"
                            aria-label={`Delete ${parameter.code}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </LimsCard>

          <LimsCard title="Pricing" icon={Wallet} tone="purple">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Select Store">
                <SelectInput options={["Lab A", "Main Lab", "Branch - Kochi"]} />
              </Field>
              <Field label="Catalog">
                <SelectInput options={["Catalog 1", "Standard", "Premium"]} />
              </Field>
              <Field label={"Price (\u20B9)"}>
                <input className={fieldInputClass} defaultValue="5000" />
              </Field>
              <Field label="TAX">
                <SelectInput options={["GST 18%", "GST 5%", "None"]} />
              </Field>
            </div>

            <GhostActions>
              <GhostButton>
                <Plus className="h-3.5 w-3.5" />
                Another Price
              </GhostButton>
            </GhostActions>
          </LimsCard>

          <footer className="flex flex-col-reverse gap-2 rounded-[8px] border border-[#dfe5ec] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-end">
            <Link
              to="/lims/tests"
              className="inline-flex h-[38px] items-center justify-center rounded-[6px] border border-[#dfe5ec] bg-white px-5 text-[13px] font-semibold text-[#667085] hover:bg-[#f7f8fa]"
            >
              Cancel
            </Link>
            <button className="inline-flex h-[38px] items-center justify-center rounded-[6px] bg-[#006c5b] px-5 text-[13px] font-semibold text-white hover:bg-[#00594c]">
              Create Test
            </button>
          </footer>
        </div>
      </div>

      <ParameterModal
        open={paramModal}
        onClose={() => {
          setParamModal(false);
          setEditingParam(null);
        }}
        onSave={(parameter) => {
          if (editingParam) {
            setParams((items) =>
              items.map((item) =>
                item.id === editingParam.id ? { ...parameter, id: editingParam.id } : item,
              ),
            );
          } else {
            setParams((items) => [...items, parameter]);
          }
        }}
      />
      <ClinicalDescriptionModal open={clinicalOpen} onClose={() => setClinicalOpen(false)} />
    </div>
  );
}

function LimsCard({
  title,
  icon: Icon,
  tone,
  right,
  bodyClassName,
  children,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  tone: IconTone;
  right?: ReactNode;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[8px] border border-[#dfe5ec] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
      <header className="flex min-h-[58px] items-center justify-between gap-3 border-b border-[#e5e9ef] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px]",
              iconToneClass[tone],
            )}
          >
            <Icon className="h-4.5 w-4.5" />
          </div>
          <h2 className="text-[15px] font-semibold leading-5 text-[#111827]">{title}</h2>
        </div>
        {right}
      </header>
      <div className={cn("p-4 sm:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

function FormGrid({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3", className)}>
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold leading-4 text-[#344054]">
        {label}
        {required && <span className="ml-0.5 text-[#ff5a5f]">*</span>}
      </span>
      {children}
    </label>
  );
}

function SelectInput({ options }: { options: string[] }) {
  return (
    <div className="relative">
      <select className={cn(fieldInputClass, "appearance-none pr-9")}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
    </div>
  );
}

function GhostActions({ children }: { children: ReactNode }) {
  return <div className="mt-4 flex flex-wrap gap-2">{children}</div>;
}

function GhostButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex h-[30px] items-center gap-1 rounded-[5px] bg-[#e1f3ef] px-3 text-[12px] font-semibold text-[#006c5b] hover:bg-[#d4ece7]"
    >
      {children}
    </button>
  );
}
