import { AxiosError } from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import TiptapEditor from "../components/Editor/TiptapEditor";
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
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [lastSavedTitle, setLastSavedTitle] = useState("");
  const [lastSavedContent, setLastSavedContent] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const saveRequestId = useRef(0);

  const canEdit = !(page?.is_shared && page.permission === "view_only");

  const breadcrumbs = useMemo(() => buildBreadcrumbs(page, pages), [page, pages]);

  const hasChanges =
    draftTitle.trim() !== lastSavedTitle.trim() || draftContent !== lastSavedContent;

  const loadPage = useCallback(async () => {
    if (!pageId) {
      setPage(null);
      setDraftTitle("");
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
      setDraftTitle(result.title);
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
        setDraftTitle(updated.title);
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
      void persistChanges(draftTitle, draftContent, "auto");
    }, 2000);

    return () => {
      clearTimeout(timeout);
    };
  }, [canEdit, draftContent, draftTitle, hasChanges, page, pageId, persistChanges]);

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

  if (!pageId) {
    return (
      <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        Select a page from the tree to start editing.
      </div>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading editor...</p>;
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!page) {
    return (
      <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        Page not found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <nav className="text-xs text-gray-500">
        <Link to="/dashboard" className="hover:text-gray-700">
          Pages
        </Link>
        {breadcrumbs.map((item) => (
          <span key={item.id}>
            {" / "}
            <Link to={`/dashboard/${item.id}`} className="hover:text-gray-700">
              {item.title}
            </Link>
          </span>
        ))}
      </nav>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={draftTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
          onBlur={() => {
            if (draftTitle.trim()) {
              return;
            }
            setDraftTitle(lastSavedTitle);
          }}
          disabled={!canEdit}
          className="min-w-[220px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-lg font-semibold text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 disabled:bg-gray-100 disabled:text-gray-500"
        />
        <button
          type="button"
          onClick={() => {
            void persistChanges(draftTitle, draftContent, "manual");
          }}
          disabled={!canEdit || !hasChanges || saveState === "saving"}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save now
        </button>
        {saveStateLabel ? (
          <span
            className={`rounded-md px-2 py-1 text-xs font-medium ${
              saveState === "error"
                ? "bg-red-100 text-red-700"
                : saveState === "saved"
                  ? "bg-green-100 text-green-700"
                  : saveState === "saving"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-gray-100 text-gray-700"
            }`}
          >
            {saveStateLabel}
          </span>
        ) : null}
      </div>

      {saveError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {saveError}
        </p>
      ) : null}

      {!canEdit ? (
        <p className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
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
        <p className="text-xs text-gray-400">
          Last saved at {new Date(lastSavedAt).toLocaleTimeString()}
        </p>
      ) : null}
    </div>
  );
}
