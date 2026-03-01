import { AxiosError } from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import CreatePageModal from "../components/CreatePageModal";
import DeletePageModal from "../components/DeletePageModal";
import PageTree from "../components/PageTree/PageTree";
import { createPage, deletePage, getPages } from "../services/api";
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
  const [defaultCreateParentId, setDefaultCreateParentId] = useState<string | null>(
    null,
  );
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreatingPage, setIsCreatingPage] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Page | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingPage, setIsDeletingPage] = useState(false);

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
        navigate(`/dashboard/${flattened[0].id}`, { replace: true });
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
      navigate(`/dashboard/${createdPage.id}`);
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
        navigate(`/dashboard/${remaining[0].id}`);
      } else {
        navigate("/dashboard");
      }

      setSuccessMessage(`Deleted "${deleteTarget.title}" successfully.`);
      closeDeleteModal();
    } catch (err) {
      setDeleteError(parseApiError(err));
    } finally {
      setIsDeletingPage(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-4 md:grid-cols-[320px_1fr] md:p-6">
        <aside className={`md:block ${sidebarOpen ? "block" : "hidden"}`}>
          <PageTree
            pages={pages}
            selectedPageId={pageId ?? null}
            isLoading={loadingTree}
            error={error}
            onSelectPage={(page) => {
              navigate(`/dashboard/${page.id}`);
              setSidebarOpen(false);
            }}
            onCreatePage={openCreateModal}
            onDeletePage={openDeleteModal}
          />
        </aside>

        <main className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Dashboard</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen((value) => !value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm md:hidden"
              >
                {sidebarOpen ? "Close Tree" : "Open Tree"}
              </button>
              <button
                onClick={() => openCreateModal(undefined)}
                className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
              >
                New Root Page
              </button>
            </div>
          </div>

          {error ? (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {successMessage}
            </div>
          ) : null}

          {allPages.length === 0 ? (
            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
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
    </div>
  );
}
