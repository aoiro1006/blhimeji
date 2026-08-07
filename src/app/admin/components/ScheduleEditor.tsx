"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { buildLeagueRoundName, findLeagueNumberConflict, getDefaultAdminRoundId, isHeldRound, isNonLeagueRound, resolveLeagueNumberConflict, sortRoundsForAdmin } from "@/lib/rounds";
import { DEFAULT_ROUND_POINT_SETTINGS, getRoundPointSettings } from "@/lib/pointSettings";
import type { RoundPointSettings, RoundType } from "@/types";
import { sortTeamsByMainRank } from "@/lib/standings";
import type { LeagueData, Match, MatchGroup, Round, RoundTeamAssignment } from "@/types";
import type { AdminEditorStateCallback } from "@/app/admin/types";
import { useUnsavedChangesGuard } from "@/app/admin/hooks/useUnsavedChangesGuard";
import { useRegisterAdminEditorState } from "@/app/admin/hooks/useRegisterAdminEditorState";
import AdminEditorStickyHeader from "./AdminEditorStickyHeader";
import { ADDITIONAL_MATCH_GROUPS, PRIMARY_MATCH_GROUPS } from "@/lib/matchGroups";
import { getMatchGroupBadgeClass } from "@/lib/resultsEditor";
import {
  getAdditionalAssignmentRoundId,
  getLogicalRoundRoot,
  getPrimaryAssignmentRoundId,
  getRoundIdsForDeletion,
  hasAdditionalMatches,
  isLinkedAdditionalRound,
} from "@/lib/logicalRounds";
import { getTeamAssignmentInGroups, setTeamGroupAssignment } from "@/lib/scheduling";
import ScheduleAdditionalPanel from "./ScheduleAdditionalPanel";
import MatchPairingsExportModal from "./MatchPairingsExportModal";
import RoundConflictDialog, { type RoundConflictChoice } from "./RoundConflictDialog";

const MATCH_GROUPS = PRIMARY_MATCH_GROUPS;

function getPrimaryEditorMatches(
  data: LeagueData,
  selectedRoundId: string,
  rounds: Round[]
): Match[] {
  const primaryId = getPrimaryAssignmentRoundId({ rounds }, selectedRoundId);
  return data.matches
    .filter((m) => m.roundId === primaryId && PRIMARY_MATCH_GROUPS.includes(m.group))
    .sort((a, b) => a.slotOrder - b.slotOrder);
}

function getAdditionalEditorMatches(
  data: LeagueData,
  selectedRoundId: string,
  rounds: Round[]
): Match[] {
  const root = getLogicalRoundRoot({ rounds }, selectedRoundId);
  if (!root || !hasAdditionalMatches(root)) return [];
  const additionalId = getAdditionalAssignmentRoundId({ rounds }, root.id);
  return data.matches
    .filter((m) => m.roundId === additionalId && ADDITIONAL_MATCH_GROUPS.includes(m.group))
    .sort((a, b) => a.slotOrder - b.slotOrder);
}

function reindexMatches(matches: Match[]): Match[] {
  return matches.map((m, i) => ({ ...m, slotOrder: i }));
}

