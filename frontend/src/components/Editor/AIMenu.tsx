import { AIRateLimitError } from "../../services/api";

export type AIAction =
  | "rephrase"
  | "enhance"
  | "simplify"
  | "questions"
  | "flashcards";

export type AIMenuPosition = {
  top: number;
  left: number;
};

type AIMenuProps = {
  isOpen: boolean;
  position: AIMenuPosition;
  loadingAction: AIAction | null;
  error: string | null;
  canRetry: boolean;
  onRetry: () => void;
  onAction: (action: AIAction) => void;
};

const ACTION_LABELS: Record<AIAction, string> = {
  rephrase: "Rephrase",
  enhance: "Enhance",
  simplify: "Simplify",
  questions: "Generate Questions",
  flashcards: "Generate Flashcards",
};

export function parseAiError(error: unknown): string {
  if (error instanceof AIRateLimitError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "AI request failed.";
}

export default function AIMenu({
  isOpen,
  position,
  loadingAction,
  error,
  canRetry,
  onRetry,
  onAction,
}: AIMenuProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="absolute z-20 w-64 rounded-lg border border-slate-700 bg-slate-900/95 p-2 shadow-xl backdrop-blur"
      style={{ top: position.top, left: position.left }}
    >
      <p className="px-1 pb-2 text-xs text-slate-400">AI actions for selected text</p>
      <div className="grid grid-cols-1 gap-1">
        {(Object.keys(ACTION_LABELS) as AIAction[]).map((action) => {
          const isLoading = loadingAction === action;
          return (
            <button
              key={action}
              type="button"
              onClick={() => onAction(action)}
              disabled={Boolean(loadingAction)}
              className="rounded-md border border-slate-700 px-2.5 py-1.5 text-left text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Running..." : ACTION_LABELS[action]}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="mt-2 rounded-md border border-red-900/60 bg-red-950/40 px-2 py-1.5 text-xs text-red-200">
          <p>{error}</p>
          {canRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 rounded border border-red-700 px-2 py-0.5 font-medium text-red-100 hover:bg-red-900/50"
            >
              Retry
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
