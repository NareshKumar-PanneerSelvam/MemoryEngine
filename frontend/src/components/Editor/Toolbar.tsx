import type { Editor } from "@tiptap/react";

export type EditorMode = "rich" | "markdown";

type ToolbarProps = {
  editor: Editor | null;
  mode: EditorMode;
  onModeChange: (nextMode: EditorMode) => void;
  disabled?: boolean;
};

type ActionButton = {
  label: string;
  title: string;
  action: () => void;
  isActive?: () => boolean;
};

function ToolbarButton({
  label,
  title,
  onClick,
  active = false,
  disabled = false,
}: {
  label: string;
  title: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded border px-2.5 py-1 text-xs font-medium transition ${
        active
          ? "border-primary-500 bg-primary-100 text-primary-800"
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {label}
    </button>
  );
}

export default function Toolbar({ editor, mode, onModeChange, disabled = false }: ToolbarProps) {
  const richModeDisabled = disabled || mode === "markdown" || !editor;

  const actions: ActionButton[] = [
    {
      label: "B",
      title: "Bold",
      action: () => editor?.chain().focus().toggleBold().run(),
      isActive: () => !!editor?.isActive("bold"),
    },
    {
      label: "I",
      title: "Italic",
      action: () => editor?.chain().focus().toggleItalic().run(),
      isActive: () => !!editor?.isActive("italic"),
    },
    {
      label: "Code",
      title: "Inline code",
      action: () => editor?.chain().focus().toggleCode().run(),
      isActive: () => !!editor?.isActive("code"),
    },
    {
      label: "H2",
      title: "Heading",
      action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => !!editor?.isActive("heading", { level: 2 }),
    },
    {
      label: "List",
      title: "Bullet list",
      action: () => editor?.chain().focus().toggleBulletList().run(),
      isActive: () => !!editor?.isActive("bulletList"),
    },
    {
      label: "1.",
      title: "Ordered list",
      action: () => editor?.chain().focus().toggleOrderedList().run(),
      isActive: () => !!editor?.isActive("orderedList"),
    },
    {
      label: ">",
      title: "Blockquote",
      action: () => editor?.chain().focus().toggleBlockquote().run(),
      isActive: () => !!editor?.isActive("blockquote"),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((item) => (
          <ToolbarButton
            key={item.title}
            label={item.label}
            title={item.title}
            onClick={item.action}
            active={item.isActive?.()}
            disabled={richModeDisabled}
          />
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ToolbarButton
          label="Rich"
          title="Rich text mode"
          onClick={() => onModeChange("rich")}
          active={mode === "rich"}
          disabled={disabled}
        />
        <ToolbarButton
          label="Markdown"
          title="Markdown mode"
          onClick={() => onModeChange("markdown")}
          active={mode === "markdown"}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
