import {
  BASE_PARTICIPATION_POINTS,
  getRoundPointSettings,
} from "@/lib/pointSettings";
import {
  compareLeagueRounds,
  getLeagueRoundIdsUpTo,
  isActiveLeagueRound,
  isLeagueRound,
  sortRoundsForAdmin,
} from "@/lib/rounds";
import { getLogicalRoundIds } from "@/lib/logicalRounds";
import type { DisplayLeague, LeagueData, Match, Round, Team, TeamPointBreakdown } from "@/types";

interface MatchStats {
  played: number;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
}

interface TeamPointAccumulator {
  stats: MatchStats;
  basePoints: number;
  pointDiffBonus: number;
  blowoutBonus: number;
  giantKillerBonus: number;
  fightingSpiritBonus: number;
  matchCountBonus: number;
  giantKillerCount: number;
  fightingSpiritCount: number;
  blowoutPointUnits: number;
}

function emptyStats(): MatchStats {
  return { played: 0, wins: 0, losses: 0, draws: 0, pointsFor: 0, pointsAgainst: 0 };
}

function emptyAccumulator(): TeamPointAccumulator {
  return {
    stats: emptyStats(),
    basePoints: 0,
    pointDiffBonus: 0,
    blowoutBonus: 0,
    giantKillerBonus: 0,
    fightingSpiritBonus: 0,
    matchCountBonus: 0,
    giantKillerCount: 0,
    fightingSpiritCount: 0,
    blowoutPointUnits: 0,
  };
}

function getMatchResult(homeScore: number, awayScore: number) {
  if (homeScore > awayScore) return { homeWin: true, awayWin: false, draw: false };
  if (homeScore < awayScore) return { homeWin: false, awayWin: true, draw: false };
  return { homeWin: false, awayWin: false, draw: true };
}

/** 圧勝点: 4点差=1, 5=2, 6以上=3 */
export function getBlowoutPoints(scoreDiff: number): number {
  if (scoreDiff < 4) return 0;
  if (scoreDiff === 4) return 1;
  if (scoreDiff === 5) return 2;
  return 3;
}

function getTeamDisplayLeague(data: LeagueData, teamId: string): DisplayLeague {
  const team = data.teams.find((t) => t.id === teamId);
  if (team?.displayLeague) return team.displayLeague;
  const half = Math.ceil(data.teams.length / 2);
  const num = team?.teamNumber ?? 999;
  return num <= half ? "A" : "B";
}

function totalPointsSoFar(acc: TeamPointAccumulator): number {
  const { stats } = acc;
  const winRateP = stats.played > 0 ? (stats.wins / stats.played) * 100 : 0;
  return (
    acc.basePoints +
    winRateP +
    acc.pointDiffBonus +
    acc.blowoutBonus +
    acc.giantKillerBonus +
    acc.fightingSpiritBonus +
    acc.matchCountBonus
  );
}

function buildRankMap(
  accumulators: Map<string, TeamPointAccumulator>,
  teamIds: string[]
): Map<string, number> {
  const sorted = teamIds
    .map((id) => ({ id, pts: totalPointsSoFar(accumulators.get(id) ?? emptyAccumulator()) }))
    .sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      return a.id.localeCompare(b.id);
    });

  const ranks = new Map<string, number>();
  sorted.forEach((t, i) => ranks.set(t.id, i + 1));
  return ranks;
}

function isBottom30Percent(rank: number, totalTeams: number): boolean {
  if (totalTeams === 0) return false;
  const threshold = Math.floor(totalTeams * 0.7);
  return rank > threshold;
}

function getOrderedRoundsInScope(data: LeagueData, allowedRoundIds: Set<string>): Round[] {
  return sortRoundsForAdmin(data.rounds).filter((r) => allowedRoundIds.has(r.id));
}

