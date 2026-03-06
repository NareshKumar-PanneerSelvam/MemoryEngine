import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Markdown } from "tiptap-markdown";

import {
  enhanceText,
  generateFlashcards,
  generateQuestions,
  rephraseText,
  simplifyText,
} from "../../services/api";
import ImageUpload from "../ImageUpload";
import AIMenu, { type AIAction, parseAiError } from "./AIMenu";
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

type FlashcardDraft = {
  question: string;
  answer: string;
};

type SelectionState = {
  start: number;
  end: number;
  text: string;
};

const EMPTY_SELECTION: SelectionState = { start: 0, end: 0, text: "" };

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

function replaceRange(source: string, start: number, end: number, replacement: string): string {
  return `${source.slice(0, start)}${replacement}${source.slice(end)}`;
}

function markdownFromQuestions(questions: string[]): string {
  return ["\n## Interview Questions", ...questions.map((question, index) => `${index + 1}. ${question}`), ""].join("\n");
}

function markdownFromFlashcards(flashcards: FlashcardDraft[]): string {
  const lines = ["\n## Flashcards"];
  flashcards.forEach((flashcard, index) => {
    lines.push(`\n### Card ${index + 1}`);
    lines.push(`**Q:** ${flashcard.question}`);
    lines.push(`**A:** ${flashcard.answer}`);
  });
  lines.push("");
  return lines.join("\n");
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

  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [selection, setSelection] = useState<SelectionState>(EMPTY_SELECTION);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<AIAction | null>(null);
  const [loadingAction, setLoadingAction] = useState<AIAction | null>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);

  const [questionsResult, setQuestionsResult] = useState<string[]>([]);
  const [flashcardsResult, setFlashcardsResult] = useState<FlashcardDraft[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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
    const textarea = textareaRef.current;
    if (!textarea) {
      emitMarkdownChange(`${markdownDraft}${snippet}`);
      return;
    }

    const nextValue = insertAtCursor(textarea, snippet);
    emitMarkdownChange(nextValue);
  };

  const updateMenuSelection = (event?: MouseEvent<HTMLTextAreaElement> | KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.slice(start, end).trim();

    if (start === end || selectedText.length === 0 || !editable) {
      setSelection(EMPTY_SELECTION);
      return;
    }

    setSelection({ start, end, text: textarea.value.slice(start, end) });
    setMenuError(null);

    const rect = textarea.getBoundingClientRect();
    let nextTop = 18;
    let nextLeft = rect.width / 2;

    if (event && "clientX" in event) {
      nextTop = event.clientY - rect.top + 16;
      nextLeft = event.clientX - rect.left + 12;
    }

    setMenuPosition({ top: Math.max(8, nextTop), left: Math.max(8, Math.min(nextLeft, rect.width - 270)) });
  };

  const runAiAction = async (action: AIAction) => {
    if (!selection.text.trim()) {
      return;
    }

    setLastAction(action);
    setLoadingAction(action);
    setMenuError(null);
    setSuccessMessage(null);

    try {
      if (action === "rephrase" || action === "enhance" || action === "simplify") {
        const current = markdownDraft;
        const selected = selection.text;
        let replacement = selected;

        if (action === "rephrase") {
          replacement = (await rephraseText({ text: selected })).rephrased;
        } else if (action === "enhance") {
          replacement = (await enhanceText({ text: selected })).enhanced;
        } else {
          replacement = (await simplifyText({ text: selected })).simplified;
        }

        setUndoStack((prev) => [...prev.slice(-9), current]);
        const nextValue = replaceRange(current, selection.start, selection.end, replacement);
        emitMarkdownChange(nextValue);
        setSelection(EMPTY_SELECTION);
        setSuccessMessage("AI update applied. You can undo if needed.");
        return;
      }

      if (action === "questions") {
        const result = await generateQuestions({ text: selection.text, count: 5 });
        setQuestionsResult(result.questions);
        return;
      }

      const result = await generateFlashcards({ text: selection.text, count: 5 });
      setFlashcardsResult(result.flashcards);
    } catch (error) {
      setMenuError(parseAiError(error));
    } finally {
      setLoadingAction(null);
    }
  };

  const undoAiOperation = () => {
    setUndoStack((prev) => {
      if (prev.length === 0) {
        return prev;
      }

      const clone = [...prev];
      const previous = clone.pop();
      if (previous !== undefined) {
        emitMarkdownChange(previous);
      }
      return clone;
    });
  };

  const appendMarkdown = (snippet: string) => {
    const nextValue = `${markdownDraft}${snippet}`;
    emitMarkdownChange(nextValue);
    setSuccessMessage("Inserted generated content into the page.");
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
              onClick={() => setIsImageUploadOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
              disabled={!editable}
              title="Upload image for OCR"
            >
              <IconFileText className="h-3.5 w-3.5" />
              OCR Image
            </button>
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

      {successMessage ? (
        <p className="border-b border-emerald-900/60 bg-emerald-950/30 px-4 py-2 text-xs text-emerald-300">{successMessage}</p>
      ) : null}

      {mode === "markdown" ? (
        <div className="relative">
          <textarea
            id="page-markdown-editor"
            ref={textareaRef}
            value={markdownDraft}
            onChange={(event) => emitMarkdownChange(event.target.value)}
            onMouseUp={(event) => updateMenuSelection(event)}
            onKeyUp={(event) => updateMenuSelection(event)}
            className="min-h-[55vh] w-full resize-y border-0 bg-slate-950 p-5 font-mono text-sm leading-7 text-slate-200 outline-none"
            disabled={!editable}
            placeholder={placeholder}
            spellCheck={false}
          />

          <AIMenu
            isOpen={editable && selection.text.trim().length > 0}
            position={menuPosition}
            loadingAction={loadingAction}
            error={menuError}
            canRetry={lastAction !== null}
            onRetry={() => {
              if (lastAction) {
                void runAiAction(lastAction);
              }
            }}
            onAction={(action) => {
              void runAiAction(action);
            }}
          />
        </div>
      ) : (
        <EditorContent editor={editor} className="bg-slate-950" />
      )}

      {questionsResult.length > 0 ? (
        <div className="border-t border-slate-800 bg-slate-900/30 p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-100">Generated Questions</h4>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(questionsResult.join("\n"));
                  setSuccessMessage("Questions copied to clipboard.");
                }}
                className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
              >
                Copy
              </button>
              <button
                type="button"
                onClick={() => appendMarkdown(markdownFromQuestions(questionsResult))}
                className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
              >
                Insert into page
              </button>
              <button
                type="button"
                onClick={() => setQuestionsResult([])}
                className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-300">
            {questionsResult.map((question, index) => (
              <li key={`${question}-${index}`}>{question}</li>
            ))}
          </ol>
        </div>
      ) : null}

      {flashcardsResult.length > 0 ? (
        <div className="border-t border-slate-800 bg-slate-900/30 p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-100">Generated Flashcards</h4>
            <button
              type="button"
              onClick={() => setFlashcardsResult([])}
              className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
            >
              Close
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {flashcardsResult.map((flashcard, index) => (
              <div key={`flashcard-${index}`} className="rounded-md border border-slate-800 bg-slate-950/40 p-3">
                <label className="block text-xs font-medium text-slate-400">Question</label>
                <input
                  value={flashcard.question}
                  onChange={(event) => {
                    const next = [...flashcardsResult];
                    next[index] = { ...next[index], question: event.target.value };
                    setFlashcardsResult(next);
                  }}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-200"
                />
                <label className="mt-2 block text-xs font-medium text-slate-400">Answer</label>
                <textarea
                  value={flashcard.answer}
                  onChange={(event) => {
                    const next = [...flashcardsResult];
                    next[index] = { ...next[index], answer: event.target.value };
                    setFlashcardsResult(next);
                  }}
                  className="mt-1 min-h-20 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-200"
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => appendMarkdown(markdownFromFlashcards(flashcardsResult))}
              className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
            >
              Save all to this page
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/40 px-4 py-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <IconSave className="h-3.5 w-3.5" />
          Autosave enabled
        </span>
        <div className="flex items-center gap-2">
          {undoStack.length > 0 ? (
            <button
              type="button"
              onClick={undoAiOperation}
              className="rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-300 hover:bg-slate-800"
            >
              Undo AI change
            </button>
          ) : null}
          <span>Markdown is the source of truth. Rich mode loads saved markdown.</span>
        </div>
      </div>

      <ImageUpload
        isOpen={isImageUploadOpen}
        onClose={() => setIsImageUploadOpen(false)}
        onInsertMarkdown={(markdown) => {
          appendMarkdown(`\n${markdown.trim()}\n`);
        }}
      />
    </section>
  );
}
