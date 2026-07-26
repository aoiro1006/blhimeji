"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { NewsItem } from "@/types";
import type { AdminEditorStateCallback } from "@/app/admin/types";
import { useRegisterAdminEditorState } from "@/app/admin/hooks/useRegisterAdminEditorState";
import AdminEditorStickyHeader from "./AdminEditorStickyHeader";

function formatListDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(date.getTime())) return dateStr;
  return date
    .toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" })
    .replace(/\//g, ".");
}

export default function NewsEditor({
  news,
  onSave,
  saving,
  onEditorStateChange,
}: {
  news: NewsItem[];
  onSave: (news: NewsItem[]) => Promise<boolean>;
  saving: boolean;
  onEditorStateChange?: AdminEditorStateCallback;
}) {
  const [edited, setEdited] = useState(news);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => setEdited(news), [news]);

  const isDirty = useMemo(
    () => JSON.stringify(edited) !== JSON.stringify(news),
    [edited, news]
  );

  const discard = useCallback(() => setEdited(news), [news]);

  const save = useCallback(async () => onSave(edited), [edited, onSave]);

  useRegisterAdminEditorState(onEditorStateChange, isDirty, save, discard);

  const sorted = useMemo(
    () =>
      [...edited].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [edited]
  );

  function addItem() {
    const newItem: NewsItem = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split("T")[0],
      category: "お知らせ",
      title: "",
      content: "",
    };
    setEdited((prev) => [newItem, ...prev]);
    setExpandedId(newItem.id);
  }

  function updateItem(id: string, field: keyof NewsItem, value: string) {
    setEdited((prev) => prev.map((n) => (n.id === id ? { ...n, [field]: value } : n)));
  }

  function removeItem(id: string) {
    setEdited((prev) => prev.filter((n) => n.id !== id));
    setExpandedId((prev) => (prev === id ? null : prev));
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="card">
      <AdminEditorStickyHeader
        title="ニュース管理"
        description={`${edited.length} 件 — 行をクリックして編集`}
        onSave={save}
        saveLabel="ニュースを保存"
        saveDisabled={saving || !isDirty}
        saving={saving}
        actions={
          <button onClick={addItem} className="btn-secondary text-sm">
            追加
          </button>
        }
      />

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-500 py-6 text-center">ニュースがありません</p>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
          {sorted.map((item) => {
            const isOpen = expandedId === item.id;
            return (
              <div key={item.id} className={isOpen ? "bg-primary-pale/30" : "bg-white"}>
                <button
                  type="button"
                  onClick={() => toggleExpand(item.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <time className="text-xs text-gray-400 shrink-0 w-24 tabular-nums">
                    {formatListDate(item.date)}
                  </time>
                  <span className="text-xs tag-blue shrink-0">{item.category || "—"}</span>
                  <span className="flex-1 text-sm font-medium text-gray-800 truncate min-w-0">
                    {item.title || "（タイトル未入力）"}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gray-100">
                    <div className="flex gap-2 flex-wrap">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">日付</label>
                        <input
                          type="date"
                          value={item.date}
                          onChange={(e) => updateItem(item.id, "date", e.target.value)}
                          className="input-field w-auto"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">カテゴリ</label>
                        <input
                          type="text"
                          value={item.category}
                          onChange={(e) => updateItem(item.id, "category", e.target.value)}
                          className="input-field w-32"
                          placeholder="カテゴリ"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">タイトル</label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateItem(item.id, "title", e.target.value)}
                        className="input-field"
                        placeholder="タイトル"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">内容</label>
                      <textarea
                        value={item.content}
                        onChange={(e) => updateItem(item.id, "content", e.target.value)}
                        className="input-field min-h-[120px]"
                        placeholder="内容（詳細ページに表示）"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("このニュースを削除しますか？")) removeItem(item.id);
                      }}
                      className="text-red-500 text-sm hover:underline"
                    >
                      削除
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
