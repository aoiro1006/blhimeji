"use client";

import { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import type { IndividualAwardKey, LeagueData, PlayerRoundAwards, Round } from "@/types";
import type { AdminEditorStateCallback } from "@/app/admin/types";
import { useUnsavedChangesGuard } from "@/app/admin/hooks/useUnsavedChangesGuard";
import { getLogicalRoundIds, getLogicalRoundRoot } from "@/lib/logicalRounds";
import { getDefaultAdminRoundId, sortRoundsForAdmin } from "@/lib/rounds";
import { getContrastTextColor } from "@/lib/resultsEditor";
import {
  INDIVIDUAL_AWARD_COLUMNS,
  awardRowKey,
  buildRoundAwardMap,
  buildRoundAwardRows,
  listTeamsWithPlayersForRound,
  mergeRoundAwardsIntoAll,
} from "@/lib/playerAwards";
import { useRegisterAdminEditorState } from "@/app/admin/hooks/useRegisterAdminEditorState";
import AdminEditorStickyHeader from "./AdminEditorStickyHeader";
import PlayerEntrySearch, { buildPlayerSearchCandidates } from "./PlayerEntrySearch";
import EntrySheetExportModal from "./EntrySheetExportModal";

const COUNT_INPUT_CLASS =
  "score-input w-8 shrink-0 text-center py-0.5 px-0 text-sm tabular-nums border-0 bg-white focus:outline-none focus:ring-0 disabled:opacity-60";

const COUNT_STEP_BTN_CLASS =
  "w-7 h-7 shrink-0 flex items-center justify-center text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent";

function roundTabClass(round: Round, selected: boolean): string {
  if (selected) {
    return "bg-primary text-white ring-2 ring-primary/40";
  }
  if (round.held) {
    return "bg-gray-100 text-gray-500 border border-dashed border-gray-300";
  }
  return "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-50";
}

function parseCount(value: string): number {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned === "") return 0;
  return Math.max(0, parseInt(cleaned, 10));
}

