import { getLogicalRoundIds } from "@/lib/logicalRounds";
import type { DisplayLeague, LeagueData, Match, Team, TeamStanding } from "@/types";
import {
  buildPointBreakdown,
  calculateRankingPoints,
  computeTeamPointAccumulators,
  getRelevantTeamIds,
  getTeamDisplayLeague,
} from "@/lib/points";
import { getLeagueRoundIdsUpTo, isActiveLeagueRound, isLeagueRound, isNonLeagueRound, formatRoundDisplayName } from "@/lib/rounds";
import type { TeamMatchRecord } from "@/types";

function getRoundIds(data: LeagueData, options: {
  leagueOnly?: boolean;
  roundId?: string;
  logicalRoundId?: string;
  otherOnly?: boolean;
  leagueCumulativeThroughRoundId?: string;
}): Set<string> {
  if (options.logicalRoundId) {
    return new Set(getLogicalRoundIds(data, options.logicalRoundId));
  }
  if (options.leagueCumulativeThroughRoundId) {
    const target = data.rounds.find((r) => r.id === options.leagueCumulativeThroughRoundId);
    if (target && isActiveLeagueRound(target) && target.number > 0) {
      return getLeagueRoundIdsUpTo(data, target);
    }
  }
  let rounds = data.rounds;
  if (options.roundId) return new Set([options.roundId]);
  if (options.leagueOnly) rounds = rounds.filter(isActiveLeagueRound);
  if (options.otherOnly) rounds = rounds.filter((r) => isNonLeagueRound(r) && !r.held);
  return new Set(rounds.map((r) => r.id));
}

function buildTeamMatchHistory(
  data: LeagueData,
  teamId: string,
  allowedRoundIds: Set<string>
): TeamMatchRecord[] {
  const roundMap = new Map(data.rounds.map((r) => [r.id, r]));
  const records: (TeamMatchRecord & {
    roundNumber: number;
    roundSubNumber: number;
    slotOrder: number;
  })[] = [];

  for (const match of data.matches) {
    if (!allowedRoundIds.has(match.roundId)) continue;
    if (match.status !== "completed" || match.homeScore === null || match.awayScore === null) {
      continue;
    }

    const isHome = match.homeTeamId === teamId;
    const isAway = match.awayTeamId === teamId;
    if (!isHome && !isAway) continue;

    const round = roundMap.get(match.roundId);
    if (!round) continue;

    const opponent = data.teams.find((t) => t.id === (isHome ? match.awayTeamId : match.homeTeamId));
    if (!opponent) continue;

    const teamScore = isHome ? match.homeScore : match.awayScore;
    const opponentScore = isHome ? match.awayScore : match.homeScore;
    const result =
      teamScore > opponentScore ? "win" : teamScore < opponentScore ? "loss" : "draw";

    records.push({
      roundLabel: formatRoundDisplayName(round),
      roundDate: round.date,
      isLeagueRound: isLeagueRound(round),
      opponentName: opponent.name,
      opponentShortName: opponent.shortName,
      teamScore,
      opponentScore,
      result,
      roundNumber: round.number,
      roundSubNumber: round.subNumber,
      slotOrder: match.slotOrder,
    });
  }

  records.sort((a, b) => {
    const da = a.roundDate ?? "";
    const db = b.roundDate ?? "";
    if (da && db && da !== db) return db.localeCompare(da);
    if (da && !db) return -1;
    if (!da && db) return 1;
    if (a.roundNumber !== b.roundNumber) return b.roundNumber - a.roundNumber;
    if (a.roundSubNumber !== b.roundSubNumber) return b.roundSubNumber - a.roundSubNumber;
    return b.slotOrder - a.slotOrder;
  });

  return records.map(({ roundNumber: _n, roundSubNumber: _s, slotOrder: _o, ...rest }) => rest);
}

/**
 * ポイント制順位計算
 * - 総合リーグの試合結果を元にA/Bリーグ別に表示
 * - 順位はランキングポイントの高い順
 */
