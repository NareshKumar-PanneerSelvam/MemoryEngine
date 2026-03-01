import { AxiosError } from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import TiptapEditor from "../components/Editor/TiptapEditor";
import { IconChevronRight, IconEdit, IconSave } from "../components/ui/icons";
import { getPage, updatePage } from "../services/api";
import type { Page } from "../types/page";

type SaveState = "idle" | "saving" | "saved" | "error";

type EditorPageProps = {
  pages?: Page[];
  onPageUpdated?: (page: Page) => void;
};

function parseApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    const detail = error.response?.data as { detail?: string } | undefined;
    if (typeof detail?.detail === "string") {
      return detail.detail;
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Request failed";
}

function flattenPages(nodes: Page[]): Page[] {
  return nodes.flatMap((node) => [node, ...flattenPages(node.children ?? [])]);
}

function buildBreadcrumbs(page: Page | null, pages: Page[]): Page[] {
  if (!page) {
    return [];
  }

  const byId = new Map(flattenPages(pages).map((item) => [item.id, item]));
  const trail: Page[] = [];
  const visited = new Set<string>();

  let current: Page | undefined = page;
  while (current) {
    if (visited.has(current.id)) {
      break;
    }
    visited.add(current.id);
    trail.unshift(current);

    if (!current.parent_id) {
      break;
    }

    current = byId.get(current.parent_id);
  }

  return trail;
}