export default function PlayerAwardsEditor({
  data,
  onSave,
  saving,
  onEditorStateChange,
}: {
  data: LeagueData;
  onSave: (awards: PlayerRoundAwards[]) => Promise<boolean>;
  saving: boolean;
  onEditorStateChange?: AdminEditorStateCallback;
}) {
  const sortedRounds = useMemo(() => sortRoundsForAdmin(data.rounds), [data.rounds]);

  const [selectedRoundId, setSelectedRoundId] = useState(() =>
    getDefaultAdminRoundId(data.rounds)
  );
  const [edited, setEdited] = useState<PlayerRoundAwards[]>([]);
  const [highlightKey, setHighlightKey] = useState<string | null>(null);
  const [entryExportOpen, setEntryExportOpen] = useState(false);

  const selectedRound = sortedRounds.find((r) => r.id === selectedRoundId);

  const logicalRootId = useMemo(
    () => getLogicalRoundRoot(data, selectedRoundId)?.id ?? selectedRoundId,
    [data, selectedRoundId]
  );

  const logicalRoundIds = useMemo(
    () => getLogicalRoundIds(data, selectedRoundId),
    [data, selectedRoundId]
  );

  const mergedParticipatingTeamIds = useMemo(() => {
    const ids = new Set<string>();
    for (const rid of logicalRoundIds) {
      const round = data.rounds.find((r) => r.id === rid);
      for (const teamId of round?.participatingTeamIds ?? []) {
        ids.add(teamId);
      }
    }
    return [...ids];
  }, [data.rounds, logicalRoundIds]);

  const teamsWithPlayers = useMemo(
    () => listTeamsWithPlayersForRound(data.teams, mergedParticipatingTeamIds),
    [data.teams, mergedParticipatingTeamIds]
  );

  const savedRows = useMemo(() => {
    const map = new Map<string, PlayerRoundAwards>();
    for (const rid of logicalRoundIds) {
      const partial = buildRoundAwardMap(data.playerAwards ?? [], rid);
      for (const [key, row] of partial) {
        if (!map.has(key)) map.set(key, row);
      }
    }
    return buildRoundAwardRows(
      { ...data, rounds: data.rounds.map((r) => (r.id === logicalRootId ? { ...r, participatingTeamIds: mergedParticipatingTeamIds } : r)) },
      logicalRootId,
      map
    );
  }, [data, logicalRoundIds, logicalRootId, mergedParticipatingTeamIds]);

  useEffect(() => {
    if (data.rounds.some((r) => r.id === selectedRoundId)) return;
    setSelectedRoundId(getDefaultAdminRoundId(data.rounds));
  }, [data.rounds, selectedRoundId]);

  useEffect(() => {
    setEdited(savedRows);
  }, [savedRows]);

  const isDirty = useMemo(
    () => JSON.stringify(edited) !== JSON.stringify(savedRows),
    [edited, savedRows]
  );

  const discard = useCallback(() => setEdited(savedRows), [savedRows]);

  const save = useCallback(async () => {
    let merged = data.playerAwards ?? [];
    for (const rid of logicalRoundIds) {
      merged = merged.filter((a) => a.roundId !== rid);
    }
    const rows = edited.map((row) => ({ ...row, roundId: logicalRootId }));
    merged = mergeRoundAwardsIntoAll(merged, logicalRootId, rows);
    return onSave(merged);
  }, [data.playerAwards, logicalRoundIds, logicalRootId, edited, onSave]);

  useRegisterAdminEditorState(onEditorStateChange, isDirty, save, discard);

  const { requestAction, dialog: roundSwitchDialog } = useUnsavedChangesGuard(
    isDirty ? { isDirty, save, discard } : null
  );

  const editedMap = useMemo(() => {
    const map = new Map<string, PlayerRoundAwards>();
    for (const row of edited) {
      map.set(awardRowKey(row.teamId, row.playerId), row);
    }
    return map;
  }, [edited]);

  const entryTeamCount = teamsWithPlayers.filter((t) => t.isEntry).length;

  const searchCandidates = useMemo(
    () => buildPlayerSearchCandidates(teamsWithPlayers),
    [teamsWithPlayers]
  );

  function scrollToPlayer(teamId: string, playerId: string) {
    const key = awardRowKey(teamId, playerId);
    setHighlightKey(key);
    window.setTimeout(() => setHighlightKey(null), 2000);
    requestAnimationFrame(() => {
      document.getElementById(`entry-player-${teamId}-${playerId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }

  function handleRoundSelect(roundId: string) {
    if (roundId === selectedRoundId) return;
    requestAction(() => setSelectedRoundId(roundId));
  }

  function updateCount(teamId: string, playerId: string, key: IndividualAwardKey, value: string) {
    const count = parseCount(value);
    setEdited((prev) =>
      prev.map((row) =>
        row.teamId === teamId && row.playerId === playerId ? { ...row, [key]: count } : row
      )
    );
  }

  function adjustCount(
    teamId: string,
    playerId: string,
    key: IndividualAwardKey,
    delta: number
  ) {
    setEdited((prev) =>
      prev.map((row) => {
        if (row.teamId !== teamId || row.playerId !== playerId) return row;
        return { ...row, [key]: Math.max(0, row[key] + delta) };
      })
    );
  }

  function toggleAbsent(teamId: string, playerId: string, absent: boolean) {
    setEdited((prev) =>
      prev.map((row) =>
        row.teamId === teamId && row.playerId === playerId ? { ...row, absent } : row
      )
    );
  }

  function getRow(teamId: string, playerId: string): PlayerRoundAwards | undefined {
    return editedMap.get(awardRowKey(teamId, playerId));
  }

  return (
    <div className="card">
      {roundSwitchDialog}
      <AdminEditorStickyHeader
        title="個人賞・エントリー"
        description={
          selectedRound
            ? `${selectedRound.name} — エントリー ${entryTeamCount} チーム · 順位には影響しません`
            : undefined
        }
        onSave={save}
        saveLabel="保存"
        saveDisabled={saving || !isDirty || teamsWithPlayers.length === 0}
        saving={saving}
        actions={
          <button
            type="button"
            onClick={() => setEntryExportOpen(true)}
            disabled={data.teams.length === 0}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            エントリー表をダウンロード
          </button>
        }
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {sortedRounds.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => handleRoundSelect(r.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${roundTabClass(
              r,
              selectedRoundId === r.id
            )}`}
          >
            {r.name}
            {r.held && <span className="ml-1 text-[10px] opacity-80">保留</span>}
          </button>
        ))}
      </div>

      {teamsWithPlayers.length === 0 ? (
        <p className="text-gray-500 text-sm">選手が登録されているチームがありません。</p>
      ) : (
        <>
          <PlayerEntrySearch candidates={searchCandidates} onSelect={scrollToPlayer} />
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[36rem]">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                <th className="py-2 pr-3 font-medium w-40">チーム</th>
                <th className="py-2 pr-3 font-medium">選手</th>
                <th className="py-2 px-1 font-medium text-center w-12">欠席</th>
                {INDIVIDUAL_AWARD_COLUMNS.map((col) => (
                  <th key={col.key} className="py-2 px-1 font-medium text-center w-24">
                    <span className="hidden sm:inline">{col.label}</span>
                    <span className="sm:hidden">{col.shortLabel}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teamsWithPlayers.map(({ team, players, isEntry }, teamGroupIndex) => {
                const prevEntry =
                  teamGroupIndex > 0 ? teamsWithPlayers[teamGroupIndex - 1].isEntry : true;
                const showOtherDivider = !isEntry && prevEntry;

                return (
                  <Fragment key={team.id}>
                    {showOtherDivider && (
                      <tr>
                        <td
                          colSpan={3 + INDIVIDUAL_AWARD_COLUMNS.length}
                          className="py-2 px-1 text-xs text-gray-400 bg-gray-50 border-y border-gray-100"
                        >
                          その他のチーム
                        </td>
                      </tr>
                    )}
                    {players.map((player, playerIndex) => {
                      const row = getRow(team.id, player.id);
                      if (!row) return null;
                      const absent = Boolean(row.absent);
                      const rowKey = awardRowKey(team.id, player.id);
                      const highlighted = highlightKey === rowKey;
                      return (
                        <tr
                          id={`entry-player-${team.id}-${player.id}`}
                          key={player.id}
                          className={`border-b border-gray-100 transition-colors duration-300 ${
                            absent
                              ? "bg-gray-100/80 text-gray-500"
                              : highlighted
                                ? "bg-primary-pale/70 ring-2 ring-inset ring-primary/30"
                                : "hover:bg-gray-50/80"
                          }`}
                        >
                          <td className="py-2 pr-3 align-middle">
                            {playerIndex === 0 ? (
                              <span
                                className={`inline-flex items-center justify-center max-w-full h-7 px-2 rounded-md text-xs font-semibold truncate ${
                                  isEntry ? "ring-1 ring-primary/30" : ""
                                }`}
                                style={{
                                  backgroundColor: team.color,
                                  color: getContrastTextColor(team.color),
                                }}
                                title={team.name}
                              >
                                {team.shortName || team.name}
                              </span>
                            ) : null}
                          </td>
                          <td
                            className={`py-2 pr-3 align-middle font-medium ${
                              absent ? "line-through text-gray-400" : "text-gray-800"
                            }`}
                          >
                            {player.name}
                          </td>
                          <td className="py-2 px-1 text-center align-middle">
                            <input
                              type="checkbox"
                              checked={absent}
                              onChange={(e) =>
                                toggleAbsent(team.id, player.id, e.target.checked)
                              }
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                              aria-label={`${player.name} 欠席`}
                            />
                          </td>
                          {INDIVIDUAL_AWARD_COLUMNS.map((col) => (
                            <td key={col.key} className="py-2 px-1 text-center align-middle">
                              <div
                                className={`inline-flex items-center rounded-lg border border-gray-200 overflow-hidden bg-white ${
                                  absent ? "opacity-60" : "focus-within:ring-2 focus-within:ring-primary/30"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    adjustCount(team.id, player.id, col.key, -1)
                                  }
                                  disabled={absent || row[col.key] === 0}
                                  className={`${COUNT_STEP_BTN_CLASS} border-r border-gray-200`}
                                  aria-label={`${player.name} ${col.label} を減らす`}
                                >
                                  −
                                </button>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={row[col.key] === 0 ? "" : row[col.key]}
                                  onChange={(e) =>
                                    updateCount(team.id, player.id, col.key, e.target.value)
                                  }
                                  disabled={absent}
                                  className={COUNT_INPUT_CLASS}
                                  aria-label={`${player.name} ${col.label}`}
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    adjustCount(team.id, player.id, col.key, 1)
                                  }
                                  disabled={absent}
                                  className={`${COUNT_STEP_BTN_CLASS} border-l border-gray-200`}
                                  aria-label={`${player.name} ${col.label} を増やす`}
                                >
                                  +
                                </button>
                              </div>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}

      {entryExportOpen && (
        <EntrySheetExportModal
          data={data}
          roundId={selectedRoundId}
          editedAwards={edited}
          onClose={() => setEntryExportOpen(false)}
        />
      )}
    </div>
  );
}