function getPreviousLeagueRounds(data: LeagueData, round: Round): Round[] {
  if (!isActiveLeagueRound(round) || round.number <= 0) return [];
  const prevIds = new Set<string>();
  for (const r of data.rounds) {
    if (!isActiveLeagueRound(r)) continue;
    if (compareLeagueRounds(r, round) < 0) prevIds.add(r.id);
  }
  return getOrderedRoundsInScope(data, prevIds);
}

/** シーズン初のリーグ節出場か（当該節がそのチームの初参加節） */
function isFirstLeagueRoundAppearance(data: LeagueData, teamId: string, round: Round): boolean {
  if (!isActiveLeagueRound(round)) return false;
  if (!round.participatingTeamIds.includes(teamId)) return false;

  const leagueRounds = data.rounds.filter(isActiveLeagueRound).sort(compareLeagueRounds);
  for (const r of leagueRounds) {
    if (compareLeagueRounds(r, round) > 0) break;
    if (r.participatingTeamIds.includes(teamId)) {
      return r.id === round.id;
    }
  }
  return false;
}

function processRoundMatches(
  data: LeagueData,
  round: Round,
  accumulators: Map<string, TeamPointAccumulator>,
  relevantTeamIds: Set<string>,
  displayLeague: DisplayLeague | undefined,
  basePointsGranted: Set<string>
): void {
  const settings = getRoundPointSettings(round);
  const roundMatches = data.matches.filter(
    (m) =>
      m.roundId === round.id &&
      m.status === "completed" &&
      m.homeScore !== null &&
      m.awayScore !== null
  );

  const prevLeagueRounds = getPreviousLeagueRounds(data, round);

  let prevLeagueRanks = new Map<DisplayLeague, Map<string, number>>();

  function loadPrevLeagueRanks(prevScope: Set<string>) {
    for (const league of ["A", "B"] as DisplayLeague[]) {
      const leagueIds = data.teams
        .filter((t) => getTeamDisplayLeague(data, t.id) === league)
        .map((t) => t.id);
      const prevAccLeague = computeAccumulators(data, prevScope, new Set(leagueIds), league);
      prevLeagueRanks.set(league, buildRankMap(prevAccLeague, leagueIds));
    }
  }

  if (isLeagueRound(round) && prevLeagueRounds.length > 0) {
    loadPrevLeagueRanks(new Set(prevLeagueRounds.map((r) => r.id)));
  } else if (!isLeagueRound(round)) {
    const allPrevLeague = data.rounds.filter((r) => isActiveLeagueRound(r));
    if (allPrevLeague.length > 0) {
      const lastPrev = [...allPrevLeague].sort(compareLeagueRounds).at(-1)!;
      loadPrevLeagueRanks(getLeagueRoundIdsUpTo(data, lastPrev));
    }
  }

  if (isActiveLeagueRound(round)) {
    for (const teamId of round.participatingTeamIds) {
      if (!relevantTeamIds.has(teamId)) continue;
      if (basePointsGranted.has(teamId)) continue;
      basePointsGranted.add(teamId);
      const acc = accumulators.get(teamId) ?? emptyAccumulator();
      acc.basePoints += BASE_PARTICIPATION_POINTS;
      accumulators.set(teamId, acc);
    }
  }

  const roundStats = new Map<string, MatchStats>();
  let blowoutRaw = new Map<string, number>();
  let giantKillerRaw = new Map<string, number>();
  let fightingSpiritRaw = new Map<string, number>();

  for (const match of roundMatches) {
    const homeIn = relevantTeamIds.has(match.homeTeamId);
    const awayIn = relevantTeamIds.has(match.awayTeamId);
    if (!homeIn && !awayIn) continue;

    const homeScore = match.homeScore!;
    const awayScore = match.awayScore!;
    const result = getMatchResult(homeScore, awayScore);

    const updateTeam = (teamId: string, scored: number, conceded: number, won: boolean, lost: boolean, draw: boolean) => {
      const s = roundStats.get(teamId) ?? emptyStats();
      s.played++;
      s.pointsFor += scored;
      s.pointsAgainst += conceded;
      if (draw) s.draws++;
      else if (won) s.wins++;
      else if (lost) s.losses++;
      roundStats.set(teamId, s);

      const acc = accumulators.get(teamId) ?? emptyAccumulator();
      acc.stats.played++;
      acc.stats.pointsFor += scored;
      acc.stats.pointsAgainst += conceded;
      if (draw) acc.stats.draws++;
      else if (won) acc.stats.wins++;
      else if (lost) acc.stats.losses++;
      accumulators.set(teamId, acc);
    };

    if (homeIn) updateTeam(match.homeTeamId, homeScore, awayScore, result.homeWin, result.awayWin, result.draw);
    if (awayIn) updateTeam(match.awayTeamId, awayScore, homeScore, result.awayWin, result.homeWin, result.draw);

    if (result.homeWin && homeIn) {
      applyWinBonuses(
        data,
        round,
        match.homeTeamId,
        match.awayTeamId,
        homeScore - awayScore,
        prevLeagueRanks,
        blowoutRaw,
        giantKillerRaw,
        fightingSpiritRaw
      );
    }
    if (result.awayWin && awayIn) {
      applyWinBonuses(
        data,
        round,
        match.awayTeamId,
        match.homeTeamId,
        awayScore - homeScore,
        prevLeagueRanks,
        blowoutRaw,
        giantKillerRaw,
        fightingSpiritRaw
      );
    }
  }

  for (const [teamId, s] of roundStats) {
    const acc = accumulators.get(teamId)!;
    const rd = Math.max(0, s.pointsFor - s.pointsAgainst);
    acc.pointDiffBonus += rd * settings.pointDiffMultiplier;
    acc.blowoutBonus += (blowoutRaw.get(teamId) ?? 0) * settings.blowoutMultiplier;
    acc.giantKillerBonus += (giantKillerRaw.get(teamId) ?? 0) * settings.giantKillerMultiplier;
    acc.fightingSpiritBonus += (fightingSpiritRaw.get(teamId) ?? 0) * settings.fightingSpiritMultiplier;
    acc.matchCountBonus += s.played * settings.matchCountMultiplier;
    acc.blowoutPointUnits += blowoutRaw.get(teamId) ?? 0;
    acc.giantKillerCount += giantKillerRaw.get(teamId) ?? 0;
    acc.fightingSpiritCount += fightingSpiritRaw.get(teamId) ?? 0;
  }
}