export default function EditorPage({ pages = [], onPageUpdated }: EditorPageProps) {
  const { pageId } = useParams<{ pageId: string }>();

  const [page, setPage] = useState<Page | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const [lastSavedTitle, setLastSavedTitle] = useState("");
  const [lastSavedContent, setLastSavedContent] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  const saveRequestId = useRef(0);

  const canEdit = !(page?.is_shared && page.permission === "view_only");

  const breadcrumbs = useMemo(() => buildBreadcrumbs(page, pages), [page, pages]);

  const hasChanges = draftContent !== lastSavedContent;

  const loadPage = useCallback(async () => {
    if (!pageId) {
      setPage(null);
      setDraftContent("");
      setLastSavedTitle("");
      setLastSavedContent("");
      setError(null);
      setSaveState("idle");
      setSaveError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSaveError(null);

    try {
      const result = await getPage(pageId);
      setPage(result);
      setDraftContent(result.content ?? "");
      setLastSavedTitle(result.title);
      setLastSavedContent(result.content ?? "");
      setSaveState("idle");
      setLastSavedAt(null);
    } catch (err) {
      setError(parseApiError(err));
      setPage(null);
    } finally {
      setIsLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const persistChanges = useCallback(
    async (title: string, content: string, source: "auto" | "manual") => {
      if (!pageId || !page || !canEdit) {
        return;
      }

      const normalizedTitle = title.trim();
      if (!normalizedTitle) {
        setSaveState("error");
        setSaveError("Page title cannot be empty.");
        return;
      }

      const requestId = saveRequestId.current + 1;
      saveRequestId.current = requestId;

      setSaveState("saving");
      setSaveError(null);

      try {
        const updated = await updatePage(pageId, {
          title: normalizedTitle,
          content,
        });

        if (requestId !== saveRequestId.current) {
          return;
        }

        setPage(updated);
        setDraftContent(updated.content ?? "");
        setLastSavedTitle(updated.title);
        setLastSavedContent(updated.content ?? "");
        setSaveState("saved");
        setLastSavedAt(new Date().toISOString());
        onPageUpdated?.(updated);

        if (source === "manual") {
          setTimeout(() => {
            setSaveState((prev) => (prev === "saved" ? "idle" : prev));
          }, 1200);
        }
      } catch (err) {
        if (requestId !== saveRequestId.current) {
          return;
        }

        setSaveState("error");
        setSaveError(parseApiError(err));
      }
    },
    [canEdit, onPageUpdated, page, pageId],
  );

  useEffect(() => {
    if (!page || !pageId || !canEdit) {
      return;
    }

    if (!hasChanges) {
      return;
    }

    const timeout = setTimeout(() => {
      void persistChanges(lastSavedTitle, draftContent, "auto");
    }, 2000);

    return () => {
      clearTimeout(timeout);
    };
  }, [canEdit, draftContent, hasChanges, lastSavedTitle, page, pageId, persistChanges]);

  const saveStateLabel =
    saveState === "saving"
      ? "Saving..."
      : saveState === "saved"
        ? "Saved"
        : saveState === "error"
          ? "Save failed"
          : hasChanges
            ? "Unsaved changes"
            : "";

  const openRenameModal = () => {
    if (!page) {
      return;
    }
    setRenameValue(page.title);
    setRenameError(null);
    setIsRenameModalOpen(true);
  };

  const closeRenameModal = () => {
    setIsRenameModalOpen(false);
    setRenameValue("");
    setRenameError(null);
    setIsRenaming(false);
  };

  const handleRename = async () => {
    if (!pageId || !page || !canEdit) {
      return;
    }

    const nextTitle = renameValue.trim();
    if (!nextTitle) {
      setRenameError("Page title cannot be empty.");
      return;
    }

    setIsRenaming(true);
    setRenameError(null);

    try {
      const updated = await updatePage(pageId, {
        title: nextTitle,
        content: draftContent,
      });

      setPage(updated);
      setLastSavedTitle(updated.title);
      setLastSavedContent(updated.content ?? "");
      setDraftContent(updated.content ?? "");
      setSaveState("saved");
      setLastSavedAt(new Date().toISOString());
      onPageUpdated?.(updated);
      closeRenameModal();
    } catch (err) {
      setRenameError(parseApiError(err));
      setIsRenaming(false);
    }
  };

  if (!pageId) {
    return (
      <div className="rounded-md border border-dashed border-slate-700 bg-slate-900 px-4 py-8 text-center text-sm text-slate-400">
        Select a page from the tree to start editing.
      </div>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-slate-400">Loading editor...</p>;
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-300">
        {error}
      </div>
    );
  }

  if (!page) {
    return (
      <div className="rounded-md border border-dashed border-slate-700 bg-slate-900 px-4 py-8 text-center text-sm text-slate-400">
        Page not found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap items-center gap-1 text-xs text-slate-400">
        <Link to="/pages" className="rounded px-1.5 py-0.5 hover:bg-slate-900 hover:text-slate-200">
          Pages
        </Link>
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <div key={item.id} className="inline-flex items-center gap-1">
              <IconChevronRight className="h-3.5 w-3.5 text-slate-600" />
              {isLast ? (
                <span className="inline-flex items-center gap-1 rounded bg-slate-900 px-1.5 py-0.5 text-slate-200">
                  {item.title}
                  {canEdit ? (
                    <button
                      type="button"
                      onClick={openRenameModal}
                      className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-slate-800"
                      title="Rename page"
                      aria-label="Rename page"
                    >
                      <IconEdit className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </span>
              ) : (
                <Link
                  to={`/pages/${item.id}`}
                  className="rounded px-1.5 py-0.5 hover:bg-slate-900 hover:text-slate-200"
                >
                  {item.title}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            void persistChanges(lastSavedTitle, draftContent, "manual");
          }}
          disabled={!canEdit || !hasChanges || saveState === "saving"}
          className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <IconSave className="h-4 w-4" />
          Save now
        </button>

        {saveStateLabel ? (
          <span
            className={`rounded-md px-2 py-1 text-xs font-medium ${
              saveState === "error"
                ? "bg-red-950/50 text-red-300"
                : saveState === "saved"
                  ? "bg-emerald-950/50 text-emerald-300"
                  : saveState === "saving"
                    ? "bg-amber-950/50 text-amber-300"
                    : "bg-slate-900 text-slate-300"
            }`}
          >
            {saveStateLabel}
          </span>
        ) : null}
      </div>

      {saveError ? (
        <p className="rounded-md border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-300">
          {saveError}
        </p>
      ) : null}

      {!canEdit ? (
        <p className="rounded-md border border-indigo-900/60 bg-indigo-950/30 px-3 py-2 text-sm text-indigo-300">
          You have view-only access to this shared page.
        </p>
      ) : null}

      <TiptapEditor
        content={draftContent}
        editable={canEdit}
        onContentChange={({ markdown }) => {
          setDraftContent(markdown);
        }}
      />

      {lastSavedAt ? (
        <p className="text-xs text-slate-500">
          Last saved at {new Date(lastSavedAt).toLocaleTimeString()}
        </p>
      ) : null}

      {isRenameModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-100">Rename page</h3>
            <p className="mt-1 text-sm text-slate-400">Update the title shown in the tree and breadcrumb.</p>

            <label className="mt-4 block text-sm font-medium text-slate-300">
              Page title
              <input
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-0 focus:border-slate-500"
                placeholder="Enter page title"
                autoFocus
              />
            </label>

            {renameError ? (
              <p className="mt-3 rounded-md border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-300">
                {renameError}
              </p>
            ) : null}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeRenameModal}
                className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                disabled={isRenaming}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleRename()}
                className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isRenaming}
              >
                <IconEdit className="h-4 w-4" />
                {isRenaming ? "Saving..." : "Save title"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
