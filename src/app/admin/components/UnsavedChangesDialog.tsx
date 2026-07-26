"use client";

interface UnsavedChangesDialogProps {
  saving?: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export default function UnsavedChangesDialog({
  saving = false,
  onSave,
  onDiscard,
  onCancel,
}: UnsavedChangesDialogProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="閉じる"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="unsaved-dialog-title"
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="h-1 bg-stripe" />
        <div className="px-6 py-5">
          <h2 id="unsaved-dialog-title" className="font-bold text-lg text-primary-dark mb-2">
            未保存の変更があります
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            編集内容が保存されていません。このまま移動すると変更が失われます。
          </p>
          <div className="flex flex-col gap-2 mt-6">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="btn-primary w-full disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存して移動"}
            </button>
            <button
              type="button"
              onClick={onDiscard}
              disabled={saving}
              className="btn-secondary w-full text-accent disabled:opacity-50"
            >
              保存せずに破棄
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
