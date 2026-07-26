import type { ReactNode } from "react";

interface AdminEditorStickyHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  below?: ReactNode;
  saveLabel?: string;
  onSave?: () => void;
  saveDisabled?: boolean;
  saving?: boolean;
}

export default function AdminEditorStickyHeader({
  title,
  description,
  actions,
  below,
  saveLabel = "保存",
  onSave,
  saveDisabled,
  saving,
}: AdminEditorStickyHeaderProps) {
  return (
    <div className="sticky top-0 z-10 -mx-4 -mt-6 px-4 pt-6 pb-4 mb-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm sm:-mx-6 sm:px-6 min-w-0 overflow-x-clip">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between min-w-0">
        <div className="min-w-0">
          <h2 className="font-bold text-lg text-primary-dark">{title}</h2>
          {description && <div className="text-sm text-gray-500 mt-0.5">{description}</div>}
        </div>
        <div className="admin-editor-actions flex flex-wrap items-center gap-2 w-full min-w-0 sm:w-auto sm:shrink-0 sm:justify-end">
          {actions}
          {onSave && (
            <button
              type="button"
              onClick={() => void onSave()}
              disabled={saveDisabled ?? saving}
              className="btn-primary text-sm disabled:opacity-50 max-sm:flex-1 max-sm:min-w-[calc(50%-0.25rem)]"
            >
              {saving ? "保存中..." : saveLabel}
            </button>
          )}
        </div>
      </div>
      {below}
    </div>
  );
}
