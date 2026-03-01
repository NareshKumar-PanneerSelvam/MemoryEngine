import type { Editor } from "@tiptap/react";

export type EditorMode = "rich" | "markdown";

type ToolbarProps = {
  editor: Editor | null;
  mode: EditorMode;
  onModeChange: (nextMode: EditorMode) => void;
  disabled?: boolean;
};

export default function Toolbar({ mode, onModeChange, disabled = false }: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-900 px-3 py-2">
      <button
        type="button"
        title="Rich text mode"
        onClick={() => onModeChange("rich")}
        disabled={disabled}
        className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
          mode === "rich"
            ? "border-slate-500 bg-slate-700 text-slate-50"
            : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        Rich
      </button>
      <button
        type="button"
        title="Markdown mode"
        onClick={() => onModeChange("markdown")}
        disabled={disabled}
        className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
          mode === "markdown"
            ? "border-slate-500 bg-slate-700 text-slate-50"
            : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        Markdown
      </button>
    </div>
  );
}
