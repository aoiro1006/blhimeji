"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { LeagueData, Match, Round, Team } from "@/types";
import type { AdminEditorStateCallback } from "@/app/admin/types";
import { useUnsavedChangesGuard } from "@/app/admin/hooks/useUnsavedChangesGuard";
import { useRegisterAdminEditorState } from "@/app/admin/hooks/useRegisterAdminEditorState";
import { sortRoundsForAdmin } from "@/lib/rounds";
import { ADDITIONAL_MATCH_GROUPS, PRIMARY_MATCH_GROUPS } from "@/lib/matchGroups";
import { getLogicalRoundIds, getLogicalRoundMatches } from "@/lib/logicalRounds";
import {
  buildTeamCompletedCountMap,
  buildInProgressTeamIdSet,
  formatCompletedCountSuffix,
  formatMatchScoreDisplay,
  getContrastTextColor,
  getDefaultResultsRoundId,
  getInProgressMatches,
  getMatchGroupBadgeClass,
  getMatchResultRowClass,
  getMatchStatusSelectColorClass,
  getTeamById,
} from "@/lib/resultsEditor";
import AdminEditorStickyHeader from "./AdminEditorStickyHeader";
import StandingsExportModal from "./StandingsExportModal";
import ResultsStandingsModal from "./ResultsStandingsModal";

const SCORE_INPUT_CLASS =
  "score-input w-7 h-7 sm:w-9 sm:h-auto shrink-0 text-center p-0 sm:py-0.5 sm:px-0.5 text-sm tabular-nums border border-gray-200 rounded-md sm:rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60";

const STATUS_SELECT_CLASS_MOBILE =
  "shrink-0 w-[4rem] max-w-[4rem] py-0.5 px-0.5 text-[10px] rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60 font-medium";

function getLogicalMatches(data: LeagueData, roundId: string): Match[] {
  return getLogicalRoundMatches(data, roundId);
}

function TeamResultLabel({
  team,
  completedCount,
  inProgress = false,
}: {
  team: Team;
  completedCount: number;
  inProgress?: boolean;
}) {
  const suffix = formatCompletedCountSuffix(completedCount);
  const displayName = team.shortName || team.name;
  return (
    <span
      className="inline-flex items-center justify-center gap-0.5 min-w-0 w-full h-7 px-1 rounded-md text-[10px] font-semibold overflow-hidden sm:gap-1 sm:w-40 sm:h-8 sm:shrink-0 sm:flex-none sm:px-2 sm:rounded-md sm:text-xs"
      style={{
        backgroundColor: team.color,
        color: getContrastTextColor(team.color),
      }}
      title={inProgress ? `${displayName}（試合中）` : displayName}
    >
      <span className="min-w-0 flex-1 text-center leading-[1.15] line-clamp-2 sm:leading-normal sm:truncate sm:line-clamp-none">
        {displayName}
      </span>
      {suffix && <span className="shrink-0 text-[9px] sm:text-[10px] opacity-90">{suffix}</span>}
      {inProgress && (
        <span className="relative shrink-0 flex h-2 w-2" aria-hidden>
          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-amber-300 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
        </span>
      )}
    </span>
  );
}

function roundTabClass(round: Round, selected: boolean): string {
  if (selected) {
    return round.resultsFinished
      ? "bg-gray-600 text-white ring-2 ring-gray-400"
      : "bg-primary text-white ring-2 ring-primary/40";
  }
  if (round.resultsFinished) {
    return "bg-gray-200 text-gray-500 border border-gray-300";
  }
  return "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-50";
}

function inferStatusFromScores(match: Match): Match["status"] {
  if (match.status === "cancelled") return "cancelled";
  if (match.homeScore !== null && match.awayScore !== null) return "completed";
  if (match.homeScore !== null || match.awayScore !== null) return "in_progress";
  return "scheduled";
}

function splitPrimaryAndAdditionalMatches(matches: Match[]): {
  primary: Match[];
  additional: Match[];
} {
  const primary = matches.filter((m) => PRIMARY_MATCH_GROUPS.includes(m.group));
  const additional = matches.filter((m) => ADDITIONAL_MATCH_GROUPS.includes(m.group));
  return { primary, additional };
}

