"use client";

import { useEffect } from "react";

export default function AdminToast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  const isError =
    message.includes("失敗") || message.includes("他のユーザーが更新しました");

  useEffect(() => {
    if (isError) return;
    const timer = window.setTimeout(onDismiss, 3000);
    return () => window.clearTimeout(timer);
  }, [message, isError, onDismiss]);

  return (
    <div
      role="status"
      className={`fixed bottom-4 right-4 z-50 flex items-start gap-2 max-w-sm px-4 py-3 rounded-xl shadow-lg border text-sm ${
        isError
          ? "bg-red-50 text-red-800 border-red-200"
          : "bg-green-50 text-green-800 border-green-200"
      }`}
    >
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 text-current opacity-60 hover:opacity-100 leading-none"
        aria-label="閉じる"
      >
        ×
      </button>
    </div>
  );
}
