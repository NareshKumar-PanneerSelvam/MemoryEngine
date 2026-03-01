import type { Page } from "../types/page";

type DeletePageModalProps = {
  isOpen: boolean;
  page: Page | null;
  isDeleting?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export default function DeletePageModal({
  isOpen,
  page,
  isDeleting = false,
  error = null,
  onClose,
  onConfirm,
}: DeletePageModalProps) {
  if (!isOpen || !page) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Delete Page</h2>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
            disabled={isDeleting}
            aria-label="Close delete page modal"
          >
            x
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            You are about to delete <span className="font-semibold">{page.title}</span>.
          </p>
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            This action will also delete all child pages under this page.
          </p>

          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                void onConfirm();
              }}
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