function MatchResultsList({
  matches,
  teams,
  teamCompletedCounts,
  inProgressTeamIds,
  onScoreChange,
  onStatusChange,
}: {
  matches: Match[];
  teams: Team[];
  teamCompletedCounts: Map<string, number>;
  inProgressTeamIds: Set<string>;
  onScoreChange: (id: string, side: "home" | "away", value: string) => void;
  onStatusChange: (id: string, status: Match["status"]) => void;
}) {
  return (
    <div className="space-y-1 sm:space-y-2">
      {matches.map((match, index) => {
        const homeTeam = getTeamById(teams, match.homeTeamId);
        const awayTeam = getTeamById(teams, match.awayTeamId);
        const homeCompleted = teamCompletedCounts.get(match.homeTeamId) ?? 0;
        const awayCompleted = teamCompletedCounts.get(match.awayTeamId) ?? 0;

        return (
          <div
            key={match.id}
            id={`results-match-${match.id}`}
            className={`grid grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto] sm:flex sm:flex-nowrap sm:items-center items-center gap-x-1 sm:gap-2 px-1.5 py-1.5 sm:px-3 sm:py-2 rounded-lg border ${getMatchResultRowClass(match.status)}`}
          >
            <span
              className="shrink-0 w-4 sm:w-5 text-[10px] sm:text-xs text-gray-400 text-center tabular-nums leading-none self-center"
              aria-hidden
            >
              {index + 1}
            </span>
            {homeTeam ? (
              <TeamResultLabel
                team={homeTeam}
                completedCount={homeCompleted}
                inProgress={inProgressTeamIds.has(match.homeTeamId)}
              />
            ) : (
              <span className="min-w-0 h-7 sm:h-8 sm:w-40 sm:shrink-0 text-center text-[10px] sm:text-xs text-gray-400">
                —
              </span>
            )}

            <div className="flex items-center gap-0 sm:gap-1 shrink-0 px-0.5">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                value={match.homeScore ?? ""}
                onChange={(e) => onScoreChange(match.id, "home", e.target.value)}
                className={SCORE_INPUT_CLASS}
                aria-label={`${homeTeam?.shortName || homeTeam?.name || "ホーム"}の得点`}
              />
              <span className="shrink-0 text-gray-400 text-xs sm:text-sm px-0.5">-</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                value={match.awayScore ?? ""}
                onChange={(e) => onScoreChange(match.id, "away", e.target.value)}
                className={SCORE_INPUT_CLASS}
                aria-label={`${awayTeam?.shortName || awayTeam?.name || "アウェイ"}の得点`}
              />
            </div>

            {awayTeam ? (
              <TeamResultLabel
                team={awayTeam}
                completedCount={awayCompleted}
                inProgress={inProgressTeamIds.has(match.awayTeamId)}
              />
            ) : (
              <span className="min-w-0 h-7 sm:h-8 sm:w-40 sm:shrink-0 text-center text-[10px] sm:text-xs text-gray-400">
                —
              </span>
            )}

            <select
              value={match.status}
              onChange={(e) => onStatusChange(match.id, e.target.value as Match["status"])}
              className={`${STATUS_SELECT_CLASS_MOBILE} sm:w-[5.5rem] sm:max-w-[5.5rem] sm:py-1 sm:px-2 sm:text-sm sm:rounded-xl sm:block ${getMatchStatusSelectColorClass(match.status)}`}
            >
              <option value="scheduled">未実施</option>
              <option value="in_progress">試合中</option>
              <option value="completed">完了</option>
              <option value="cancelled">中止</option>
            </select>
          </div>
        );
      })}
    </div>
  );
}

function scrollToMatchRow(matchId: string) {
  document.getElementById(`results-match-${matchId}`)?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}

