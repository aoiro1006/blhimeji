import { ALL_MATCH_GROUPS } from "@/lib/matchGroups";
import { getLogicalRoundIds, getLogicalRoundMatches } from "@/lib/logicalRounds";
import type { LeagueData, Match, MatchGroup, Team } from "@/types";

export type CrossTableCell =
  | { type: "self" }
  | { type: "empty" }
  | { type: "pending" }
  | { type: "cancelled" }
  | { type: "result"; rowScore: number; colScore: number };

export interface GroupCrossTable {
  group: MatchGroup;
  teams: Team[];
  matrix: CrossTableCell[][];
}

export function getGroupTeamsForRound(
  data: LeagueData,
  roundId: string,
  group: MatchGroup
): Team[] {
  const teamIds = data.roundAssignments
    .filter((a) => a.roundId === roundId && a.group === group)
    .map((a) => a.teamId);

  return teamIds
    .map((id) => data.teams.find((t) => t.id === id))
    .filter((t): t is Team => !!t)
    .sort((a, b) => a.teamNumber - b.teamNumber);
}

function findMatchBetween(matches: Match[], teamA: string, teamB: string): Match | undefined {
  return matches.find(
    (m) =>
      (m.homeTeamId === teamA && m.awayTeamId === teamB) ||
      (m.homeTeamId === teamB && m.awayTeamId === teamA)
  );
}

export function buildCrossTable(teams: Team[], matches: Match[]): CrossTableCell[][] {
  return teams.map((rowTeam, i) =>
    teams.map((colTeam, j) => {
      if (i === j) return { type: "self" as const };

      const match = findMatchBetween(matches, rowTeam.id, colTeam.id);
      if (!match) return { type: "empty" as const };
      if (match.status === "cancelled") return { type: "cancelled" as const };
      if (
        match.status === "completed" &&
        match.homeScore !== null &&
        match.awayScore !== null
      ) {
        const isRowHome = match.homeTeamId === rowTeam.id;
        return {
          type: "result" as const,
          rowScore: isRowHome ? match.homeScore : match.awayScore,
          colScore: isRowHome ? match.awayScore : match.homeScore,
        };
      }
      return { type: "pending" as const };
    })
  );
}

export function buildRoundCrossTables(data: LeagueData, roundId: string): GroupCrossTable[] {
  const roundMatches = data.matches.filter((m) => m.roundId === roundId);

  return ALL_MATCH_GROUPS.map((group) => {
    const teams = getGroupTeamsForRound(data, roundId, group);
    const groupMatches = roundMatches.filter((m) => m.group === group);
    return {
      group,
      teams,
      matrix: buildCrossTable(teams, groupMatches),
    };
  }).filter((t) => t.teams.length > 0);
}

export function roundHasMatches(data: LeagueData, roundId: string): boolean {
  return getLogicalRoundMatches(data, roundId).length > 0;
}

export function getRoundMatchStats(data: LeagueData, roundId: string) {
  const logicalIds = getLogicalRoundIds(data, roundId);
  const matches = data.matches.filter((m) => logicalIds.includes(m.roundId));
  const completed = matches.filter(
    (m) => m.status === "completed" && m.homeScore !== null && m.awayScore !== null
  ).length;
  return { total: matches.length, completed };
}

export function sortRounds<T extends { type: string; number: number; subNumber: number; date?: string }>(
  rounds: T[]
): T[] {
  return [...rounds].sort((a, b) => {
    const aLeague = a.type === "league";
    const bLeague = b.type === "league";
    if (aLeague && !bLeague) return -1;
    if (!aLeague && bLeague) return 1;
    if (aLeague && bLeague) {
      if (a.number !== b.number) return a.number - b.number;
      return a.subNumber - b.subNumber;
    }
    return (a.date ?? "").localeCompare(b.date ?? "");
  });
}
