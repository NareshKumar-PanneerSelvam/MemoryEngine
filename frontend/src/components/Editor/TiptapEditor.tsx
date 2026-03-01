import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useMemo, useState } from "react";
import { Markdown } from "tiptap-markdown";

import { IconCode, IconEdit, IconEye, IconFileText, IconSave } from "../ui/icons";

type TiptapEditorProps = {
  content?: string;
  placeholder?: string;
  maxCharacters?: number;
  editable?: boolean;
  onContentChange?: (value: { html: string; markdown: string }) => void;
};

type EditorMode = "markdown" | "preview" | "rich";

type MarkdownStorage = {
  markdown?: {
    getMarkdown: () => string;
  };
};

type CharacterCountStorage = {
  characterCount?: {
    characters: () => number;
    words: () => number;
  };
};

function insertAtCursor(textarea: HTMLTextAreaElement, snippet: string): string {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const nextValue = `${textarea.value.slice(0, start)}${snippet}${textarea.value.slice(end)}`;

  textarea.value = nextValue;
  const nextCursor = start + snippet.length;
  textarea.selectionStart = nextCursor;
  textarea.selectionEnd = nextCursor;
  textarea.focus();

  return nextValue;
}

export default function TiptapEditor({
  content = "",
  placeholder = "Start writing in Markdown...",
  maxCharacters = 10000,
  editable = true,
  onContentChange,
}: TiptapEditorProps) {
  const [isReady, setIsReady] = useState(false);
  const [mode, setMode] = useState<EditorMode>("markdown");
  const [markdownDraft, setMarkdownDraft] = useState(content);

  const extensions = useMemo(
    () => [
      StarterKit,
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: maxCharacters }),
      Markdown.configure({
        html: false,
        transformCopiedText: true,
        transformPastedText: true,
      }),
    ],
    [maxCharacters, placeholder],
  );

  const editor = useEditor({
    extensions,
    content,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[55vh] p-5 text-sm leading-7 text-slate-200 outline-none [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_blockquote]:border-l-2 [&_blockquote]:border-slate-600 [&_blockquote]:pl-3 [&_code]:rounded [&_code]:bg-slate-800 [&_code]:px-1.5 [&_code]:py-0.5",
      },
    },
    onCreate: () => setIsReady(true),
    onUpdate: ({ editor: nextEditor }) => {
      const markdownStorage = nextEditor.storage as MarkdownStorage;
      const markdown = markdownStorage.markdown?.getMarkdown() ?? "";
      setMarkdownDraft(markdown);
      onContentChange?.({ html: nextEditor.getHTML(), markdown });
    },
  });

  useEffect(() => {
    setMarkdownDraft(content);
  }, [content]);

  useEffect(() => {
    if (!editor || !isReady) {
      return;
    }

    const markdownStorage = editor.storage as MarkdownStorage;
    const currentMarkdown = markdownStorage.markdown?.getMarkdown() ?? "";
    if (currentMarkdown === content) {
      return;
    }

    editor.commands.setContent(content, false);
  }, [content, editor, isReady]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(mode === "rich" && editable);
  }, [editor, mode, editable]);

  const characterStorage = (editor?.storage as CharacterCountStorage | undefined)?.characterCount;
  const characterCount = characterStorage?.characters() ?? markdownDraft.length;
  const wordCount = characterStorage?.words() ?? (markdownDraft.trim() ? markdownDraft.trim().split(/\s+/).length : 0);

  const emitMarkdownChange = (nextValue: string) => {
    setMarkdownDraft(nextValue);
    onContentChange?.({ html: editor?.getHTML() ?? nextValue, markdown: nextValue });
  };

  const switchMode = (nextMode: EditorMode) => {
    if (!editor || nextMode === mode) {
      setMode(nextMode);
      return;
    }

    if (nextMode === "rich" || nextMode === "preview") {
      editor.commands.setContent(markdownDraft, false);
    }

    setMode(nextMode);
  };

  const insertSnippet = (snippet: string) => {
    const textarea = document.getElementById("page-markdown-editor") as HTMLTextAreaElement | null;
    if (!textarea) {
      emitMarkdownChange(`${markdownDraft}${snippet}`);
      return;
    }

    const nextValue = insertAtCursor(textarea, snippet);
    emitMarkdownChange(nextValue);
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-[0_0_0_1px_rgba(30,41,59,0.5)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-900 px-3 py-2">
        <button
          type="button"
          onClick={() => switchMode("markdown")}
          className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
            mode === "markdown"
              ? "border-slate-500 bg-slate-700 text-slate-50"
              : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
          }`}
        >
          Markdown
        </button>
        <button
          type="button"
          onClick={() => switchMode("preview")}
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium ${
            mode === "preview"
              ? "border-slate-500 bg-slate-700 text-slate-50"
              : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
          }`}
        >
          <IconEye className="h-3.5 w-3.5" />
          Preview
        </button>
        <button
          type="button"
          onClick={() => switchMode("rich")}
          className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
            mode === "rich"
              ? "border-slate-500 bg-slate-700 text-slate-50"
              : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
          }`}
          disabled={!editable}
          title="Rich text mode from markdown source"
        >
          Rich
        </button>

        {mode === "markdown" ? (
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => insertSnippet("\n```ts\n// code\n```\n")}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
              disabled={!editable}
              title="Insert code block"
            >
              <IconCode className="h-3.5 w-3.5" />
              Code
            </button>
            <button
              type="button"
              onClick={() => insertSnippet("\n```mermaid\nflowchart TD\n  A[Start] --> B[Next]\n```\n")}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
              disabled={!editable}
              title="Insert mermaid block"
            >
              <IconEdit className="h-3.5 w-3.5" />
              Mermaid
            </button>
            <button
              type="button"
              onClick={() => insertSnippet("\n![alt text](https://example.com/image.png)\n")}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
              disabled={!editable}
              title="Insert image markdown"
            >
              <IconFileText className="h-3.5 w-3.5" />
              Image
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-2 text-xs text-slate-400">
        <span>
          {mode === "markdown"
            ? editable
              ? "Markdown Editor"
              : "Read Only"
            : mode === "preview"
              ? "Markdown Preview"
              : "Rich Text Editor"}
        </span>
        <span>
          {characterCount}/{maxCharacters} chars | {wordCount} words
        </span>
      </div>

      {mode === "markdown" ? (
        <textarea
          id="page-markdown-editor"
          value={markdownDraft}
          onChange={(event) => emitMarkdownChange(event.target.value)}
          className="min-h-[55vh] w-full resize-y border-0 bg-slate-950 p-5 font-mono text-sm leading-7 text-slate-200 outline-none"
          disabled={!editable}
          placeholder={placeholder}
          spellCheck={false}
        />
      ) : (
        <EditorContent editor={editor} className="bg-slate-950" />
      )}

      <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/40 px-4 py-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <IconSave className="h-3.5 w-3.5" />
          Autosave enabled
        </span>
        <span>Markdown is the source of truth. Rich mode loads saved markdown.</span>
      </div>
    </section>
  );
}
