import { useMemo, useState } from "react";

import type { Page } from "../../types/page";

type PageTreeProps = {
  pages: Page[];
  selectedPageId?: string | null;
  isLoading?: boolean;
  error?: string | null;
  onSelectPage: (page: Page) => void;
  onCreatePage: (parentId?: string) => void;
  onDeletePage: (page: Page) => void;
};

export default function PageTree({
  pages,
  selectedPageId = null,
  isLoading = false,
  error = null,
  onSelectPage,
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
            isSelected ? "bg-primary-100 text-primary-900" : "hover:bg-gray-100"
          }`}
          style={{ paddingLeft }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(page.id)}
              className="h-6 w-6 rounded text-xs text-gray-600 hover:bg-gray-200"
              aria-label={isExpanded ? "Collapse page" : "Expand page"}
            >
              {isExpanded ? "v" : ">"}
            </button>
          ) : (
            <span className="inline-block h-6 w-6" />
          )}

          <button
            onClick={() => onSelectPage(page)}
            className="min-w-0 flex-1 truncate text-left text-sm font-medium"
            title={page.title}
          >
            {page.title}
          </button>

          {page.is_shared ? (
            <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-indigo-700">
              {page.permission === "edit" ? "shared-edit" : "shared-view"}
            </span>
          ) : null}

          <button
            onClick={() => onCreatePage(page.id)}
            className="h-6 w-6 rounded text-xs text-gray-500 opacity-0 transition hover:bg-gray-200 group-hover:opacity-100"
            aria-label="Create child page"
            title="Create child page"
          >
            +
          </button>

          <button
            onClick={() => onDeletePage(page)}
            className="h-6 w-6 rounded text-xs text-red-500 opacity-0 transition hover:bg-red-50 group-hover:opacity-100"
            aria-label="Delete page"
            title="Delete page"
          >
            x
          </button>
        </div>

        {hasChildren && isExpanded ? (
          <div className="border-l border-gray-200">
            {children.map((child) => renderNode(child, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
          Pages
        </h2>
        <button
          onClick={() => onCreatePage(undefined)}
          className="rounded-md bg-primary-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
        >
          New Page
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-md bg-gray-50 px-3 py-6 text-center text-sm text-gray-500">
          Loading pages...
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!isLoading && !error && !hasPages ? (
        <div className="rounded-md border border-dashed border-gray-300 px-3 py-6 text-center text-sm text-gray-500">
          No pages yet. Create your first page.
        </div>
      ) : null}

      {!isLoading && !error && hasPages ? (
        <div className="space-y-1">{pages.map((page) => renderNode(page, 0))}</div>
      ) : null}

      {!isLoading && !error && hasPages ? (
        <p className="mt-3 text-xs text-gray-400">{pageCount} pages total</p>
      ) : null}
    </section>
  );
}
