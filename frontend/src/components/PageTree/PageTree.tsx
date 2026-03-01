import { useMemo, useState } from "react";

import type { Page } from "../../types/page";
import {
  IconChevronDown,
  IconChevronRight,
  IconEdit,
  IconFileText,
  IconPlus,
  IconTrash,
} from "../ui/icons";

type PageTreeProps = {
  pages: Page[];
  selectedPageId?: string | null;
  isLoading?: boolean;
  error?: string | null;
  onSelectPage: (page: Page) => void;
  onEditPage: (page: Page) => void;
  onCreatePage: (parentId?: string) => void;
  onDeletePage: (page: Page) => void;
};

export default function PageTree({
  pages,
  selectedPageId = null,
  isLoading = false,
  error = null,
  onSelectPage,
  onEditPage,
  onCreatePage,
  onDeletePage,
}: PageTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const hasPages = pages.length > 0;

  const pageCount = useMemo(() => {
    const countNodes = (items: Page[]): number =>
      items.reduce((sum, item) => sum + 1 + countNodes(item.children ?? []), 0);
    return countNodes(pages);
  }, [pages]);

  const toggleExpanded = (pageId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  };

  const renderNode = (page: Page, depth: number) => {
    const children = page.children ?? [];
    const hasChildren = children.length > 0;
    const isExpanded = expanded.has(page.id);
    const isSelected = selectedPageId === page.id;
    const paddingLeft = 8 + depth * 16;

    return (
      <div key={page.id}>
        <div
          className={`group flex items-center gap-1 rounded-md px-1 py-1.5 transition ${
            isSelected
              ? "bg-slate-800 text-slate-100"
              : "text-slate-300 hover:bg-slate-900"
          }`}
          style={{ paddingLeft }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(page.id)}
              className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-800"
              aria-label={isExpanded ? "Collapse page" : "Expand page"}
            >
              {isExpanded ? (
                <IconChevronDown className="h-4 w-4" />
              ) : (
                <IconChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="inline-flex h-6 w-6 items-center justify-center text-slate-600">
              <IconFileText className="h-3.5 w-3.5" />
            </span>
          )}

          <button
            onClick={() => onSelectPage(page)}
            className="min-w-0 flex-1 truncate text-left text-sm font-medium"
            title={page.title}
          >
            {page.title}
          </button>

          {page.is_shared ? (
            <span className="rounded bg-indigo-950 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-indigo-300">
              {page.permission === "edit" ? "shared-edit" : "shared-view"}
            </span>
          ) : null}

          <button
            onClick={() => onEditPage(page)}
            className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 opacity-0 transition hover:bg-slate-800 hover:text-slate-100 group-hover:opacity-100"
            aria-label="Rename page"
            title="Rename page"
          >
            <IconEdit className="h-4 w-4" />
          </button>

          <button
            onClick={() => onCreatePage(page.id)}
            className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 opacity-0 transition hover:bg-slate-800 hover:text-slate-100 group-hover:opacity-100"
            aria-label="Create child page"
            title="Create child page"
          >
            <IconPlus className="h-4 w-4" />
          </button>

          <button
            onClick={() => onDeletePage(page)}
            className="inline-flex h-6 w-6 items-center justify-center rounded text-red-400 opacity-0 transition hover:bg-red-950/50 group-hover:opacity-100"
            aria-label="Delete page"
            title="Delete page"
          >
            <IconTrash className="h-4 w-4" />
          </button>
        </div>

        {hasChildren && isExpanded ? (
          <div className="border-l border-slate-800">{children.map((child) => renderNode(child, depth + 1))}</div>
        ) : null}
      </div>
    );
  };

  return (
    <section className="h-full p-3">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Pages</h2>
        <button
          onClick={() => onCreatePage(undefined)}
          className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-900"
        >
          <IconPlus className="h-3.5 w-3.5" />
          New Page
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-md bg-slate-900 px-3 py-6 text-center text-sm text-slate-400">
          Loading pages...
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="rounded-md border border-red-900/60 bg-red-950/30 px-3 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {!isLoading && !error && !hasPages ? (
        <div className="rounded-md border border-dashed border-slate-700 px-3 py-6 text-center text-sm text-slate-400">
          No pages yet. Create your first page.
        </div>
      ) : null}

      {!isLoading && !error && hasPages ? (
        <div className="space-y-1">{pages.map((page) => renderNode(page, 0))}</div>
      ) : null}

      {!isLoading && !error && hasPages ? (
        <p className="mt-3 text-xs text-slate-500">{pageCount} pages total</p>
      ) : null}
    </section>
  );
}