function InProgressMatchesBar({
  matches,
  teams,
}: {
  matches: Match[];
  teams: Team[];
}) {
  if (matches.length === 0) return null;

  return (
    <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 overflow-x-auto flex-nowrap text-xs">
      <span className="shrink-0 font-semibold text-amber-800">試合中</span>
      <span className="shrink-0 text-amber-300">|</span>
      {matches.map((match, index) => {
        const homeTeam = getTeamById(teams, match.homeTeamId);
        const awayTeam = getTeamById(teams, match.awayTeamId);
        const homeName = homeTeam?.shortName || homeTeam?.name || "—";
        const awayName = awayTeam?.shortName || awayTeam?.name || "—";

        return (
          <span key={match.id} className="inline-flex items-center gap-2 shrink-0">
            {index > 0 && <span className="text-amber-300">·</span>}
            <button
              type="button"
              onClick={() => scrollToMatchRow(match.id)}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/80 border border-amber-200 text-amber-950 hover:bg-white transition-colors whitespace-nowrap"
            >
              <span className="text-amber-700 font-medium">{match.group}</span>
              <span className="text-gray-400 tabular-nums">{match.slotOrder + 1}</span>
              <span className="font-semibold">{homeName}</span>
              <span className="tabular-nums font-bold">{formatMatchScoreDisplay(match)}</span>
              <span className="font-semibold">{awayName}</span>
            </button>
          </span>
        );
      })}
    </div>
  );
}