function MatchOrderList({
  matches,
  getTeamName,
  onMove,
}: {
  matches: Match[];
  getTeamName: (id: string) => string;
  onMove: (index: number, direction: -1 | 1) => void;
}) {
  if (matches.length === 0) return null;
  return (
    <div className="space-y-2">
      {matches.map((match, index) => (
        <div key={match.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-400 w-8">{index + 1}</span>
          <span className={getMatchGroupBadgeClass(match.status, match.group)}>{match.group}</span>
          <span className="flex-1 text-sm font-medium">
            {getTeamName(match.homeTeamId)} vs {getTeamName(match.awayTeamId)}
          </span>
          <button
            type="button"
            onClick={() => onMove(index, -1)}
            disabled={index === 0}
            className="px-2 py-1 text-sm bg-white border rounded disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(index, 1)}
            disabled={index === matches.length - 1}
            className="px-2 py-1 text-sm bg-white border rounded disabled:opacity-30"
          >
            ↓
          </button>
        </div>
      ))}
    </div>
  );
}

function filterAssignmentsForParticipants(
  assignments: RoundTeamAssignment[],
  rounds: Round[],
  selectedRoundId: string,
  participantDraft: Set<string>
): RoundTeamAssignment[] {
  const primaryId = getPrimaryAssignmentRoundId({ rounds }, selectedRoundId);
  return assignments.filter((a) => {
    if (PRIMARY_MATCH_GROUPS.includes(a.group) && a.roundId === primaryId) {
      return participantDraft.has(a.teamId);
    }
    return true;
  });
}

interface PendingRoundConflict {
  activeId: string;
  activeRound: Round;
  proposedRound: Round;
  existingRound: Round;
}

export default function ScheduleEditor({
  data,
  onSaveRounds,
  onSaveAssignments,
  onGenerate,
  onSaveMatchOrder,
  onDeleteRound,
  onPersistComplete,
  saving,
  onEditorStateChange,
}: {
  data: LeagueData;
  onSaveRounds: (rounds: Round[]) => Promise<boolean>;
  onSaveAssignments: (assignments: RoundTeamAssignment[]) => Promise<boolean>;
  onGenerate: (roundId: string, scope?: "primary" | "additional") => Promise<boolean>;
  onSaveMatchOrder: (payload: {
    primary: Match[];
    additional: Match[];
  }) => Promise<boolean>;
  onDeleteRound: (roundId: string) => Promise<boolean>;
  /** 連続保存の最後に最新データを読み直す */
  onPersistComplete?: () => Promise<void>;
  saving: boolean;
  onEditorStateChange?: AdminEditorStateCallback;
}) {
  const [selectedRoundId, setSelectedRoundId] = useState(() =>
    getDefaultAdminRoundId(data.rounds)
  );
  const [rounds, setRounds] = useState(data.rounds);
  const [assignments, setAssignments] = useState(data.roundAssignments);
  const [primaryMatches, setPrimaryMatches] = useState<Match[]>([]);
  const [additionalMatches, setAdditionalMatches] = useState<Match[]>([]);
  const [participantDraft, setParticipantDraft] = useState<Set<string>>(new Set());
  const [roundNotice, setRoundNotice] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [pendingConflict, setPendingConflict] = useState<PendingRoundConflict | null>(null);

  const sortedRounds = useMemo(() => sortRoundsForAdmin(rounds), [rounds]);

  useEffect(() => setRounds(data.rounds), [data.rounds]);
  useEffect(() => setAssignments(data.roundAssignments), [data.roundAssignments]);

  useEffect(() => {
    if (data.rounds.some((r) => r.id === selectedRoundId)) return;
    setSelectedRoundId(getDefaultAdminRoundId(data.rounds));
  }, [data.rounds, selectedRoundId]);

  useEffect(() => {
    const round = data.rounds.find((r) => r.id === selectedRoundId);
    setParticipantDraft(new Set(round?.participatingTeamIds ?? []));
  }, [selectedRoundId, data.rounds]);

  useEffect(() => {
    setPrimaryMatches(getPrimaryEditorMatches(data, selectedRoundId, data.rounds));
    setAdditionalMatches(getAdditionalEditorMatches(data, selectedRoundId, data.rounds));
  }, [data.matches, data.rounds, selectedRoundId]);

  const savedPrimaryMatches = useMemo(
    () => getPrimaryEditorMatches(data, selectedRoundId, data.rounds),
    [data, selectedRoundId]
  );

  const savedAdditionalMatches = useMemo(
    () => getAdditionalEditorMatches(data, selectedRoundId, data.rounds),
    [data, selectedRoundId]
  );

  const roundsDirty = useMemo(
    () => JSON.stringify(rounds) !== JSON.stringify(data.rounds),
    [rounds, data.rounds]
  );

  const assignmentsDirty = useMemo(
    () => JSON.stringify(assignments) !== JSON.stringify(data.roundAssignments),
    [assignments, data.roundAssignments]
  );

  const matchOrderDirty = useMemo(
    () =>
      JSON.stringify(primaryMatches) !== JSON.stringify(savedPrimaryMatches) ||
      JSON.stringify(additionalMatches) !== JSON.stringify(savedAdditionalMatches),
    [primaryMatches, savedPrimaryMatches, additionalMatches, savedAdditionalMatches]
  );

  const participantDirty = useMemo(() => {
    const savedIds = [
      ...(data.rounds.find((r) => r.id === selectedRoundId)?.participatingTeamIds ?? []),
    ].sort();
    const draftIds = [...participantDraft].sort();
    return JSON.stringify(savedIds) !== JSON.stringify(draftIds);
  }, [data.rounds, selectedRoundId, participantDraft]);

  const isDirty = roundsDirty || assignmentsDirty || matchOrderDirty || participantDirty;

  const discard = useCallback(() => {
    setRounds(data.rounds);
    setAssignments(data.roundAssignments);
    setPrimaryMatches(savedPrimaryMatches);
    setAdditionalMatches(savedAdditionalMatches);
    const round = data.rounds.find((r) => r.id === selectedRoundId);
    setParticipantDraft(new Set(round?.participatingTeamIds ?? []));
    setRoundNotice(null);
  }, [data.rounds, data.roundAssignments, savedPrimaryMatches, savedAdditionalMatches, selectedRoundId]);

  const save = useCallback(async () => {
    let ok = true;
    if (roundsDirty || assignmentsDirty) {
      ok = (await onSaveRounds(rounds)) && ok;
      ok = (await onSaveAssignments(assignments)) && ok;
    }
    if (participantDirty && selectedRoundId) {
      const ids = [...participantDraft];
      const updatedRounds = rounds.map((r) =>
        r.id === selectedRoundId ? { ...r, participatingTeamIds: ids } : r
      );
      const updatedAssignments = filterAssignmentsForParticipants(
        assignments,
        updatedRounds,
        selectedRoundId,
        participantDraft
      );
      setRounds(updatedRounds);
      setAssignments(updatedAssignments);
      ok = (await onSaveRounds(updatedRounds)) && ok;
      ok = (await onSaveAssignments(updatedAssignments)) && ok;
    }
    if (matchOrderDirty) {
      ok =
        (await onSaveMatchOrder({
          primary: primaryMatches,
          additional: additionalMatches,
        })) && ok;
    }
    if (ok) {
      await onPersistComplete?.();
    }
    return ok;
  }, [
    roundsDirty,
    assignmentsDirty,
    participantDirty,
    matchOrderDirty,
    rounds,
    assignments,
    selectedRoundId,
    participantDraft,
    primaryMatches,
    additionalMatches,
    onSaveRounds,
    onSaveAssignments,
    onSaveMatchOrder,
    onPersistComplete,
  ]);

  useRegisterAdminEditorState(onEditorStateChange, isDirty, save, discard);

  const { requestAction, dialog: roundSwitchDialog } = useUnsavedChangesGuard(
    isDirty ? { isDirty, save, discard } : null
  );

  function handleRoundSelect(roundId: string) {
    if (roundId === selectedRoundId) return;
    requestAction(() => setSelectedRoundId(roundId));
  }

  const selectedRound = rounds.find((r) => r.id === selectedRoundId);

  const participatingTeams = useMemo(() => {
    if (!selectedRound) return [];
    return sortTeamsByMainRank(data, selectedRound.participatingTeamIds);
  }, [data, selectedRound]);

  const allTeamsSorted = useMemo(
    () => [...data.teams].sort((a, b) => a.teamNumber - b.teamNumber),
    [data.teams]
  );

  const logicalRoot = useMemo(
    () => getLogicalRoundRoot({ rounds }, selectedRoundId),
    [rounds, selectedRoundId]
  );

  const hasAdditionalAssignments = useMemo(() => {
    if (!logicalRoot || !hasAdditionalMatches(logicalRoot)) return false;
    const additionalId = getAdditionalAssignmentRoundId({ rounds }, logicalRoot.id);
    return assignments.some(
      (a) => a.roundId === additionalId && ADDITIONAL_MATCH_GROUPS.includes(a.group)
    );
  }, [logicalRoot, rounds, assignments]);

  const exportMatches = useMemo(
    () => [...primaryMatches, ...additionalMatches],
    [primaryMatches, additionalMatches]
  );

  const roundDeletionIds = useMemo(() => {
    if (!selectedRoundId) return [];
    return getRoundIdsForDeletion({ rounds }, selectedRoundId);
  }, [rounds, selectedRoundId]);

  const canDeleteSelectedRound = useMemo(
    () => rounds.filter((r) => !roundDeletionIds.includes(r.id)).length > 0,
    [rounds, roundDeletionIds]
  );

  const getTeamName = (id: string) => data.teams.find((t) => t.id === id)?.shortName ?? id;

  function toggleParticipant(teamId: string) {
    setParticipantDraft((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  }

  function selectAllParticipants() {
    setParticipantDraft(new Set(data.teams.map((t) => t.id)));
  }

  function clearAllParticipants() {
    setParticipantDraft(new Set());
  }

  async function handleUpdateParticipants() {
    if (!selectedRoundId) return;
    const ids = [...participantDraft];

    const updatedRounds = rounds.map((r) =>
      r.id === selectedRoundId ? { ...r, participatingTeamIds: ids } : r
    );
    const updatedAssignments = filterAssignmentsForParticipants(
      assignments,
      updatedRounds,
      selectedRoundId,
      participantDraft
    );

    setRounds(updatedRounds);
    setAssignments(updatedAssignments);
    const okRounds = await onSaveRounds(updatedRounds);
    const okAssignments = await onSaveAssignments(updatedAssignments);
    if (okRounds && okAssignments) {
      await onPersistComplete?.();
    }
  }

  function addLeagueRound() {
    const leagueRounds = rounds.filter((r) => r.type === "league");
    const maxNum = Math.max(0, ...leagueRounds.map((r) => r.number));
    const newRound: Round = {
      id: crypto.randomUUID(),
      type: "league",
      number: maxNum + 1,
      subNumber: 1,
      name: buildLeagueRoundName(maxNum + 1, 1),
      date: "",
      venue: "",
      participatingTeamIds: [],
    };
    setRounds([...rounds, newRound]);
    setSelectedRoundId(newRound.id);
  }

  function addNonLeagueRound() {
    const newRound: Round = {
      id: crypto.randomUUID(),
      type: "other",
      number: 0,
      subNumber: 1,
      name: "練習試合",
      date: "",
      venue: "",
      participatingTeamIds: [],
      held: false,
    };
    setRounds([...rounds, newRound]);
    setSelectedRoundId(newRound.id);
  }

  function applyLeagueRoundUpdate(id: string, updated: Round): Round[] {
    return rounds.map((r) => (r.id === id ? updated : r));
  }

  function tryApplyLeagueRound(id: string, updater: (r: Round) => Round) {
    const current = rounds.find((r) => r.id === id);
    if (!current) return;

    const updated = updater(current);
    if (updated.type !== "league" || updated.number <= 0) {
      setRounds((prev) => prev.map((r) => (r.id === id ? updated : r)));
      return;
    }

    const conflict = findLeagueNumberConflict(rounds, id, updated.number, updated.subNumber);
    if (conflict) {
      setPendingConflict({
        activeId: id,
        activeRound: current,
        proposedRound: updated,
        existingRound: conflict,
      });
      return;
    }

    setRounds(applyLeagueRoundUpdate(id, updated));
  }

  function handleConflictChoice(choice: RoundConflictChoice) {
    if (!pendingConflict) return;
    const { activeId, activeRound, proposedRound, existingRound } = pendingConflict;
    const label = buildLeagueRoundName(proposedRound.number, proposedRound.subNumber);

    if (choice === "replace") {
      let next = applyLeagueRoundUpdate(activeId, proposedRound);
      const { rounds: resolved, notice } = resolveLeagueNumberConflict(
        next,
        activeId,
        proposedRound.number,
        proposedRound.subNumber
      );
      setRounds(resolved);
      if (notice) setRoundNotice(notice);
    } else if (choice === "additional") {
      setRounds((prev) => {
        const next = prev.map((r) =>
          r.id === existingRound.id
            ? {
                ...r,
                additionalMatches: {
                  enabled: true,
                  mode: "embedded" as const,
                },
              }
            : r.id === activeId
              ? activeRound
              : r
        );
        return next;
      });
      setSelectedRoundId(existingRound.id);
      setRoundNotice(
        `${label} は追加試合（D/E/F）として「${existingRound.name || buildLeagueRoundName(existingRound.number, existingRound.subNumber)}」に紐づけました。`
      );
    }

    setPendingConflict(null);
  }

  function updateRound(id: string, patch: Partial<Round>) {
    tryApplyLeagueRound(id, (r) => {
      const updated = { ...r, ...patch };
      if (updated.type === "league" && updated.number > 0) {
        updated.name = buildLeagueRoundName(updated.number, updated.subNumber);
      }
      return updated;
    });
  }

  function setRoundType(id: string, type: RoundType) {
    setRoundNotice(null);
    if (type === "other") {
      setRounds((prev) =>
        prev.map((r) => {
          if (r.id !== id || r.type === type) return r;
          return {
            ...r,
            type: "other",
            number: 0,
            subNumber: 1,
            name: r.name || "練習試合",
          };
        })
      );
      return;
    }

    tryApplyLeagueRound(id, (r) => {
      if (r.type === type) return r;
      const leagueRounds = rounds.filter((x) => x.type === "league" && x.id !== id);
      const number =
        r.number > 0 ? r.number : Math.max(0, ...leagueRounds.map((x) => x.number)) + 1;
      const subNumber = r.subNumber > 0 ? r.subNumber : 1;
      return {
        ...r,
        type: "league",
        number,
        subNumber,
        held: false,
        name: buildLeagueRoundName(number, subNumber),
      };
    });
  }

  const primaryAssignmentRoundId = selectedRoundId
    ? getPrimaryAssignmentRoundId({ rounds } as LeagueData, selectedRoundId)
    : selectedRoundId;

  function getAssignment(teamId: string): MatchGroup | "" {
    if (!primaryAssignmentRoundId) return "";
    return getTeamAssignmentInGroups(
      assignments,
      primaryAssignmentRoundId,
      teamId,
      PRIMARY_MATCH_GROUPS
    );
  }

  function setAssignment(teamId: string, group: MatchGroup | "") {
    if (!primaryAssignmentRoundId) return;
    setAssignments((prev) =>
      setTeamGroupAssignment(prev, primaryAssignmentRoundId, teamId, group, PRIMARY_MATCH_GROUPS)
    );
  }

  async function handleDeleteRound() {
    if (!selectedRoundId || !selectedRound || !canDeleteSelectedRound) return;

    const root = getLogicalRoundRoot({ rounds }, selectedRoundId);
    const deleteName = root?.name ?? selectedRound.name;
    const linkedNames = roundDeletionIds
      .map((id) => rounds.find((r) => r.id === id)?.name)
      .filter((name): name is string => Boolean(name));

    let message = `「${deleteName}」を削除しますか？\n\n`;
    message += "以下もすべて削除されます（取り消せません）：\n";
    message += "・組み合わせ・試合結果\n";
    message += "・グループ割り当て\n";
    message += "・エントリー・個人賞（この節分）\n";
    message += "・シーズン累計順位からこの節の成績\n";
    if (roundDeletionIds.length > 1) {
      message += `\n※ 追加試合を含む ${linkedNames.join("、")} もまとめて削除されます。`;
    }
    if (isLinkedAdditionalRound(selectedRound)) {
      message += `\n※ 追加試合のRoundを選択中ですが、親節ごと削除されます。`;
    }

    if (!confirm(message)) return;

    if (isDirty) {
      if (!confirm("未保存の変更があります。削除すると破棄されます。続行しますか？")) return;
    }

    const ok = await onDeleteRound(selectedRoundId);
    if (ok) {
      setRoundNotice(null);
      setPendingConflict(null);
    }
  }

  function movePrimaryMatch(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= primaryMatches.length) return;
    const updated = [...primaryMatches];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setPrimaryMatches(reindexMatches(updated));
  }

  function moveAdditionalMatch(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= additionalMatches.length) return;
    const updated = [...additionalMatches];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setAdditionalMatches(reindexMatches(updated));
  }

  function updatePointSetting(key: keyof RoundPointSettings, value: number) {
    if (!selectedRound) return;
    const current = getRoundPointSettings(selectedRound);
    updateRound(selectedRound.id, {
      pointSettings: { ...current, [key]: value },
    });
  }

  const pointSettings = selectedRound ? getRoundPointSettings(selectedRound) : DEFAULT_ROUND_POINT_SETTINGS;

  const POINT_SETTING_FIELDS: { key: keyof RoundPointSettings; label: string; hint: string }[] = [
    { key: "pointDiffMultiplier", label: "得失P（×）", hint: "max(0, 節内得失点差) × X" },
    { key: "blowoutMultiplier", label: "圧勝P（×）", hint: "圧勝点 × X" },
    { key: "giantKillerMultiplier", label: "ジャイキリP（×）", hint: "前節5位以上上位に勝利1回あたり1点 × X" },
    { key: "fightingSpiritMultiplier", label: "奮闘P（×）", hint: "奮闘点 × X" },
    { key: "matchCountMultiplier", label: "試合回数P（×）", hint: "試合回数 × X" },
  ];

  return (
    <>
      {roundSwitchDialog}
      {pendingConflict && (
        <RoundConflictDialog
          label={buildLeagueRoundName(
            pendingConflict.proposedRound.number,
            pendingConflict.proposedRound.subNumber
          )}
          existingRound={pendingConflict.existingRound}
          onChoose={handleConflictChoice}
          onCancel={() => setPendingConflict(null)}
        />
      )}
      <div className="card mb-6">
        <AdminEditorStickyHeader
          title="組み合わせ管理"
          description={selectedRound?.name}
          onSave={save}
          saveLabel="変更を保存"
          saveDisabled={saving || !isDirty}
          saving={saving}
          actions={
            <>
              <button onClick={addLeagueRound} className="btn-secondary text-sm">
                + リーグ節
              </button>
              <button onClick={addNonLeagueRound} className="btn-secondary text-sm">
                + リーグ外
              </button>
              {selectedRound && participatingTeams.length > 0 && (
                <button
                  type="button"
                  onClick={() => void onGenerate(selectedRoundId, "primary")}
                  disabled={saving}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  組み合わせを自動生成（A/B/C）
                </button>
              )}
              {exportMatches.length > 0 && (
                <button
                  type="button"
                  onClick={() => setExportOpen(true)}
                  className="btn-secondary text-sm"
                >
                  対戦表をダウンロード
                </button>
              )}
            </>
          }
        />
      </div>

      <div className="space-y-6">
      {/* 節の管理 */}
      <div className="card">
        <h3 className="font-bold text-base mb-4">節の設定</h3>

        <div className="flex flex-wrap gap-2 mb-4">
          {sortedRounds.map((r) => (
            <button
              key={r.id}
              onClick={() => handleRoundSelect(r.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                selectedRoundId === r.id
                  ? isHeldRound(r)
                    ? "bg-gray-500 text-white"
                    : r.type === "league"
                      ? "bg-primary text-white"
                      : "bg-accent text-white"
                  : isHeldRound(r)
                    ? "bg-gray-100 text-gray-500 border border-dashed border-gray-300"
                    : "bg-gray-100 text-gray-600"
              }`}
            >
              {r.name}
              {isHeldRound(r) && (
                <span className="ml-1 opacity-70 text-xs">保留</span>
              )}
              {isNonLeagueRound(r) && !isHeldRound(r) && (
                <span className="ml-1 opacity-70 text-xs">リーグ外</span>
              )}
            </button>
          ))}
        </div>

        {roundNotice && (
          <div className="mb-4 p-3 rounded-lg text-sm bg-amber-50 text-amber-900 border border-amber-200">
            {roundNotice}
          </div>
        )}

        {selectedRound && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">節の種類</label>
              <select
                value={selectedRound.type}
                onChange={(e) => setRoundType(selectedRound.id, e.target.value as RoundType)}
                className="input-field max-w-md"
              >
                <option value="league">リーグ節（シーズン累計に反映）</option>
                <option value="other">リーグ外の試合（当日のみ・累計から除外）</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {selectedRound.type === "league"
                  ? "※ 節番号が重複する場合、新規追加か追加試合（D/E/F）かを選べます。"
                  : "※ 練習試合・テストマッチなど。日程に表示され、当日順位のみ反映されます。"}
              </p>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedRound.held ?? false}
                onChange={(e) => updateRound(selectedRound.id, { held: e.target.checked })}
                className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span>
                <span className="block text-sm font-medium text-gray-800">保留にする</span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  非公開（日程・順位表に表示されません）。リーグ節の場合は累計からも除外されます。
                </span>
              </span>
            </label>

            {selectedRound.type === "league" ? (
              <div className="space-y-3">
                <div className="grid sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">節番号</label>
                    <select
                      value={selectedRound.number}
                      onChange={(e) =>
                        updateRound(selectedRound.id, { number: parseInt(e.target.value, 10) })
                      }
                      className="input-field"
                    >
                      {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          第{n}節
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">回数（1-2節など）</label>
                    <select
                      value={selectedRound.subNumber}
                      onChange={(e) =>
                        updateRound(selectedRound.id, { subNumber: parseInt(e.target.value, 10) })
                      }
                      className="input-field"
                    >
                      {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n === 1 ? "1回目" : `${n}回目（${selectedRound.number}-${n}節）`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="date"
                    value={selectedRound.date ?? ""}
                    onChange={(e) => updateRound(selectedRound.id, { date: e.target.value })}
                    className="input-field"
                  />
                  <input
                    type="text"
                    value={selectedRound.venue ?? ""}
                    onChange={(e) => updateRound(selectedRound.id, { venue: e.target.value })}
                    className="input-field"
                    placeholder="会場"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={selectedRound.time ?? ""}
                    onChange={(e) => updateRound(selectedRound.id, { time: e.target.value })}
                    className="input-field"
                    placeholder="時間（例: 10:00〜16:00）"
                  />
                  <input
                    type="text"
                    value={selectedRound.contact ?? ""}
                    onChange={(e) => updateRound(selectedRound.id, { contact: e.target.value })}
                    className="input-field"
                    placeholder="問い合わせ先"
                  />
                </div>
                <textarea
                  value={selectedRound.notes ?? ""}
                  onChange={(e) => updateRound(selectedRound.id, { notes: e.target.value })}
                  className="input-field min-h-[72px]"
                  placeholder="備考・案内（駐車場、持ち物など）"
                />
                <div className="p-4 bg-primary-pale/40 rounded-lg border border-primary/10">
                  <h3 className="text-sm font-bold text-primary-dark mb-1">ポイント倍率（X値）</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    ベース300点・勝率Pは固定。以下の倍率はこの節の試合結果に適用されます。
                  </p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {POINT_SETTING_FIELDS.map(({ key, label, hint }) => (
                      <div key={key}>
                        <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={pointSettings[key]}
                          onChange={(e) =>
                            updatePointSetting(key, parseFloat(e.target.value) || 0)
                          }
                          className="input-field"
                        />
                        <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={selectedRound.name}
                    onChange={(e) => updateRound(selectedRound.id, { name: e.target.value })}
                    className="input-field"
                    placeholder="名称（練習試合、テストマッチ等）"
                  />
                  <input
                    type="date"
                    value={selectedRound.date ?? ""}
                    onChange={(e) => updateRound(selectedRound.id, { date: e.target.value })}
                    className="input-field"
                  />
                  <input
                    type="text"
                    value={selectedRound.venue ?? ""}
                    onChange={(e) => updateRound(selectedRound.id, { venue: e.target.value })}
                    className="input-field"
                    placeholder="会場"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={selectedRound.time ?? ""}
                    onChange={(e) => updateRound(selectedRound.id, { time: e.target.value })}
                    className="input-field"
                    placeholder="時間（例: 10:00〜16:00）"
                  />
                  <input
                    type="text"
                    value={selectedRound.contact ?? ""}
                    onChange={(e) => updateRound(selectedRound.id, { contact: e.target.value })}
                    className="input-field"
                    placeholder="問い合わせ先"
                  />
                </div>
                <textarea
                  value={selectedRound.notes ?? ""}
                  onChange={(e) => updateRound(selectedRound.id, { notes: e.target.value })}
                  className="input-field min-h-[72px]"
                  placeholder="備考・案内"
                />
              </div>
            )}
            <p className="text-xs text-gray-400">
              {selectedRound.held
                ? "※ 保留中：公開サイト・日程・累計順位に表示されません"
                : selectedRound.type === "league"
                  ? "※ リーグ節の結果はシーズン累計の順位に反映されます"
                  : "※ リーグ外の試合はその日の順位のみに反映（累計には含まれません）"}
            </p>

            <div className="pt-4 mt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => void handleDeleteRound()}
                disabled={saving || !canDeleteSelectedRound}
                className="text-sm px-4 py-2 rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                この節を削除
              </button>
              {!canDeleteSelectedRound && (
                <p className="text-xs text-gray-400 mt-2">最後の1節は削除できません。</p>
              )}
              {canDeleteSelectedRound && roundDeletionIds.length > 1 && (
                <p className="text-xs text-gray-400 mt-2">
                  追加試合Roundがリンクされている場合、親節とまとめて削除されます。
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 参加チーム選択 */}
      {selectedRound && (
        <div className="card">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
            <h2 className="font-bold text-lg">参加チーム</h2>
            <span className="text-sm text-gray-500">
              {participantDraft.size} / {data.teams.length} チーム選択中
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            参加するチームにチェックを入れて「更新」を押してください。
          </p>

          <div className="flex gap-2 mb-4">
            <button onClick={selectAllParticipants} className="btn-secondary text-sm">
              全選択
            </button>
            <button onClick={clearAllParticipants} className="btn-secondary text-sm">
              全解除
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto mb-4 p-1">
            {allTeamsSorted.map((team) => (
              <label
                key={team.id}
                className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer border transition-colors ${
                  participantDraft.has(team.id)
                    ? "bg-primary/5 border-primary/30"
                    : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                }`}
              >
                <input
                  type="checkbox"
                  checked={participantDraft.has(team.id)}
                  onChange={() => toggleParticipant(team.id)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-xs text-gray-400 shrink-0">ID:{team.teamNumber}</span>
                <span className="text-sm font-medium truncate">{team.name}</span>
              </label>
            ))}
          </div>

          <button
            onClick={() => void handleUpdateParticipants()}
            disabled={saving || !participantDirty}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            参加チームを更新
          </button>
        </div>
      )}

      {/* グループ割り当て（試合振り分け用） */}
      {selectedRound && participatingTeams.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-lg mb-2">グループ割り当て（A / B / C）</h2>
          <p className="text-sm text-gray-500 mb-4">
            試合の振り分け用グループです。順位表示のA/Bリーグとは別に管理します。
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">順位</th>
                  <th className="text-left py-2 px-2">チーム</th>
                  {MATCH_GROUPS.map((g) => (
                    <th key={g} className="text-center py-2 px-2">
                      {g}グループ
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {participatingTeams.map((team, i) => (
                  <tr key={team.id} className="border-b border-gray-100">
                    <td className="py-2 px-2 text-gray-400">{i + 1}</td>
                    <td className="py-2 px-2 font-medium">{team.name}</td>
                    {MATCH_GROUPS.map((g) => (
                      <td key={g} className="text-center py-2 px-2">
                        <input
                          type="radio"
                          name={`assign-${team.id}-${selectedRoundId}`}
                          checked={getAssignment(team.id) === g}
                          onChange={() => setAssignment(team.id, g)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ScheduleAdditionalPanel
        selectedRoundId={selectedRoundId}
        rounds={rounds}
        assignments={assignments}
        additionalMatches={additionalMatches}
        setRounds={setRounds}
        setAssignments={setAssignments}
        setAdditionalMatches={setAdditionalMatches}
        allTeamsSorted={allTeamsSorted}
        saving={saving}
        hasAdditionalAssignments={hasAdditionalAssignments}
        onGenerateAdditional={() => void onGenerate(selectedRoundId, "additional")}
      />

      {/* 試合順番（A/B/C） */}
      {primaryMatches.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-lg mb-4">試合順番の調整（A / B / C）</h2>
          <MatchOrderList
            matches={primaryMatches}
            getTeamName={getTeamName}
            onMove={movePrimaryMatch}
          />

          {exportOpen && (
            <MatchPairingsExportModal
              data={data}
              roundId={selectedRoundId}
              matches={exportMatches}
              onClose={() => setExportOpen(false)}
            />
          )}
        </div>
      )}

      {/* 試合順番（D/E/F） */}
      {additionalMatches.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-lg mb-4">試合順番の調整（追加試合 D / E / F）</h2>
          <MatchOrderList
            matches={additionalMatches}
            getTeamName={getTeamName}
            onMove={moveAdditionalMatch}
          />
        </div>
      )}
      </div>
    </>
  );
}
