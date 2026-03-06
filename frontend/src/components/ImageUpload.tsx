import { useMemo, useState } from "react";

import { imageToMarkdown } from "../services/api";
import { parseAiError } from "./Editor/AIMenu";

type ImageUploadProps = {
  isOpen: boolean;
  onClose: () => void;
  onInsertMarkdown: (markdown: string) => void;
};

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif"];

function isAcceptedFile(file: File): boolean {
  return ACCEPTED_TYPES.includes(file.type);
}

export default function ImageUpload({ isOpen, onClose, onInsertMarkdown }: ImageUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [markdown, setMarkdown] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const previewUrl = useMemo(() => {
    if (!file) {
      return null;
    }
    return URL.createObjectURL(file);
  }, [file]);

  if (!isOpen) {
    return null;
  }

  const selectFile = (nextFile: File | null) => {
    setError(null);
    setMarkdown("");
    setConfidence(null);

    if (!nextFile) {
      setFile(null);
      return;
    }

    if (!isAcceptedFile(nextFile)) {
      setError("Unsupported image format. Use JPEG, PNG, or HEIC.");
      return;
    }

    setFile(nextFile);
  };

  const handleConvert = async () => {
    if (!file) {
      setError("Choose an image to convert.");
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      const result = await imageToMarkdown(file);
      setMarkdown(result.markdown);
      setConfidence(result.confidence);
    } catch (err) {
      setError(parseAiError(err));
    } finally {
      setIsConverting(false);
    }
  };

  const handleInsert = () => {
    if (!markdown.trim()) {
      setError("No markdown content to insert.");
      return;
    }

    onInsertMarkdown(markdown);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Image to Markdown (OCR)</h3>
            <p className="mt-1 text-sm text-slate-400">
              Drop an image of notes, convert to Markdown, then edit before inserting.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <div
          className="mt-4 rounded-lg border border-dashed border-slate-700 bg-slate-950/60 p-4"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            selectFile(event.dataTransfer.files?.[0] ?? null);
          }}
        >
          <label className="block cursor-pointer text-sm text-slate-300">
            <span className="mb-2 block font-medium text-slate-200">Upload image</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/heic,image/heif"
              className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-900 hover:file:bg-white"
              onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <p className="mt-2 text-xs text-slate-500">Accepted formats: JPEG, PNG, HEIC</p>
        </div>

        {previewUrl ? (
          <div className="mt-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Preview</p>
            <img src={previewUrl} alt="Uploaded preview" className="max-h-72 rounded-md border border-slate-700" />
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleConvert()}
            disabled={!file || isConverting}
            className="rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isConverting ? "Converting..." : "Convert to Markdown"}
          </button>
          {confidence !== null ? (
            <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300">
              Confidence: {(confidence * 100).toFixed(0)}%
            </span>
          ) : null}
        </div>

        {error ? (
          <p className="mt-3 rounded-md border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        <label className="mt-4 block text-sm font-medium text-slate-200">
          Generated Markdown
          <textarea
            value={markdown}
            onChange={(event) => setMarkdown(event.target.value)}
            className="mt-1 min-h-48 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-200 outline-none focus:border-slate-500"
            placeholder="Converted markdown appears here..."
          />
        </label>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInsert}
            disabled={!markdown.trim()}
            className="rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Insert into page
          </button>
        </div>
      </div>
    </div>
  );
}
