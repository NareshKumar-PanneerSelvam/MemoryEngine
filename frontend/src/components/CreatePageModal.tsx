import { useMemo, useState } from "react";

import type { Page } from "../types/page";

type ParentOption = {
  id: string;
  label: string;
};

type CreatePageModalProps = {
  isOpen: boolean;
  pages: Page[];
  defaultParentId?: string | null;
  isSubmitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: { title: string; parentId: string | null }) => Promise<void>;
};

function buildParentOptions(nodes: Page[], depth = 0): ParentOption[] {
  return nodes.flatMap((page) => {
    const prefix = depth === 0 ? "" : `${"  ".repeat(depth)}- `;
    const current: ParentOption = {
      id: page.id,
      label: `${prefix}${page.title}`,
    };

    return [current, ...buildParentOptions(page.children ?? [], depth + 1)];
  });
}

export default function CreatePageModal({
  isOpen,
  pages,
  defaultParentId = null,
  isSubmitting = false,
  error = null,
  onClose,
  onSubmit,
}: CreatePageModalProps) {
  const [title, setTitle] = useState("");
  const [parentId, setParentId] = useState<string>(defaultParentId ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);

  const parentOptions = useMemo(() => buildParentOptions(pages), [pages]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setValidationError("Title is required.");
      return;
    }

    setValidationError(null);
    await onSubmit({
      title: trimmedTitle,
      parentId: parentId || null,
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Create Page</h2>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
            disabled={isSubmitting}
            aria-label="Close create page modal"
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="page-title" className="mb-1 block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              id="page-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter page title"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="page-parent" className="mb-1 block text-sm font-medium text-gray-700">
              Parent Page (Optional)
            </label>
            <select
              id="page-parent"
              value={parentId}
              onChange={(event) => setParentId(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              disabled={isSubmitting}
            >
              <option value="">No parent (root page)</option>
              {parentOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {validationError ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {validationError}
            </p>
          ) : null}

          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
