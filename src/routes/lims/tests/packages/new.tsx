import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ChevronDown,
  GripVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wallet,
} from "lucide-react";
import { useState, type ComponentType, type ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ClinicalDescriptionModal } from "@/components/lims/ClinicalDescriptionModal";
import { SelectTestsModal } from "@/components/lims/SelectTestsModal";
import { labTests } from "@/data/lims";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lims/tests/packages/new")({
  head: () => ({
    meta: [
      { title: "Create Test Package - LIMS" },
      { name: "description", content: "Create a reusable lab test package." },
    ],
  }),
  component: CreatePackagePage,
});

type IconTone = "blue" | "teal" | "purple";
type PriceRow = {
  id: string;
  store: string;
  catalog: string;
  price: string;
  tax: string;
};

const iconToneClass: Record<IconTone, string> = {
  blue: "bg-[#eaf1ff] text-[#2f6fed]",
  teal: "bg-[#e1f3ef] text-[#006c5b]",
  purple: "bg-[#f3e8ff] text-[#7c3aed]",
};

const fieldInputClass =
  "h-[38px] w-full rounded-[6px] border border-[#dfe5ec] bg-white px-3 text-[13px] font-medium text-[#111827] outline-none transition placeholder:text-[#98a2b3] focus:border-[#006c5b] focus:ring-2 focus:ring-[#006c5b]/10";