export function calculateStandings(
  data: LeagueData,
  options?: {
    displayLeague?: DisplayLeague;
    roundId?: string;
    /** 論理節（追加試合 linked 含む）の合算 */
    logicalRoundId?: string;
    leagueOnly?: boolean;
    leagueCumulativeThroughRoundId?: string;
    /** 本節・当日順位：勝数→得失点差で並べる（ポイント制は使わない） */
    sortByWinsAndPointDiff?: boolean;
  }
): TeamStanding[] {
  const { teams, standingsOverrides } = data;
  const {
    displayLeague,
    roundId,
    logicalRoundId,
    leagueOnly = false,
    leagueCumulativeThroughRoundId,
    sortByWinsAndPointDiff = false,
  } = options ?? {};

  const allowedRoundIds = getRoundIds(data, {
    roundId: logicalRoundId ? undefined : leagueCumulativeThroughRoundId ? undefined : roundId,
    logicalRoundId,
    leagueOnly: leagueOnly && !roundId && !logicalRoundId && !leagueCumulativeThroughRoundId,
    leagueCumulativeThroughRoundId,
  });

  const relevantTeamIds = getRelevantTeamIds(data, {
    displayLeague,
    roundId: logicalRoundId ? undefined : leagueCumulativeThroughRoundId ? undefined : roundId,
    logicalRoundId,
    leagueCumulativeThroughRoundId,
  });

  const accumulators = computeTeamPointAccumulators(data, {
    allowedRoundIds,
    relevantTeamIds,
    displayLeague,
  });

  const overrideMap = new Map(
    standingsOverrides
      .filter((o) => !displayLeague || !o.displayLeague || o.displayLeague === displayLeague)
      .map((o) => [o.teamId, o])
  );

  const standings: TeamStanding[] = teams
    .filter((t) => relevantTeamIds.has(t.id))
    .map((team) => {
      const acc = accumulators.get(team.id);
      const stats = acc?.stats ?? {
        played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      };
      const override = overrideMap.get(team.id);
      const pointDiff = stats.pointsFor - stats.pointsAgainst;
      return {
        team,
        rank: 0,
        rankingPoints:
          sortByWinsAndPointDiff || !acc ? 0 : calculateRankingPoints(data, team.id, acc),
        played: stats.played,
        wins: stats.wins,
        losses: stats.losses,
        draws: stats.draws,
        pointsFor: stats.pointsFor,
        pointsAgainst: stats.pointsAgainst,
        pointDiff,
        winRate: stats.played > 0 ? stats.wins / stats.played : 0,
        rankOverride: override?.rankOverride,
        note: override?.note,
        displayLeague: getTeamDisplayLeague(data, team.id),
        pointBreakdown:
          sortByWinsAndPointDiff || !acc ? undefined : buildPointBreakdown(acc),
        matchHistory: acc ? buildTeamMatchHistory(data, team.id, allowedRoundIds) : undefined,
      };
    })
    .filter((s) => s.played > 0);

  standings.sort((a, b) => {
    if (a.rankOverride !== undefined && b.rankOverride !== undefined) return a.rankOverride - b.rankOverride;
    if (a.rankOverride !== undefined) return -1;
    if (b.rankOverride !== undefined) return 1;
    if (sortByWinsAndPointDiff) {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
      return a.team.name.localeCompare(b.team.name, "ja");
    }
    if (b.rankingPoints !== a.rankingPoints) return b.rankingPoints - a.rankingPoints;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
    return a.team.name.localeCompare(b.team.name, "ja");
  });

  standings.forEach((s, i) => {
    s.rank = i + 1;
  });

  return standings;
}

/** 本節・当日順位（勝数 → 得失点差）。論理節（追加試合含む）を合算 */
export function calculateRoundDayStandings(data: LeagueData, roundId: string): TeamStanding[] {
  return calculateStandings(data, { logicalRoundId: roundId, sortByWinsAndPointDiff: true });
}

/** 今シーズン（公開データ）に参加経験のあるチームID（各節の参加登録） */
export function getSeasonParticipantTeamIds(data: LeagueData): Set<string> {
  const ids = new Set<string>();
  for (const round of data.rounds) {
    for (const teamId of round.participatingTeamIds ?? []) {
      ids.add(teamId);
    }
  }
  return ids;
}

/** 参加チーム一覧の表示順：試合数（多い順）→ エントリーNO */
export function sortTeamsForTeamsPage(
  teams: Team[],
  standingsByTeamId: Record<string, Pick<TeamStanding, "played">>
): Team[] {
  return [...teams].sort((a, b) => {
    const playedDiff =
      (standingsByTeamId[b.id]?.played ?? 0) - (standingsByTeamId[a.id]?.played ?? 0);
    if (playedDiff !== 0) return playedDiff;
    return a.teamNumber - b.teamNumber;
  });
}

/** 総合リーグ累計順位でチームをソート（参加チーム選択の表示順用） */
export function sortTeamsByMainRank(data: LeagueData, teamIds: string[]): Team[] {
  const mainStandings = calculateStandings(data, { leagueOnly: true });
  const rankMap = new Map(mainStandings.map((s) => [s.team.id, s.rank]));

  return teamIds
    .map((id) => data.teams.find((t) => t.id === id))
    .filter((t): t is Team => !!t)
    .sort((a, b) => {
      const ra = rankMap.get(a.id) ?? 9999;
      const rb = rankMap.get(b.id) ?? 9999;
      if (ra !== rb) return ra - rb;
      return a.teamNumber - b.teamNumber;
    });
}

export function getTeamById(teams: Team[], id: string): Team | undefined {
  return teams.find((t) => t.id === id);
}

export function formatMatchResult(match: Match, teams: Team[]): string {
  const home = getTeamById(teams, match.homeTeamId);
  const away = getTeamById(teams, match.awayTeamId);
  if (!home || !away) return "";
  if (match.status !== "completed" || match.homeScore === null || match.awayScore === null) {
    return `${home.shortName} vs ${away.shortName}`;
  }
  return `${home.shortName} ${match.homeScore} - ${match.awayScore} ${away.shortName}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date
    .toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" })
    .replace(/\//g, ".");
}

export function getRoundLabel(data: LeagueData, roundId: string): string {
  const round = data.rounds.find((r) => r.id === roundId);
  return round?.name ?? "節";
}

export { getTeamDisplayLeague };