export default function ResultsEditor({
  data,
  onSave,
  onSaveRounds,
  onFinishRound,
  saving,
  onEditorStateChange,
}: {
  data: LeagueData;
  onSave: (matches: Match[]) => Promise<boolean>;
  onSaveRounds: (rounds: Round[]) => Promise<boolean>;
  onFinishRound: (roundId: string) => Promise<boolean>;
  saving: boolean;
  onEditorStateChange?: AdminEditorStateCallback;
}) {
  const sortedRounds = useMemo(() => sortRoundsForAdmin(data.rounds), [data.rounds]);

  const [selectedRoundId, setSelectedRoundId] = useState(() =>
    getDefaultResultsRoundId(data.rounds)
  );
  const [edited, setEdited] = useState<Match[]>([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [standingsOpen, setStandingsOpen] = useState(false);

  const selectedRound = sortedRounds.find((r) => r.id === selectedRoundId);

  const savedMatches = useMemo(
    () => getLogicalMatches(data, selectedRoundId),
    [data, selectedRoundId]
  );

  useEffect(() => {
    setSelectedRoundId(getDefaultResultsRoundId(data.rounds));
  }, []);

  useEffect(() => {
    if (data.rounds.some((r) => r.id === selectedRoundId)) return;
    setSelectedRoundId(getDefaultResultsRoundId(data.rounds));
  }, [data.rounds, selectedRoundId]);

  useEffect(() => {
    setEdited(savedMatches);
  }, [savedMatches]);

  const isDirty = useMemo(
    () => JSON.stringify(edited) !== JSON.stringify(savedMatches),
    [edited, savedMatches]
  );

  const teamCompletedCounts = useMemo(
    () => buildTeamCompletedCountMap(edited),
    [edited]
  );

  const inProgressMatches = useMemo(
    () => getInProgressMatches(edited),
    [edited]
  );

  const inProgressTeamIds = useMemo(
    () => buildInProgressTeamIdSet(edited),
    [edited]
  );

  const { primary: primaryEdited, additional: additionalEdited } = useMemo(
    () => splitPrimaryAndAdditionalMatches(edited),
    [edited]
  );

  const hasAdditionalSection = additionalEdited.length > 0;

  const discard = useCallback(() => setEdited(savedMatches), [savedMatches]);

  const save = useCallback(async () => {
    const logicalIds = new Set(getLogicalRoundIds(data, selectedRoundId));
    const otherMatches = data.matches.filter((m) => !logicalIds.has(m.roundId));
    return onSave([...otherMatches, ...edited]);
  }, [data.matches, selectedRoundId, edited, onSave]);

  useRegisterAdminEditorState(onEditorStateChange, isDirty, save, discard);

  const { requestAction, dialog: roundSwitchDialog } = useUnsavedChangesGuard(
    isDirty ? { isDirty, save, discard } : null
  );

  function handleScoreChange(id: string, side: "home" | "away", value: string) {
    const cleaned = value.replace(/\D/g, "");
    const num = cleaned === "" ? null : parseInt(cleaned, 10);
    setEdited((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m, [side === "home" ? "homeScore" : "awayScore"]: num };
        updated.status = inferStatusFromScores(updated);
        return updated;
      })
    );
  }

  function handleStatusChange(id: string, status: Match["status"]) {
    setEdited((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
  }

  function handleRoundSelect(roundId: string) {
    if (roundId === selectedRoundId) return;
    requestAction(() => setSelectedRoundId(roundId));
  }

  async function handleFinishRound() {
    if (!selectedRoundId || selectedRound?.resultsFinished) return;
    if (!confirm(`${selectedRound?.name ?? "この節"}の結果入力を終了しますか？\nお知らせに「${selectedRound?.name ?? "この節"} 試合結果を更新しました」が追加されます。`)) return;
    await onFinishRound(selectedRoundId);
  }

  async function handleReopenRound() {
    if (!selectedRoundId || !selectedRound?.resultsFinished) return;
    if (!confirm(`${selectedRound?.name ?? "この節"}の終了を解除して再び編集しますか？`)) return;
    const updated = data.rounds.map((r) =>
      r.id === selectedRoundId ? { ...r, resultsFinished: false } : r
    );
    await onSaveRounds(updated);
  }

  return (
    <div className="card min-w-0 overflow-hidden">
      {roundSwitchDialog}
      <AdminEditorStickyHeader
        title="試合結果入力"
        description={
          selectedRound
            ? `${selectedRound.name}${selectedRound.resultsFinished ? "（終了）" : ""}`
            : undefined
        }
        onSave={save}
        saveLabel="試合結果を保存"
        saveDisabled={saving || edited.length === 0 || !isDirty}
        saving={saving}
        actions={
          <>
            {selectedRound?.resultsFinished ? (
              <button
                type="button"
                onClick={() => void handleReopenRound()}
                disabled={saving}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                終了を解除
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleFinishRound()}
                disabled={saving || !selectedRoundId}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                節終了
              </button>
            )}
            <button
              type="button"
              onClick={() => setStandingsOpen(true)}
              disabled={!selectedRoundId || edited.length === 0}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              現在の成績
            </button>
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              className="btn-secondary text-sm"
            >
              結果をダウンロード
            </button>
          </>
        }
        below={<InProgressMatchesBar matches={inProgressMatches} teams={data.teams} />}
      />

      <div className="flex flex-wrap gap-2 mb-6">
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
            {r.resultsFinished && (
              <span className="ml-1 text-[10px] opacity-80">終了</span>
            )}
          </button>
        ))}
      </div>

      {selectedRound?.resultsFinished && (
        <div className="mb-4 p-3 rounded-lg text-sm bg-gray-100 text-gray-600 border border-gray-200">
          この節は「終了」ラベルが付いています。試合結果の入力・編集は引き続き可能です。
        </div>
      )}

      {edited.length === 0 ? (
        <p className="text-gray-500 text-sm">
          この節の試合がありません。組み合わせ画面で生成してください。
        </p>
      ) : (
        <div className="space-y-6 min-w-0">
          {primaryEdited.length > 0 && (
            <section>
              {hasAdditionalSection && (
                <h3 className="font-bold text-base mb-3 text-gray-800">A / B / C</h3>
              )}
              <MatchResultsList
                matches={primaryEdited}
                teams={data.teams}
                teamCompletedCounts={teamCompletedCounts}
                inProgressTeamIds={inProgressTeamIds}
                onScoreChange={handleScoreChange}
                onStatusChange={handleStatusChange}
              />
            </section>
          )}

          {hasAdditionalSection && (
            <section>
              <h3 className="font-bold text-base mb-3 text-gray-800">追加試合（D / E / F）</h3>
              <MatchResultsList
                matches={additionalEdited}
                teams={data.teams}
                teamCompletedCounts={teamCompletedCounts}
                inProgressTeamIds={inProgressTeamIds}
                onScoreChange={handleScoreChange}
                onStatusChange={handleStatusChange}
              />
            </section>
          )}
        </div>
      )}

      {standingsOpen && (
        <ResultsStandingsModal
          data={data}
          roundId={selectedRoundId}
          editedMatches={edited}
          includesUnsaved={isDirty}
          onClose={() => setStandingsOpen(false)}
        />
      )}

      {exportOpen && (
        <StandingsExportModal
          data={data}
          roundId={selectedRoundId}
          editedMatches={edited}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  );
}