function CreatePackagePage() {
  const [selected, setSelected] = useState<string[]>(["CBC-001", "LFT-001"]);
  const [picker, setPicker] = useState(false);
  const [clinical, setClinical] = useState(false);
  const [labels, setLabels] = useState<string[]>([]);
  const [prices, setPrices] = useState<PriceRow[]>([
    { id: "price-1", store: "Lab A", catalog: "Catalog 1", price: "5000", tax: "GST 18%" },
  ]);

  return (
    <div className="min-h-full bg-[#f4f5f7] pb-5 text-[#111827]">
      <PageHeader title="Create New Test Package" backTo="/lims/tests" />

      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4 px-3 py-4 sm:px-4 lg:px-5">
        <LimsCard title="Package Details" icon={Pencil} tone="blue">
          <FormGrid>
            <Field label="Package Name" required>
              <input className={fieldInputClass} defaultValue="Complete Blood Count" />
            </Field>
            <Field label="Abbreviation">
              <input className={fieldInputClass} defaultValue="CBC" />
            </Field>
            <Field label="Code">
              <input className={fieldInputClass} defaultValue="TCBC" />
            </Field>
          </FormGrid>

          <GhostActions>
            <GhostButton onClick={() => setClinical(true)}>
              <Plus className="h-3.5 w-3.5" />
              Clinical description
            </GhostButton>
            <GhostButton
              onClick={() => setLabels((items) => [...items, `Label ${items.length + 1}`])}
            >
              <Plus className="h-3.5 w-3.5" />
              Label
            </GhostButton>
          </GhostActions>

          {labels.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {labels.map((label, index) => (
                <RemovableField
                  key={index}
                  label={`Label ${index + 1}`}
                  onRemove={() => setLabels((items) => items.filter((_, i) => i !== index))}
                >
                  <input
                    className={fieldInputClass}
                    value={label}
                    onChange={(event) =>
                      setLabels((items) =>
                        items.map((item, i) => (i === index ? event.target.value : item)),
                      )
                    }
                    placeholder="Enter label"
                  />
                </RemovableField>
              ))}
            </div>
          )}
        </LimsCard>

        <LimsCard title="Tests" icon={Activity} tone="teal" bodyClassName="p-0">
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
            <label className="flex h-[38px] w-full items-center gap-2 rounded-[6px] border border-[#dfe5ec] bg-white px-3 shadow-[0_1px_2px_rgba(16,24,40,0.03)] sm:max-w-[620px]">
              <Search className="h-4 w-4 text-[#667085]" />
              <input
                placeholder="Search by test/Package name or test code.."
                className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[#111827] outline-none placeholder:text-[#98a2b3]"
              />
            </label>
            <button
              type="button"
              onClick={() => setPicker(true)}
              className="inline-flex h-[38px] items-center justify-center rounded-[6px] bg-[#111827] px-8 text-[13px] font-semibold text-white hover:bg-[#1f2937]"
            >
              View All Tests
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full border-collapse text-left">
              <thead>
                <tr className="h-[42px] border-y border-[#e5e9ef] bg-[#f7f8fa] text-[11px] font-semibold uppercase text-[#667085]">
                  <th className="w-11 px-4" aria-label="Drag handle" />
                  <th className="w-[16%] px-4">Code</th>
                  <th className="w-[36%] px-4">Test Name</th>
                  <th className="w-[28%] px-4">Department</th>
                  <th className="w-[20%] px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {selected.map((id) => {
                  const test = labTests.find((item) => item.id === id);
                  if (!test) return null;

                  return (
                    <tr
                      key={id}
                      className="h-[54px] border-b border-[#e8edf2] bg-white text-[13px] text-[#111827]"
                    >
                      <td className="px-4 text-[#111827]">
                        <GripVertical className="h-4 w-4" />
                      </td>
                      <td className="px-4 font-semibold">{test.code}</td>
                      <td className="px-4 font-medium">{test.name}</td>
                      <td className="px-4 text-[#344054]">{test.department}</td>
                      <td className="px-4">
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              setSelected((items) => items.filter((item) => item !== id))
                            }
                            className="flex h-[30px] w-[30px] items-center justify-center rounded-[5px] border border-[#ffb4b8] bg-white text-[#ff5a5f] hover:bg-[#fff1f2]"
                            aria-label={`Remove ${test.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {selected.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[13px] text-[#667085]">
                      No tests added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </LimsCard>

        <LimsCard title="Pricing" icon={Wallet} tone="purple">
          <div className="flex flex-col gap-4">
            {prices.map((priceRow, index) => (
              <div
                key={priceRow.id}
                className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_36px]"
              >
                <Field label="Select Store">
                  <SelectInput
                    options={["Lab A", "Main Lab", "Branch - Kochi"]}
                    value={priceRow.store}
                    onChange={(store) => updatePriceRow(priceRow.id, { store })}
                  />
                </Field>
                <Field label="Catalog">
                  <SelectInput
                    options={["Catalog 1", "Standard", "Premium"]}
                    value={priceRow.catalog}
                    onChange={(catalog) => updatePriceRow(priceRow.id, { catalog })}
                  />
                </Field>
                <Field label={"Price(\u20B9)"}>
                  <input
                    className={fieldInputClass}
                    value={priceRow.price}
                    onChange={(event) => updatePriceRow(priceRow.id, { price: event.target.value })}
                    inputMode="decimal"
                  />
                </Field>
                <Field label="TAX">
                  <SelectInput
                    options={["GST 18%", "GST 5%", "None"]}
                    value={priceRow.tax}
                    onChange={(tax) => updatePriceRow(priceRow.id, { tax })}
                  />
                </Field>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() =>
                      setPrices((items) => items.filter((item) => item.id !== priceRow.id))
                    }
                    disabled={prices.length === 1}
                    className="flex h-[38px] w-[36px] items-center justify-center rounded-[6px] border border-[#ffb4b8] bg-white text-[#ff5a5f] hover:bg-[#fff1f2] disabled:cursor-not-allowed disabled:border-[#dfe5ec] disabled:text-[#98a2b3] disabled:hover:bg-white"
                    aria-label={`Remove price ${index + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <GhostActions>
            <GhostButton
              onClick={() =>
                setPrices((items) => [
                  ...items,
                  {
                    id: `price-${Date.now()}`,
                    store: "Lab A",
                    catalog: "Catalog 1",
                    price: "",
                    tax: "GST 18%",
                  },
                ])
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Another Price
            </GhostButton>
          </GhostActions>
        </LimsCard>

        <footer className="flex flex-col-reverse gap-2 rounded-[8px] border border-[#dfe5ec] bg-white px-4 py-3 sm:flex-row sm:items-center">
          <Link
            to="/lims/tests"
            className="inline-flex h-[38px] items-center justify-center rounded-[6px] border border-[#dfe5ec] bg-white px-5 text-[13px] font-semibold text-[#667085] hover:bg-[#f7f8fa]"
          >
            Cancel
          </Link>
          <button className="inline-flex h-[38px] items-center justify-center rounded-[6px] bg-[#006c5b] px-5 text-[13px] font-semibold text-white hover:bg-[#00594c]">
            Create Test Package
          </button>
        </footer>
      </div>

      <SelectTestsModal
        open={picker}
        onClose={() => setPicker(false)}
        initialSelected={selected}
        onSave={setSelected}
      />
      <ClinicalDescriptionModal open={clinical} onClose={() => setClinical(false)} />
    </div>
  );

  function updatePriceRow(id: string, next: Partial<PriceRow>) {
    setPrices((items) => items.map((item) => (item.id === id ? { ...item, ...next } : item)));
  }
}

function LimsCard({
  title,
  icon: Icon,
  tone,
  bodyClassName,
  children,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  tone: IconTone;
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
      </header>
      <div className={cn("p-4 sm:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>;
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

function SelectInput({
  options,
  value,
  onChange,
}: {
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="relative">
      <select
        className={cn(fieldInputClass, "appearance-none pr-9")}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      >
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
      type="button"
      onClick={onClick}
      className="inline-flex h-[30px] items-center gap-1 rounded-[5px] bg-[#e1f3ef] px-3 text-[12px] font-semibold text-[#006c5b] hover:bg-[#d4ece7]"
    >
      {children}
    </button>
  );
}

function RemovableField({
  label,
  onRemove,
  children,
}: {
  label: string;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[12px] font-semibold leading-4 text-[#344054]">{label}</span>
        <button
          type="button"
          onClick={onRemove}
          className="flex h-6 w-6 items-center justify-center rounded-[5px] text-[#ff5a5f] hover:bg-[#fff1f2]"
          aria-label={`Remove ${label}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {children}
    </div>
  );
}
