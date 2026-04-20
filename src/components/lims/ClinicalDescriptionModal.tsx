import { Bold, Italic, Underline, Highlighter, AlignLeft, AlignCenter, AlignRight, ListOrdered, List, Image, Table } from "lucide-react";
import { useState } from "react";
import { Modal } from "./Modal";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ClinicalDescriptionModal({ open, onClose }: Props) {
  const [text, setText] = useState("");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Clinical Description"
      width="2xl"
      footer={
        <>
          <button onClick={onClose} className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
          <button onClick={onClose} className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Save</button>
        </>
      }
    >
      <div className="border-b border-border bg-surface-muted px-3 py-2">
        <div className="flex flex-wrap items-center gap-1">
          <select className="rounded-md border border-border bg-surface px-2 py-1 text-xs">
            <option>Paragraph</option>
            <option>Heading 1</option>
            <option>Heading 2</option>
          </select>
          <select className="rounded-md border border-border bg-surface px-2 py-1 text-xs">
            <option>14</option><option>16</option><option>18</option>
          </select>
          <span className="mx-1 h-5 w-px bg-border" />
          {[Bold, Italic, Underline, Highlighter].map((Ic, i) => (
            <button key={i} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
              <Ic className="h-3.5 w-3.5" />
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-border" />
          {[AlignLeft, AlignCenter, AlignRight].map((Ic, i) => (
            <button key={i} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
              <Ic className="h-3.5 w-3.5" />
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-border" />
          {[ListOrdered, List, Table, Image].map((Ic, i) => (
            <button key={i} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
              <Ic className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={14}
        placeholder="Write the clinical description for this test…"
        className="w-full resize-none border-0 px-5 py-4 text-sm outline-none"
      />
      <div className="border-t border-border bg-surface-muted px-5 py-2 text-right text-xs text-muted-foreground">
        {text.split(/\s+/).filter(Boolean).length} words
      </div>
    </Modal>
  );
}
