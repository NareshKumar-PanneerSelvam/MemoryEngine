import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useMemo, useState } from "react";
import { Markdown } from "tiptap-markdown";

import Toolbar, { type EditorMode } from "./Toolbar";

type TiptapEditorProps = {
  content?: string;
  placeholder?: string;
  maxCharacters?: number;
  editable?: boolean;
  onContentChange?: (value: { html: string; markdown: string }) => void;
};

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

export default function TiptapEditor({
  content = "",
  placeholder = "Start writing...",
  maxCharacters = 10000,
  editable = true,
  onContentChange,
}: TiptapEditorProps) {
  const [isReady, setIsReady] = useState(false);
  const [mode, setMode] = useState<EditorMode>("rich");
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
    editable,
    immediatelyRender: false,
    onCreate: () => setIsReady(true),
    onUpdate: ({ editor: nextEditor }) => {
      const markdownStorage = nextEditor.storage as MarkdownStorage;
      const markdown = markdownStorage.markdown?.getMarkdown() ?? "";
      setMarkdownDraft(markdown);

      if (!onContentChange) {
        return;
      }

      onContentChange({
        html: nextEditor.getHTML(),
        markdown,
      });
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(editable);
  }, [editor, editable]);

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

  const handleModeChange = (nextMode: EditorMode) => {
    if (!editor || nextMode === mode) {
      return;
    }

    if (nextMode === "markdown") {
      const markdownStorage = editor.storage as MarkdownStorage;
      setMarkdownDraft(markdownStorage.markdown?.getMarkdown() ?? "");
      setMode("markdown");
      return;
    }

    editor.commands.setContent(markdownDraft, false);
    setMode("rich");
  };

  const handleMarkdownChange = (value: string) => {
    setMarkdownDraft(value);

    if (!onContentChange) {
      return;
    }

    onContentChange({
      html: editor?.getHTML() ?? "",
      markdown: value,
    });
  };

  const characterStorage = (editor?.storage as CharacterCountStorage | undefined)?.characterCount;
  const characterCount = characterStorage?.characters() ?? markdownDraft.length;
  const wordCount = characterStorage?.words() ?? 0;

  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <Toolbar editor={editor} mode={mode} onModeChange={handleModeChange} disabled={!editable} />

      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
        <span>{editable ? `${mode === "rich" ? "Rich Text" : "Markdown"} Editor` : "Read Only"}</span>
        <span>
          {characterCount}/{maxCharacters} chars | {wordCount} words
        </span>
      </div>

      {mode === "rich" ? (
        <EditorContent
          editor={editor}
          className="min-h-[260px] p-4 text-sm text-gray-800 [&_.ProseMirror]:min-h-[230px] [&_.ProseMirror]:outline-none"
        />
      ) : (
        <textarea
          value={markdownDraft}
          onChange={(event) => handleMarkdownChange(event.target.value)}
          className="min-h-[260px] w-full resize-y border-0 p-4 font-mono text-sm text-gray-800 outline-none"
          disabled={!editable}
          placeholder="Write markdown..."
        />
      )}
    </section>
  );
}