function applyWinBonuses(
  data: LeagueData,
  round: Round,
  winnerId: string,
  loserId: string,
  margin: number,
  prevLeagueRanks: Map<DisplayLeague, Map<string, number>>,
  blowoutRaw: Map<string, number>,
  giantKillerRaw: Map<string, number>,
  fightingSpiritRaw: Map<string, number>
) {
  const marginPoints = getBlowoutPoints(margin);
  if (marginPoints > 0) {
    blowoutRaw.set(winnerId, (blowoutRaw.get(winnerId) ?? 0) + marginPoints);
  }

  const winnerDebut = isFirstLeagueRoundAppearance(data, winnerId, round);
  const loserDebut = isFirstLeagueRoundAppearance(data, loserId, round);

  if (!winnerDebut && !loserDebut) {
    const winnerLeague = getTeamDisplayLeague(data, winnerId);
    const leagueRank = prevLeagueRanks.get(winnerLeague);
    const winnerLeagueRank = leagueRank?.get(winnerId);
    const loserLeagueRank = leagueRank?.get(loserId);
    if (
      winnerLeagueRank !== undefined &&
      loserLeagueRank !== undefined &&
      winnerLeagueRank - loserLeagueRank >= 5
    ) {
      giantKillerRaw.set(winnerId, (giantKillerRaw.get(winnerId) ?? 0) + 1);
    }
  }

  const winnerLeague = getTeamDisplayLeague(data, winnerId);
  const leagueRank = prevLeagueRanks.get(winnerLeague);
  const winnerLeagueRank = leagueRank?.get(winnerId);
  const leagueTeamCount = data.teams.filter((t) => getTeamDisplayLeague(data, t.id) === winnerLeague).length;
  if (winnerLeagueRank !== undefined && isBottom30Percent(winnerLeagueRank, leagueTeamCount)) {
    fightingSpiritRaw.set(winnerId, (fightingSpiritRaw.get(winnerId) ?? 0) + 1);
  }
}

