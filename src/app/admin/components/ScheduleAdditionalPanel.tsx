"use client";

import { useState } from "react";
import { ADDITIONAL_MATCH_GROUPS } from "@/lib/matchGroups";
import {
  createLinkedAdditionalRound,
  getAdditionalAssignmentRoundId,
  getLinkedChildRound,
  getLogicalRoundRoot,
  hasAdditionalMatches,
} from "@/lib/logicalRounds";
import {
  getTeamAssignmentInGroups,
  setTeamGroupAssignment,
} from "@/lib/scheduling";
import type { LeagueData, Match, MatchGroup, Round, RoundTeamAssignment } from "@/types";

interface ScheduleAdditionalPanelProps {
  selectedRoundId: string;
  rounds: Round[];
  assignments: RoundTeamAssignment[];
  additionalMatches: Match[];
  setRounds: React.Dispatch<React.SetStateAction<Round[]>>;
  setAssignments: React.Dispatch<React.SetStateAction<RoundTeamAssignment[]>>;
  setAdditionalMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  allTeamsSorted: LeagueData["teams"];
  saving: boolean;
  hasAdditionalAssignments: boolean;
  onGenerateAdditional: () => void;
}

export default function ScheduleAdditionalPanel({
  selectedRoundId,
  rounds,
  assignments,
  additionalMatches,
  setRounds,
  setAssignments,
  setAdditionalMatches,
  allTeamsSorted,
  saving,
  hasAdditionalAssignments,
  onGenerateAdditional,
}: ScheduleAdditionalPanelProps) {
  const [splitDate, setSplitDate] = useState("");

  const root = getLogicalRoundRoot({ rounds } as LeagueData, selectedRoundId);
  if (!root || root.type !== "league") return null;

  const rootId = root.id;
  const additionalEnabled = hasAdditionalMatches(root);
  const isLinked = root.additionalMatches?.mode === "linked";
  const assignmentRoundId = getAdditionalAssignmentRoundId({ rounds } as LeagueData, rootId);
  const linkedChild = getLinkedChildRound({ rounds } as LeagueData, rootId);

  function toggleAdditional(enabled: boolean) {
    setRounds((prev) =>
      prev.map((r) =>
        r.id === rootId
          ? {
              ...r,
              additionalMatches: enabled
                ? { enabled: true, mode: "embedded" as const }
                : undefined,
            }
          : r
      )
    );
  }

  function setAdditionalGroup(teamId: string, group: MatchGroup | "") {
    setAssignments((prev) =>
      setTeamGroupAssignment(prev, assignmentRoundId, teamId, group, ADDITIONAL_MATCH_GROUPS)
    );
  }

  function splitToLinkedRound() {
    if (!splitDate.trim()) {
      alert("追加試合の日付を入力してください。");
      return;
    }
    const childId = crypto.randomUUID();
    const child = createLinkedAdditionalRound(root!, splitDate, childId);

    const defAssignments = assignments.filter(
      (a) =>
        a.roundId === rootId &&
        ADDITIONAL_MATCH_GROUPS.includes(a.group as MatchGroup)
    );
    const defMatches = additionalMatches.filter((m) =>
      ADDITIONAL_MATCH_GROUPS.includes(m.group)
    );

    const movedAssignments = defAssignments.map((a) => ({ ...a, roundId: childId }));
    const movedMatches = defMatches.map((m) => ({ ...m, roundId: childId }));

    const childTeamIds = [...new Set(movedAssignments.map((a) => a.teamId))];
    child.participatingTeamIds = childTeamIds;

    setRounds((prev) => [
      ...prev.map((r) =>
        r.id === rootId
          ? {
              ...r,
              additionalMatches: {
                enabled: true,
                mode: "linked" as const,
                linkedRoundId: childId,
              },
            }
          : r
      ),
      child,
    ]);

    setAssignments((prev) => [
      ...prev.filter(
        (a) =>
          !(
            a.roundId === rootId &&
            ADDITIONAL_MATCH_GROUPS.includes(a.group as MatchGroup)
          )
      ),
      ...movedAssignments,
    ]);

    setAdditionalMatches(movedMatches);
  }

  return (
    <div className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-lg">追加試合（D / E / F）</h2>
          <p className="text-sm text-gray-500 mt-1">
            通常の A/B/C とは別枠。同チームの再エントリー可（同グループ内の二重登録は不可）。
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={additionalEnabled}
            onChange={(e) => toggleAdditional(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          追加試合を有効化
        </label>
      </div>

      {additionalEnabled && (
        <>
          {isLinked && linkedChild ? (
            <p className="text-sm text-primary bg-primary-pale/50 border border-primary/10 rounded-lg px-3 py-2">
              別日・別Roundで分割済み：{linkedChild.date || "日付未設定"} — 日程一覧に追加表示されます。
            </p>
          ) : (
            <div className="flex flex-wrap items-end gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div>
                <label className="block text-xs text-gray-500 mb-1">別日に分割する場合の日付</label>
                <input
                  type="date"
                  value={splitDate}
                  onChange={(e) => setSplitDate(e.target.value)}
                  className="input-field text-sm"
                />
              </div>
              <button type="button" onClick={splitToLinkedRound} className="btn-secondary text-sm">
                日付変更＋Round分割
              </button>
              <p className="text-xs text-gray-400 w-full">
                デフォルトは同一日・同一Round。分割すると D/E/F の試合・エントリーが子Roundに移動します。
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onGenerateAdditional}
              disabled={saving || !hasAdditionalAssignments}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              組み合わせを自動生成（D/E/F）
            </button>
            {!hasAdditionalAssignments && (
              <span className="text-xs text-gray-400">D/E/F グループに1チーム以上割り当ててください</span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">チーム</th>
                  {ADDITIONAL_MATCH_GROUPS.map((g) => (
                    <th key={g} className="text-center py-2 px-2">
                      {g}グループ
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allTeamsSorted.map((team) => (
                  <tr key={team.id} className="border-b border-gray-100">
                    <td className="py-2 px-2 font-medium">{team.name}</td>
                    {ADDITIONAL_MATCH_GROUPS.map((g) => (
                      <td key={g} className="text-center py-2 px-2">
                        <input
                          type="radio"
                          name={`add-assign-${team.id}-${assignmentRoundId}`}
                          checked={
                            getTeamAssignmentInGroups(
                              assignments,
                              assignmentRoundId,
                              team.id,
                              ADDITIONAL_MATCH_GROUPS
                            ) === g
                          }
                          onChange={() => setAdditionalGroup(team.id, g)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
