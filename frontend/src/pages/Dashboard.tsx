import { AxiosError } from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import CreatePageModal from "../components/CreatePageModal";
import DeletePageModal from "../components/DeletePageModal";
import PageTree from "../components/PageTree/PageTree";
import { IconEdit, IconPanelLeft, IconPlus } from "../components/ui/icons";
import { createPage, deletePage, getPages, updatePage } from "../services/api";
import type { Page } from "../types/page";
import EditorPage from "./EditorPage";

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

function updatePageInTree(nodes: Page[], updated: Page): Page[] {
  return nodes.map((node) => {
    if (node.id === updated.id) {
      return {
        ...node,
        ...updated,
        children: node.children,
      };
    }

    return {
      ...node,
      children: updatePageInTree(node.children ?? [], updated),
    };
  });
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { pageId } = useParams<{ pageId?: string }>();

  const [pages, setPages] = useState<Page[]>([]);
  const [loadingTree, setLoadingTree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [defaultCreateParentId, setDefaultCreateParentId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreatingPage, setIsCreatingPage] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Page | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingPage, setIsDeletingPage] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Page | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);

  const allPages = useMemo(() => flattenPages(pages), [pages]);

  const loadPages = useCallback(async (): Promise<Page[]> => {
    setLoadingTree(true);
    setError(null);
    try {
      const result = await getPages();
      setPages(result);

      const flattened = flattenPages(result);
      if (flattened.length === 0) {
        return [];
      }

      const selectedExists = pageId ? flattened.some((item) => item.id === pageId) : false;
      if (!selectedExists) {
        navigate(`/pages/${flattened[0].id}`, { replace: true });
      }
      return flattened;
    } catch (err) {
      setError(parseApiError(err));
      return [];
    } finally {
      setLoadingTree(false);
    }
  }, [navigate, pageId]);

  useEffect(() => {
    void loadPages();
  }, [loadPages]);

  const openCreateModal = (parentId?: string) => {
    setCreateError(null);
    setDefaultCreateParentId(parentId ?? null);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setDefaultCreateParentId(null);
    setCreateError(null);
  };

  const handleCreatePage = async ({
    title,
    parentId,
  }: {
    title: string;
    parentId: string | null;
  }) => {
    setIsCreatingPage(true);
    setCreateError(null);
    setError(null);
    setSuccessMessage(null);

    try {
      const createdPage = await createPage({ title, parent_id: parentId });
      await loadPages();
      navigate(`/pages/${createdPage.id}`);
      setSuccessMessage(`Created "${createdPage.title}" successfully.`);
      setSidebarOpen(false);
      closeCreateModal();
    } catch (err) {
      setCreateError(parseApiError(err));
    } finally {
      setIsCreatingPage(false);
    }
  };

  const openDeleteModal = (page: Page) => {
    setDeleteTarget(page);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setDeleteError(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeletePage = async () => {
    if (!deleteTarget) {
      return;
    }

    setIsDeletingPage(true);
    setDeleteError(null);
    setError(null);
    setSuccessMessage(null);

    try {
      await deletePage(deleteTarget.id);
      const remaining = await loadPages();
      if (remaining.length > 0) {
        navigate(`/pages/${remaining[0].id}`);
      } else {
        navigate("/pages");
      }

      setSuccessMessage(`Deleted "${deleteTarget.title}" successfully.`);
      closeDeleteModal();
    } catch (err) {
      setDeleteError(parseApiError(err));
    } finally {
      setIsDeletingPage(false);
    }
  };

  const openRenameModal = (page: Page) => {
    setRenameTarget(page);
    setRenameValue(page.title);
    setRenameError(null);
  };

  const closeRenameModal = () => {
    setRenameTarget(null);
    setRenameValue("");
    setRenameError(null);
    setIsRenaming(false);
  };

  const handleRenamePage = async () => {
    if (!renameTarget) {
      return;
    }

    const nextTitle = renameValue.trim();
    if (!nextTitle) {
      setRenameError("Page title cannot be empty.");
      return;
    }

    setIsRenaming(true);
    setRenameError(null);
    setSuccessMessage(null);

    try {
      const updated = await updatePage(renameTarget.id, {
        title: nextTitle,
        content: renameTarget.content ?? "",
      });
      setPages((prev) => updatePageInTree(prev, updated));
      setSuccessMessage(`Renamed page to "${updated.title}".`);
      closeRenameModal();
    } catch (err) {
      setRenameError(parseApiError(err));
      setIsRenaming(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950">
      <div className="mx-auto max-w-[1600px] px-2 sm:px-4">
        <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 md:grid-cols-[320px_1fr]">
          <aside
            className={`border-r border-slate-800 bg-slate-950 md:block ${sidebarOpen ? "block" : "hidden"} h-[calc(100vh-4rem)] overflow-y-auto`}
          >
            <PageTree
              pages={pages}
              selectedPageId={pageId ?? null}
              isLoading={loadingTree}
              error={error}
              onSelectPage={(page) => {
                navigate(`/pages/${page.id}`);
                setSidebarOpen(false);
              }}
              onEditPage={openRenameModal}
              onCreatePage={openCreateModal}
              onDeletePage={openDeleteModal}
            />
          </aside>

          <main className="min-w-0 bg-slate-950 px-3 py-4 sm:px-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h1 className="text-xl font-semibold text-slate-100 sm:text-2xl">Pages</h1>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSidebarOpen((value) => !value)}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-900 md:hidden"
                >
                  <IconPanelLeft className="h-4 w-4" />
                  {sidebarOpen ? "Hide" : "Show"} Tree
                </button>

                <button
                  onClick={() => openCreateModal(undefined)}
                  className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-white"
                >
                  <IconPlus className="h-4 w-4" />
                  New Root Page
                </button>
              </div>
            </div>

            {error ? (
              <div className="mb-4 rounded-md border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            {successMessage ? (
              <div className="mb-4 rounded-md border border-emerald-900/60 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-300">
                {successMessage}
              </div>
            ) : null}

            {allPages.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-700 bg-slate-900 px-4 py-8 text-center text-sm text-slate-400">
                No pages created yet. Click "New Root Page" to start.
              </div>
            ) : (
              <EditorPage
                pages={pages}
                onPageUpdated={(updated) => {
                  setPages((prev) => updatePageInTree(prev, updated));
                }}
              />
            )}
          </main>
        </div>
      </div>

      <CreatePageModal
        key={`create-${isCreateModalOpen ? "open" : "closed"}-${defaultCreateParentId ?? "root"}`}
        isOpen={isCreateModalOpen}
        pages={pages}
        defaultParentId={defaultCreateParentId}
        isSubmitting={isCreatingPage}
        error={createError}
        onClose={closeCreateModal}
        onSubmit={handleCreatePage}
      />

      <DeletePageModal
        isOpen={isDeleteModalOpen}
        page={deleteTarget}
        isDeleting={isDeletingPage}
        error={deleteError}
        onClose={closeDeleteModal}
        onConfirm={handleDeletePage}
      />

      {renameTarget ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-100">Rename page</h3>
            <label className="mt-4 block text-sm font-medium text-slate-300">
              Page title
              <input
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-0 focus:border-slate-500"
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
                onClick={() => void handleRenamePage()}
                className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isRenaming}
              >
                <IconEdit className="h-4 w-4" />
                {isRenaming ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
