import { ALL_MATCH_GROUPS } from "@/lib/matchGroups";
import type { Match, MatchGroup, RoundTeamAssignment } from "@/types";

export interface RoundRobinPair {
  homeTeamId: string;
  awayTeamId: string;
}

/** 総当たりの対戦ペアを生成（各チームが均等に試合する） */
export function generateRoundRobinPairs(teamIds: string[]): RoundRobinPair[] {
  if (teamIds.length < 2) return [];

  const teams = [...teamIds];
  const bye = "__BYE__";

  if (teams.length % 2 === 1) {
    teams.push(bye);
  }

  const n = teams.length;
  const rounds = n - 1;
  const pairs: RoundRobinPair[] = [];
  const rotated = [...teams];

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < n / 2; i++) {
      const home = rotated[i];
      const away = rotated[n - 1 - i];
      if (home !== bye && away !== bye) {
        pairs.push({ homeTeamId: home, awayTeamId: away });
      }
    }
    const fixed = rotated[0];
    const rest = rotated.slice(1);
    rest.unshift(rest.pop()!);
    rotated.splice(0, rotated.length, fixed, ...rest);
  }

  return pairs;
}

function emptyGroupMap(): Record<MatchGroup, string[]> {
  return { A: [], B: [], C: [], D: [], E: [], F: [] };
}

/** 指定グループのみスロット割り当て（A–C / D–F を個別生成可能） */
export function generateScheduledMatchesForGroups(
  roundId: string,
  assignments: RoundTeamAssignment[],
  groups: MatchGroup[]
): Omit<Match, "id">[] {
  const groupPairs = groups.map((group) => {
    const teamIds = assignments
      .filter((a) => a.roundId === roundId && a.group === group)
      .map((a) => a.teamId);
    return { group, pairs: generateRoundRobinPairs(teamIds) };
  });

  const maxSlots = Math.max(0, ...groupPairs.map((g) => g.pairs.length));
  const matches: Omit<Match, "id">[] = [];
  let slotOrder = 0;

  for (let slot = 0; slot < maxSlots; slot++) {
    for (const { group, pairs } of groupPairs) {
      if (slot < pairs.length) {
        const pair = pairs[slot];
        matches.push({
          roundId,
          group,
          homeTeamId: pair.homeTeamId,
          awayTeamId: pair.awayTeamId,
          slotOrder: slotOrder++,
          homeScore: null,
          awayScore: null,
          status: "scheduled",
        });
      }
    }
  }

  return matches;
}

/** A–F グループを同会場で並行開催するスロット割り当て */
export function generateScheduledMatches(
  roundId: string,
  assignments: RoundTeamAssignment[]
): Omit<Match, "id">[] {
  return generateScheduledMatchesForGroups(roundId, assignments, ALL_MATCH_GROUPS);
}

/** 手動並べ替え後の slotOrder を再採番 */
export function reindexSlotOrder(matches: Match[]): Match[] {
  return matches
    .sort((a, b) => a.slotOrder - b.slotOrder)
    .map((m, i) => ({ ...m, slotOrder: i }));
}

export function getAssignmentsForRound(
  assignments: RoundTeamAssignment[],
  roundId: string
): Record<MatchGroup, string[]> {
  const result = emptyGroupMap();
  for (const a of assignments.filter((x) => x.roundId === roundId)) {
    result[a.group].push(a.teamId);
  }
  return result;
}

/** 同一スコープ（A–C または D–F）内で1グループのみ割り当て */
export function setTeamGroupAssignment(
  assignments: RoundTeamAssignment[],
  roundId: string,
  teamId: string,
  group: MatchGroup | "",
  scopeGroups: MatchGroup[]
): RoundTeamAssignment[] {
  const scope = new Set(scopeGroups);
  let next = assignments.filter(
    (a) => !(a.roundId === roundId && a.teamId === teamId && scope.has(a.group))
  );
  if (group) {
    next = [...next, { roundId, teamId, group }];
  }
  return next;
}

export function getTeamAssignmentInGroups(
  assignments: RoundTeamAssignment[],
  roundId: string,
  teamId: string,
  groups: MatchGroup[]
): MatchGroup | "" {
  const found = assignments.find(
    (a) => a.roundId === roundId && a.teamId === teamId && groups.includes(a.group)
  );
  return found?.group ?? "";
}
