"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { DisplayLeague, Player, Team } from "@/types";
import type { AdminEditorStateCallback } from "@/app/admin/types";
import { useRegisterAdminEditorState } from "@/app/admin/hooks/useRegisterAdminEditorState";
import AdminEditorStickyHeader from "./AdminEditorStickyHeader";

const DISPLAY_LEAGUES: DisplayLeague[] = ["A", "B"];

function TeamEditModal({
  team,
  onSave,
  onClose,
}: {
  team: Team;
  onSave: (team: Team) => void;
  onClose: () => void;
}) {
  const [edited, setEdited] = useState(team);

  useEffect(() => setEdited(team), [team]);

  function updateField(field: keyof Team, value: string) {
    setEdited((prev) => ({ ...prev, [field]: value }));
  }

  function addPlayer() {
    setEdited((prev) => ({
      ...prev,
      players: [...prev.players, { id: crypto.randomUUID(), name: "" }],
    }));
  }

  function updatePlayer(playerId: string, name: string) {
    setEdited((prev) => ({
      ...prev,
      players: prev.players.map((p) => (p.id === playerId ? { ...p, name } : p)),
    }));
  }

  function removePlayer(playerId: string) {
    setEdited((prev) => ({
      ...prev,
      players: prev.players.filter((p) => p.id !== playerId),
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <h3 className="font-bold text-lg text-primary-dark mb-4">
          チーム編集 — ID: {edited.teamNumber}
        </h3>
        <div className="space-y-3">
          <input
            type="text"
            value={edited.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="input-field"
            placeholder="チーム名"
          />
          <input
            type="text"
            value={edited.shortName}
            onChange={(e) => updateField("shortName", e.target.value)}
            className="input-field"
            placeholder="略称"
          />
          <input
            type="text"
            value={edited.imageUrl ?? ""}
            onChange={(e) => updateField("imageUrl", e.target.value)}
            className="input-field"
            placeholder="チーム画像URL"
          />
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-500">チームカラー</label>
            <input
              type="color"
              value={edited.color}
              onChange={(e) => updateField("color", e.target.value)}
              className="w-12 h-10 rounded cursor-pointer"
            />
          </div>
          {edited.imageUrl && (
            <img
              src={edited.imageUrl}
              alt={edited.name}
              className="w-20 h-20 rounded-xl object-cover"
            />
          )}
          <div className="border-t pt-3">
            <p className="text-sm font-medium text-gray-600 mb-2">順位表示リーグ</p>
            <div className="flex gap-4">
              {DISPLAY_LEAGUES.map((league) => (
                <label key={league} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`displayLeague-${edited.id}`}
                    checked={(edited.displayLeague ?? "A") === league}
                    onChange={() => setEdited((prev) => ({ ...prev, displayLeague: league }))}
                  />
                  {league}リーグ
                </label>
              ))}
            </div>
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-gray-600">選手</p>
              <button onClick={addPlayer} className="text-xs text-primary hover:underline">
                + 選手追加
              </button>
            </div>
            {edited.players.map((p) => (
              <div key={p.id} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => updatePlayer(p.id, e.target.value)}
                  className="input-field"
                  placeholder="選手名"
                />
                <button onClick={() => removePlayer(p.id)} className="text-red-400 px-2">×</button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => onSave(edited)} className="btn-primary flex-1">
            保存
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeamsEditor({
  teams,
  onSave,
  saving,
  onEditorStateChange,
}: {
  teams: Team[];
  onSave: (teams: Team[]) => Promise<boolean>;
  saving: boolean;
  onEditorStateChange?: AdminEditorStateCallback;
}) {
  const [edited, setEdited] = useState(teams);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => setEdited(teams), [teams]);

  const isDirty = useMemo(
    () => JSON.stringify(edited) !== JSON.stringify(teams),
    [edited, teams]
  );

  const discard = useCallback(() => {
    setEdited(teams);
    setEditingId(null);
  }, [teams]);

  const save = useCallback(async () => onSave(edited), [edited, onSave]);

  useRegisterAdminEditorState(onEditorStateChange, isDirty, save, discard);

  const editingTeam = edited.find((t) => t.id === editingId);

  function addTeam() {
    const newTeam: Team = {
      id: crypto.randomUUID(),
      teamNumber: edited.length + 1,
      name: "新規チーム",
      shortName: "",
      color: "#1a4d8f",
      imageUrl: "",
      players: [],
      displayLeague: "A",
    };
    setEdited([...edited, newTeam]);
    setEditingId(newTeam.id);
  }

  function saveTeam(team: Team) {
    setEdited((prev) => prev.map((t) => (t.id === team.id ? team : t)));
    setEditingId(null);
  }

  function removeTeam(id: string) {
    if (!confirm("このチームを削除しますか？")) return;
    setEdited((prev) => prev.filter((t) => t.id !== id));
    if (editingId === id) setEditingId(null);
  }

  return (
    <div className="card">
      <AdminEditorStickyHeader
        title="チーム管理"
        description="登録順にIDが自動付与されます。A/Bリーグは順位表示用です。"
        onSave={save}
        saveLabel="一覧を保存"
        saveDisabled={saving || !isDirty}
        saving={saving}
        actions={
          <button onClick={addTeam} className="btn-secondary text-sm">
            チーム追加
          </button>
        }
      />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-primary/20">
              <th className="text-left py-3 px-2 w-12">ID</th>
              <th className="text-left py-3 px-2">チーム名</th>
              <th className="text-left py-3 px-2">略称</th>
              <th className="text-center py-3 px-2">リーグ</th>
              <th className="text-center py-3 px-2">選手数</th>
              <th className="text-right py-3 px-2 w-32"></th>
            </tr>
          </thead>
          <tbody>
            {edited.map((team) => (
              <tr key={team.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-2 text-gray-500 font-medium">{team.teamNumber}</td>
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    {team.imageUrl ? (
                      <img src={team.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: team.color }}
                      >
                        {team.shortName.charAt(0) || "?"}
                      </span>
                    )}
                    <span className="font-medium">{team.name || "（未設定）"}</span>
                  </div>
                </td>
                <td className="py-3 px-2 text-gray-500">{team.shortName}</td>
                <td className="py-3 px-2 text-center">
                  <select
                    value={team.displayLeague ?? "A"}
                    onChange={(e) =>
                      setEdited((prev) =>
                        prev.map((t) =>
                          t.id === team.id
                            ? { ...t, displayLeague: e.target.value as DisplayLeague }
                            : t
                        )
                      )
                    }
                    className="input-field w-auto text-sm py-1"
                  >
                    {DISPLAY_LEAGUES.map((l) => (
                      <option key={l} value={l}>
                        {l}リーグ
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-3 px-2 text-center text-gray-500">{team.players.length}</td>
                <td className="py-3 px-2 text-right">
                  <button
                    onClick={() => setEditingId(team.id)}
                    className="text-primary text-sm font-medium hover:underline mr-3"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => removeTeam(team.id)}
                    className="text-red-500 text-sm hover:underline"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edited.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-8">チームが登録されていません</p>
      )}

      {editingTeam && (
        <TeamEditModal
          team={editingTeam}
          onSave={saveTeam}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}
