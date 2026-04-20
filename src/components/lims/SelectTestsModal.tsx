import { useMemo, useState } from "react";
import { Search, GripVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { Modal } from "./Modal";
import { departments, labTests, type LabTest } from "@/data/lims";
import { cn } from "@/lib/utils";

interface SelectTestsModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (ids: string[]) => void;
  initialSelected?: string[];
  title?: string;
}

export function SelectTestsModal({
  open,
  onClose,
  onSave,
  initialSelected = [],
  title = "Select Test",
}: SelectTestsModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [q, setQ] = useState("");
  const [dept, setDept] = useState<string>("All Department");

  const filtered = useMemo(
    () =>
      labTests.filter(
        (t) =>
          (dept === "All Department" || t.department === dept) &&
          (!q || t.name.toLowerCase().includes(q.toLowerCase()) || t.code.toLowerCase().includes(q.toLowerCase())),
      ),
    [q, dept],
  );

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width="xl"
      footer={
        <>
          <div className="mr-auto flex items-center gap-1 text-xs text-muted-foreground">
            <button className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2">
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <span className="px-2">Page 1 of 4</span>
            <button className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2">
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <button onClick={onClose} className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(Array.from(selected));
              onClose();
            }}
            className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Save
          </button>
        </>
      }
    >
      <div className="border-b border-border p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-border px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by test name or code"
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none"
          >
            <option>All Department</option>
            {departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-surface-muted">
          <tr className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="w-8"></th>
            <th className="w-10"></th>
            <th className="px-2 py-2.5">Test Name</th>
            <th className="px-2 py-2.5">Department</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {filtered.map((t: LabTest) => (
            <tr key={t.id} className="hover:bg-muted/40">
              <td className="px-2 py-3 text-muted-foreground">
                <GripVertical className="h-4 w-4" />
              </td>
              <td className="px-2 py-3">
                <input
                  type="checkbox"
                  checked={selected.has(t.id)}
                  onChange={() => toggle(t.id)}
                  className={cn("h-4 w-4 rounded border-border accent-primary")}
                />
              </td>
              <td className="px-2 py-3">
                <div className="font-medium text-foreground">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.code}</div>
              </td>
              <td className="px-2 py-3 text-muted-foreground">{t.department}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}
