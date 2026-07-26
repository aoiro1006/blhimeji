"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { GalleryImage, SeasonArchive } from "@/types";
import type { AdminEditorStateCallback } from "@/app/admin/types";
import { useUnsavedChangesGuard } from "@/app/admin/hooks/useUnsavedChangesGuard";
import { useRegisterAdminEditorState } from "@/app/admin/hooks/useRegisterAdminEditorState";
import AdminEditorStickyHeader from "./AdminEditorStickyHeader";

function cloneArchive(archive: SeasonArchive): SeasonArchive {
  return { ...archive, gallery: [...archive.gallery] };
}

export default function ArchivesEditor({
  archives,
  currentSeason,
  onSave,
  onDelete,
  onSnapshot,
  saving,
  onEditorStateChange,
}: {
  archives: SeasonArchive[];
  currentSeason: string;
  onSave: (archive: SeasonArchive) => Promise<boolean>;
  onDelete: (season: string) => Promise<boolean>;
  onSnapshot: (options: { season: string; title: string; summary?: string }) => Promise<boolean>;
  saving: boolean;
  onEditorStateChange?: AdminEditorStateCallback;
}) {
  const [selectedSeason, setSelectedSeason] = useState<string | null>(archives[0]?.season ?? null);
  const [edited, setEdited] = useState<SeasonArchive | null>(null);
  const [newSeason, setNewSeason] = useState("");
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    const found = archives.find((a) => a.season === selectedSeason);
    setEdited(found ? cloneArchive(found) : null);
  }, [archives, selectedSeason]);

  const savedArchive = useMemo(() => {
    const found = archives.find((a) => a.season === selectedSeason);
    return found ? cloneArchive(found) : null;
  }, [archives, selectedSeason]);

  const isDirty = useMemo(() => {
    if (!edited || !savedArchive) return false;
    return JSON.stringify(edited) !== JSON.stringify(savedArchive);
  }, [edited, savedArchive]);

  const discard = useCallback(() => {
    setEdited(savedArchive ? cloneArchive(savedArchive) : null);
  }, [savedArchive]);

  const save = useCallback(async () => {
    if (!edited) return true;
    return onSave(edited);
  }, [edited, onSave]);

  useRegisterAdminEditorState(onEditorStateChange, isDirty, save, discard);

  const { requestAction, dialog: seasonSwitchDialog } = useUnsavedChangesGuard(
    isDirty ? { isDirty, save, discard } : null
  );

  function handleSeasonSelect(season: string) {
    if (season === selectedSeason) return;
    requestAction(() => setSelectedSeason(season));
  }

  function updateField<K extends keyof SeasonArchive>(key: K, value: SeasonArchive[K]) {
    if (!edited) return;
    setEdited({ ...edited, [key]: value });
  }

  function addGalleryImage() {
    if (!edited) return;
    const next: GalleryImage = {
      id: crypto.randomUUID(),
      url: "",
      caption: "",
      sortOrder: edited.gallery.length,
    };
    setEdited({ ...edited, gallery: [...edited.gallery, next] });
  }

  function updateGalleryImage(id: string, field: keyof GalleryImage, value: string | number) {
    if (!edited) return;
    setEdited({
      ...edited,
      gallery: edited.gallery.map((img) => (img.id === id ? { ...img, [field]: value } : img)),
    });
  }

  function removeGalleryImage(id: string) {
    if (!edited) return;
    setEdited({
      ...edited,
      gallery: edited.gallery
        .filter((img) => img.id !== id)
        .map((img, i) => ({ ...img, sortOrder: i })),
    });
  }

  function moveGalleryImage(index: number, direction: -1 | 1) {
    if (!edited) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= edited.gallery.length) return;
    const gallery = [...edited.gallery];
    [gallery[index], gallery[newIndex]] = [gallery[newIndex], gallery[index]];
    setEdited({
      ...edited,
      gallery: gallery.map((img, i) => ({ ...img, sortOrder: i })),
    });
  }

  async function handleSnapshot() {
    const season = newSeason.trim() || currentSeason;
    const title = newTitle.trim() || `${season}シーズン`;
    await onSnapshot({ season, title });
    setSelectedSeason(season);
    setNewSeason("");
    setNewTitle("");
  }

  return (
    <div className="space-y-6">
      {seasonSwitchDialog}
      <div className="card min-w-0 overflow-hidden">
        <AdminEditorStickyHeader
          title="アーカイブ管理"
          description={edited ? edited.title : "シーズンのアーカイブを作成・編集"}
          onSave={edited ? save : undefined}
          saveLabel="アーカイブを保存"
          saveDisabled={saving || !isDirty}
          saving={saving}
          actions={
            <>
              <button
                onClick={() => void handleSnapshot()}
                disabled={saving}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                スナップショット作成
              </button>
              {edited && (
                <>
                  <button onClick={addGalleryImage} className="btn-secondary text-sm">
                    + 写真を追加
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`「${edited.title}」を削除しますか？`)) {
                        onDelete(edited.season);
                      }
                    }}
                    disabled={saving}
                    className="btn-secondary text-sm text-red-600 disabled:opacity-50"
                  >
                    削除
                  </button>
                  <a
                    href={`/archive/${edited.season}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-sm"
                  >
                    公開ページを確認 →
                  </a>
                </>
              )}
            </>
          }
        />
      </div>

      <div className="card">
        <h3 className="font-bold text-base mb-2">アーカイブを作成</h3>
        <p className="text-sm text-gray-500 mb-4">
          現在のシーズン（{currentSeason}）の最終順位表をスナップショットとして保存します。保存後に写真を追加できます。
        </p>
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <input
            type="text"
            value={newSeason}
            onChange={(e) => setNewSeason(e.target.value)}
            className="input-field"
            placeholder={`シーズンID（例: ${currentSeason}）`}
          />
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="input-field sm:col-span-2"
            placeholder={`タイトル（例: ${currentSeason}シーズン）`}
          />
        </div>
      </div>

      {/* 一覧・編集 */}
      {archives.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-lg mb-4">アーカイブ一覧</h2>

          <div className="flex flex-wrap gap-2 mb-6">
            {archives.map((a) => (
              <button
                key={a.season}
                onClick={() => handleSeasonSelect(a.season)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  selectedSeason === a.season
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {a.title}
              </button>
            ))}
          </div>

          {edited && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">シーズンID（URL用）</label>
                  <input type="text" value={edited.season} readOnly className="input-field bg-gray-50" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">タイトル</label>
                  <input
                    type="text"
                    value={edited.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">概要（一覧ページに表示）</label>
                <textarea
                  value={edited.summary ?? ""}
                  onChange={(e) => updateField("summary", e.target.value)}
                  className="input-field min-h-[72px]"
                  placeholder="大会の概要やハイライト"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">カバー画像URL（任意）</label>
                <input
                  type="text"
                  value={edited.coverImageUrl ?? ""}
                  onChange={(e) => updateField("coverImageUrl", e.target.value)}
                  className="input-field"
                  placeholder="/archives/2025/cover.jpg"
                />
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  順位表: Aリーグ {edited.standings.leagueA.length} チーム / Bリーグ{" "}
                  {edited.standings.leagueB.length} チーム（スナップショット時点で凍結）
                </p>
              </div>

              {/* ギャラリー */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold">大会写真ギャラリー</h3>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  画像は public/archives/ フォルダに配置するか、外部URLを指定してください。
                </p>
                <div className="space-y-3">
                  {edited.gallery.map((img, index) => (
                    <div key={img.id} className="p-4 bg-gray-50 rounded-lg space-y-2">
                      <div className="flex gap-2 flex-wrap items-start">
                        <input
                          type="text"
                          value={img.url}
                          onChange={(e) => updateGalleryImage(img.id, "url", e.target.value)}
                          className="input-field flex-1 min-w-[200px]"
                          placeholder="画像URL（例: /archives/2025/01.jpg）"
                        />
                        <button
                          onClick={() => moveGalleryImage(index, -1)}
                          disabled={index === 0}
                          className="px-2 py-1 text-sm bg-white border rounded disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveGalleryImage(index, 1)}
                          disabled={index === edited.gallery.length - 1}
                          className="px-2 py-1 text-sm bg-white border rounded disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeGalleryImage(img.id)}
                          className="text-red-500 text-sm hover:underline"
                        >
                          削除
                        </button>
                      </div>
                      <input
                        type="text"
                        value={img.caption ?? ""}
                        onChange={(e) => updateGalleryImage(img.id, "caption", e.target.value)}
                        className="input-field"
                        placeholder="キャプション（任意）"
                      />
                      {img.url && (
                        <div className="w-40 aspect-[4/3] rounded-lg overflow-hidden bg-gray-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
