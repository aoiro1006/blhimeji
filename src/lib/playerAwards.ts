import {
  getLogicalRoundIds,
  getLogicalRoundRoot,
} from "@/lib/logicalRounds";
import { isPublicRound } from "@/lib/rounds";
import type {
  IndividualAwardKey,
  LeagueData,
  PlayerRoundAwards,
  PlayerSeasonStats,
  Team,
  TeamPlayerStatsGroup,
} from "@/types";

export const INDIVIDUAL_AWARD_COLUMNS: {
  key: IndividualAwardKey;
  label: string;
  shortLabel: string;
}[] = [
  { key: "superPlay", label: "スーパープレー賞", shortLabel: "SP" },
  { key: "unique", label: "ユニーク賞", shortLabel: "UQ" },
  { key: "hype", label: "盛り上げたでしょう", shortLabel: "盛" },
];

export interface TeamPlayerListEntry {
  team: Team;
  players: Team["players"];
  /** 組み合わせで当節にエントリーされているチーム */
  isEntry: boolean;
}

export function emptyAwardCounts(): Pick<PlayerRoundAwards, IndividualAwardKey> {
  return { superPlay: 0, unique: 0, hype: 0 };
}

export function getRoundPlayerAwards(
  all: PlayerRoundAwards[],
  roundId: string
): PlayerRoundAwards[] {
  return all.filter((a) => a.roundId === roundId);
}

export function awardRowKey(teamId: string, playerId: string): string {
  return `${teamId}:${playerId}`;
}

export function buildRoundAwardMap(
  awards: PlayerRoundAwards[],
  roundId: string
): Map<string, PlayerRoundAwards> {
  const map = new Map<string, PlayerRoundAwards>();
  for (const row of getRoundPlayerAwards(awards, roundId)) {
    map.set(awardRowKey(row.teamId, row.playerId), row);
  }
  return map;
}

/** 登録選手をチーム順で一覧（選手未登録チームは除外） */
export function listTeamsWithPlayers(teams: Team[]): { team: Team; players: Team["players"] }[] {
  return [...teams]
    .sort((a, b) => a.teamNumber - b.teamNumber)
    .map((team) => ({ team, players: team.players.filter((p) => p.name.trim()) }))
    .filter((entry) => entry.players.length > 0);
}

/** エントリーチームを上に、それ以外を下に並べる */
export function listTeamsWithPlayersForRound(
  teams: Team[],
  participatingTeamIds: string[]
): TeamPlayerListEntry[] {
  const entrySet = new Set(participatingTeamIds);
  return listTeamsWithPlayers(teams)
    .map((entry) => ({
      ...entry,
      isEntry: entrySet.has(entry.team.id),
    }))
    .sort((a, b) => {
      if (a.isEntry !== b.isEntry) return a.isEntry ? -1 : 1;
      return a.team.teamNumber - b.team.teamNumber;
    });
}

export function hasRoundAwardData(row: PlayerRoundAwards): boolean {
  return Boolean(row.absent) || row.superPlay > 0 || row.unique > 0 || row.hype > 0;
}

export function mergeRoundAwardsIntoAll(
  all: PlayerRoundAwards[],
  roundId: string,
  roundRows: PlayerRoundAwards[]
): PlayerRoundAwards[] {
  const other = all.filter((a) => a.roundId !== roundId);
  const kept = roundRows.filter(hasRoundAwardData);
  return [...other, ...kept];
}

export function buildRoundAwardRows(
  data: LeagueData,
  roundId: string,
  editedMap: Map<string, PlayerRoundAwards>
): PlayerRoundAwards[] {
  const round = data.rounds.find((r) => r.id === roundId);
  const participatingTeamIds = round?.participatingTeamIds ?? [];
  const rows: PlayerRoundAwards[] = [];

  for (const { team, players } of listTeamsWithPlayersForRound(data.teams, participatingTeamIds)) {
    for (const player of players) {
      const key = awardRowKey(team.id, player.id);
      const existing = editedMap.get(key);
      rows.push(
        existing
          ? { ...existing, absent: Boolean(existing.absent) }
          : {
              roundId,
              teamId: team.id,
              playerId: player.id,
              absent: false,
              ...emptyAwardCounts(),
            }
      );
    }
  }
  return rows;
}

function findPlayerAwardRow(
  awards: PlayerRoundAwards[],
  roundIds: string | string[],
  teamId: string,
  playerId: string
): PlayerRoundAwards | undefined {
  const ids = Array.isArray(roundIds) ? roundIds : [roundIds];
  return awards.find(
    (row) =>
      ids.includes(row.roundId) &&
      row.teamId === teamId &&
      row.playerId === playerId
  );
}

/** 公開ページ用：出場経験のあるチーム・選手のシーズン通算スタッツ */
export function calculatePlayerSeasonStats(data: LeagueData): TeamPlayerStatsGroup[] {
  const awards = data.playerAwards ?? [];
  const publicRounds = data.rounds.filter(isPublicRound);
  const teamMap = new Map(data.teams.map((team) => [team.id, team]));

  type MutableStats = PlayerSeasonStats & { teamId: string };
  const statsMap = new Map<string, MutableStats>();

  function getOrCreate(teamId: string, playerId: string, playerName: string): MutableStats {
    const key = awardRowKey(teamId, playerId);
    let stats = statsMap.get(key);
    if (!stats) {
      stats = {
        teamId,
        playerId,
        playerName,
        appearances: 0,
        superPlay: 0,
        unique: 0,
        hype: 0,
      };
      statsMap.set(key, stats);
    }
    return stats;
  }

  for (const round of publicRounds) {
    const logicalIds = getLogicalRoundIds(data, round.id);
    const root = getLogicalRoundRoot(data, round.id);
    if (!root || root.id !== round.id) continue;

    const participatingTeamIds = new Set<string>();
    for (const rid of logicalIds) {
      const r = data.rounds.find((x) => x.id === rid);
      for (const teamId of r?.participatingTeamIds ?? []) {
        participatingTeamIds.add(teamId);
      }
    }
    if (participatingTeamIds.size === 0) continue;

    for (const teamId of participatingTeamIds) {
      const team = teamMap.get(teamId);
      if (!team) continue;

      for (const player of team.players) {
        if (!player.name.trim()) continue;

        const row = findPlayerAwardRow(awards, logicalIds, teamId, player.id);
        if (row?.absent) continue;

        const stats = getOrCreate(teamId, player.id, player.name);
        stats.appearances += 1;
        if (row) {
          stats.superPlay += row.superPlay;
          stats.unique += row.unique;
          stats.hype += row.hype;
        }
      }
    }
  }

  return [...data.teams]
    .sort((a, b) => a.teamNumber - b.teamNumber)
    .map((team) => ({
      team,
      players: [...statsMap.values()]
        .filter((stats) => stats.teamId === team.id && stats.appearances > 0)
        .map(({ teamId: _teamId, ...playerStats }) => playerStats)
        .sort(
          (a, b) =>
            b.appearances - a.appearances ||
            a.playerName.localeCompare(b.playerName, "ja")
        ),
    }))
    .filter((group) => group.players.length > 0);
}
