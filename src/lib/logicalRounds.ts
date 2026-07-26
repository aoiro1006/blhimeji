import { formatRoundDisplayName, isActiveLeagueRound } from "@/lib/rounds";
import type { LeagueData, Match, Round } from "@/types";

/** 論理節のルート（親Round）を取得 */
export function getLogicalRoundRoot(data: RoundLookup, roundId: string): Round | undefined {
  const round = data.rounds.find((r) => r.id === roundId);
  if (!round) return undefined;
  if (round.parentRoundId) {
    return data.rounds.find((r) => r.id === round.parentRoundId) ?? round;
  }
  return round;
}

type RoundLookup = Pick<LeagueData, "rounds">;

/** 親Roundに紐づく linked 子Round */
export function getLinkedChildRound(data: RoundLookup, parentRoundId: string): Round | undefined {
  const parent = data.rounds.find((r) => r.id === parentRoundId);
  if (parent?.additionalMatches?.mode === "linked" && parent.additionalMatches.linkedRoundId) {
    return data.rounds.find((r) => r.id === parent.additionalMatches!.linkedRoundId);
  }
  return data.rounds.find((r) => r.parentRoundId === parentRoundId && !r.held);
}

export function isLinkedAdditionalRound(round: Round): boolean {
  return Boolean(round.parentRoundId);
}

export function hasAdditionalMatches(round: Round | undefined): boolean {
  return Boolean(round?.additionalMatches?.enabled);
}

/** 本節順位・合算表示用の Round ID 一覧 */
export function getLogicalRoundIds(data: RoundLookup, roundId: string): string[] {
  const root = getLogicalRoundRoot(data, roundId);
  if (!root) return [roundId];
  const ids = [root.id];
  const child = getLinkedChildRound(data, root.id);
  if (child) ids.push(child.id);
  return ids;
}

/** 論理節に属する全試合 */
export function getLogicalRoundMatches(data: RoundLookup & Pick<LeagueData, "matches">, roundId: string): Match[] {
  const ids = new Set(getLogicalRoundIds(data, roundId));
  return data.matches
    .filter((m) => ids.has(m.roundId))
    .sort((a, b) => a.slotOrder - b.slotOrder);
}

/** 日程一覧・詳細の表示名 */
export function formatRoundScheduleLabel(data: RoundLookup, round: Round): string {
  if (round.parentRoundId) {
    const parent = data.rounds.find((r) => r.id === round.parentRoundId);
    if (parent) return `${formatRoundDisplayName(parent)}（別日）`;
  }
  return formatRoundDisplayName(round);
}

/** 累計対象に含める Round ID（linked 子を親とセットで） */
export function expandRoundIdsWithLinkedChildren(
  data: RoundLookup,
  roundIds: Set<string>
): Set<string> {
  const expanded = new Set(roundIds);
  for (const id of roundIds) {
    const child = getLinkedChildRound(data, id);
    if (child && isActiveLeagueRound(child)) expanded.add(child.id);
  }
  return expanded;
}

/** 追加試合の割り当て・エントリー用 Round ID */
export function getAdditionalAssignmentRoundId(data: RoundLookup, roundId: string): string {
  const root = getLogicalRoundRoot(data, roundId);
  if (!root) return roundId;
  if (root.additionalMatches?.mode === "linked") {
    return getLinkedChildRound(data, root.id)?.id ?? root.id;
  }
  return root.id;
}

export function getPrimaryAssignmentRoundId(data: RoundLookup, roundId: string): string {
  return getLogicalRoundRoot(data, roundId)?.id ?? roundId;
}

/** embedded → linked 分割用の子Round生成 */
export function createLinkedAdditionalRound(parent: Round, date: string, id?: string): Round {
  return {
    id: id ?? crypto.randomUUID(),
    type: parent.type,
    number: parent.number,
    subNumber: parent.subNumber,
    name: `${formatRoundDisplayName(parent)}（追加試合）`,
    date,
    time: parent.time,
    venue: parent.venue,
    contact: parent.contact,
    notes: parent.notes,
    pointSettings: parent.pointSettings,
    held: false,
    resultsFinished: false,
    participatingTeamIds: [],
    parentRoundId: parent.id,
  };
}

/** 日程一覧用：親の直後に linked 子を並べる */
export function interleaveLinkedChildRounds(rounds: Round[]): Round[] {
  const byId = new Map(rounds.map((r) => [r.id, r]));
  const childIds = new Set(rounds.filter((r) => r.parentRoundId).map((r) => r.id));
  const result: Round[] = [];

  for (const round of rounds) {
    if (childIds.has(round.id)) continue;
    result.push(round);
    const child = rounds.find((r) => r.parentRoundId === round.id);
    if (child) result.push(child);
  }

  for (const id of childIds) {
    if (!result.some((r) => r.id === id)) {
      const orphan = byId.get(id);
      if (orphan) result.push(orphan);
    }
  }

  return result;
}

/** 節削除時にまとめて消す Round ID（親＋linked 子） */
export function getRoundIdsForDeletion(data: RoundLookup, roundId: string): string[] {
  return getLogicalRoundIds(data, roundId);
}
