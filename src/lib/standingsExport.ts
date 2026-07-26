import { getLogicalRoundIds } from "@/lib/logicalRounds";
import { calculateRoundDayStandings, calculateStandings } from "@/lib/standings";
import { formatRoundDisplayName, isActiveLeagueRound } from "@/lib/rounds";
import type { DisplayLeague, LeagueData, Match, TeamStanding } from "@/types";

export interface StandingsExportSection {
  label: string;
  league?: DisplayLeague;
  standings: TeamStanding[];
}

export interface StandingsExportContent {
  title: string;
  subtitle: string;
  roundDate?: string;
  sections: StandingsExportSection[];
}

export function buildPreviewLeagueData(
  data: LeagueData,
  roundId: string,
  editedMatches: Match[]
): LeagueData {
  const logicalIds = new Set(getLogicalRoundIds(data, roundId));
  const otherMatches = data.matches.filter((m) => !logicalIds.has(m.roundId));
  return {
    ...data,
    matches: [...otherMatches, ...editedMatches],
  };
}

export function getStandingsExportContent(
  data: LeagueData,
  roundId: string
): StandingsExportContent {
  const round = data.rounds.find((r) => r.id === roundId);
  if (!round) {
    return { title: "順位表", subtitle: "", sections: [] };
  }

  if (isActiveLeagueRound(round)) {
    const roundLabel = formatRoundDisplayName(round);
    return {
      title: `${data.season}シーズン 順位表`,
      subtitle: `${roundLabel}まで（累計）`,
      roundDate: round.date,
      sections: (["A", "B"] as DisplayLeague[])
        .map((league) => ({
          label: `${league}リーグ`,
          league,
          standings: calculateStandings(data, {
            displayLeague: league,
            leagueCumulativeThroughRoundId: roundId,
          }),
        }))
        .filter((s) => s.standings.length > 0),
    };
  }

  return {
    title: formatRoundDisplayName(round),
    subtitle: `${data.season}シーズン — 当日順位`,
    roundDate: round.date,
    sections: [
      {
        label: "",
        standings: calculateRoundDayStandings(data, roundId),
      },
    ].filter((s) => s.standings.length > 0),
  };
}

export function buildStandingsExportFilename(data: LeagueData, roundId: string): string {
  const round = data.rounds.find((r) => r.id === roundId);
  const roundPart = round
    ? isActiveLeagueRound(round)
      ? `round${round.number}${round.subNumber > 1 ? `-${round.subNumber}` : ""}`
      : round.id.slice(0, 8)
    : "standings";
  return `boccia-himeji-${data.season}-standings-${roundPart}.jpg`;
}

/** 試合結果入力画面の「現在の成績」プレビュー用 */
export interface ResultsStandingsPreview {
  roundLabel: string;
  isLeagueRound: boolean;
  /** 本節の順位 */
  roundSections: StandingsExportSection[];
  /** 累計順位（リーグ節のみ） */
  cumulativeSections: StandingsExportSection[];
}

export function getResultsStandingsPreview(
  data: LeagueData,
  roundId: string
): ResultsStandingsPreview {
  const round = data.rounds.find((r) => r.id === roundId);
  if (!round) {
    return { roundLabel: "", isLeagueRound: false, roundSections: [], cumulativeSections: [] };
  }

  const roundLabel = formatRoundDisplayName(round);

  if (isActiveLeagueRound(round)) {
    const roundStandings = calculateRoundDayStandings(data, roundId);
    const roundSections: StandingsExportSection[] =
      roundStandings.length > 0
        ? [{ label: `${roundLabel}の成績`, standings: roundStandings }]
        : [];

    const cumulativeSections = (["A", "B"] as DisplayLeague[])
      .map((league) => ({
        label: `${league}リーグ`,
        league,
        standings: calculateStandings(data, {
          displayLeague: league,
          leagueCumulativeThroughRoundId: roundId,
        }),
      }))
      .filter((s) => s.standings.length > 0);

    return { roundLabel, isLeagueRound: true, roundSections, cumulativeSections };
  }

  const dayStandings = calculateRoundDayStandings(data, roundId);
  return {
    roundLabel,
    isLeagueRound: false,
    roundSections:
      dayStandings.length > 0
        ? [{ label: `${roundLabel}の成績`, standings: dayStandings }]
        : [],
    cumulativeSections: [],
  };
}