function computeAccumulators(
  data: LeagueData,
  allowedRoundIds: Set<string>,
  relevantTeamIds: Set<string>,
  displayLeague: DisplayLeague | undefined
): Map<string, TeamPointAccumulator> {
  const accumulators = new Map<string, TeamPointAccumulator>();
  for (const id of relevantTeamIds) {
    accumulators.set(id, emptyAccumulator());
  }

  const basePointsGranted = new Set<string>();
  const rounds = getOrderedRoundsInScope(data, allowedRoundIds);
  for (const round of rounds) {
    processRoundMatches(
      data,
      round,
      accumulators,
      relevantTeamIds,
      displayLeague,
      basePointsGranted
    );
  }

  return accumulators;
}

export function calculateRankingPoints(
  _data: LeagueData,
  _teamId: string,
  accumulator: TeamPointAccumulator
): number {
  return totalPointsSoFar(accumulator);
}

export function buildPointBreakdown(accumulator: TeamPointAccumulator): TeamPointBreakdown {
  const { stats } = accumulator;
  const winRatePercent = stats.played > 0 ? (stats.wins / stats.played) * 100 : 0;
  return {
    basePoints: accumulator.basePoints,
    winRatePoints: winRatePercent,
    pointDiffBonus: accumulator.pointDiffBonus,
    blowoutBonus: accumulator.blowoutBonus,
    giantKillerBonus: accumulator.giantKillerBonus,
    fightingSpiritBonus: accumulator.fightingSpiritBonus,
    matchCountBonus: accumulator.matchCountBonus,
    total: totalPointsSoFar(accumulator),
    winRatePercent,
    pointDiff: stats.pointsFor - stats.pointsAgainst,
    giantKillerCount: accumulator.giantKillerCount,
    fightingSpiritCount: accumulator.fightingSpiritCount,
    blowoutPointUnits: accumulator.blowoutPointUnits,
    matchCount: stats.played,
  };
}

export function computeTeamPointAccumulators(
  data: LeagueData,
  options: {
    allowedRoundIds: Set<string>;
    relevantTeamIds: Set<string>;
    displayLeague?: DisplayLeague;
  }
): Map<string, TeamPointAccumulator> {
  return computeAccumulators(
    data,
    options.allowedRoundIds,
    options.relevantTeamIds,
    options.displayLeague
  );
}

export function getRelevantTeamIds(
  data: LeagueData,
  options: {
    displayLeague?: DisplayLeague;
    roundId?: string;
    logicalRoundId?: string;
    leagueCumulativeThroughRoundId?: string;
  }
): Set<string> {
  const { teams } = data;
  const { displayLeague, roundId, logicalRoundId, leagueCumulativeThroughRoundId } = options;

  if (logicalRoundId) {
    const ids = new Set<string>();
    for (const rid of getLogicalRoundIds(data, logicalRoundId)) {
      const round = data.rounds.find((r) => r.id === rid);
      for (const teamId of round?.participatingTeamIds ?? []) {
        ids.add(teamId);
      }
    }
    return ids;
  }

  if (roundId && !leagueCumulativeThroughRoundId) {
    const round = data.rounds.find((r) => r.id === roundId);
    return new Set(round?.participatingTeamIds ?? []);
  }
  if (displayLeague) {
    return new Set(
      teams.filter((t) => getTeamDisplayLeague(data, t.id) === displayLeague).map((t) => t.id)
    );
  }
  return new Set(teams.map((t) => t.id));
}

export { getTeamDisplayLeague };
