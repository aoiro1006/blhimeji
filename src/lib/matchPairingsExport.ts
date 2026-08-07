import { formatRoundDisplayName } from "@/lib/rounds";
import type { LeagueData, Match, Team } from "@/types";

export interface MatchPairingExportRow {
  index: number;
  homeTeam: Team;
  awayTeam: Team;
  /** この節の対戦表における、対戦Aチームの何試合目か */
  homeAppearance: number;
  /** この節の対戦表における、対戦Bチームの何試合目か */
  awayAppearance: number;
}

export interface MatchPairingsExportContent {
  season: string;
  roundLabel: string;
  roundDate?: string;
  rows: MatchPairingExportRow[];
}

export function getMatchPairingsExportContent(
  data: LeagueData,
  roundId: string,
  matches: Match[]
): MatchPairingsExportContent {
  const round = data.rounds.find((r) => r.id === roundId);
  const teamMap = new Map(data.teams.map((t) => [t.id, t]));

  const sorted = [...matches]
    .filter((m) => m.roundId === roundId)
    .sort((a, b) => a.slotOrder - b.slotOrder);

  const rows: MatchPairingExportRow[] = [];
  const appearanceCount = new Map<string, number>();

  sorted.forEach((match, i) => {
    const homeTeam = teamMap.get(match.homeTeamId);
    const awayTeam = teamMap.get(match.awayTeamId);
    if (!homeTeam || !awayTeam) return;

    const homeAppearance = (appearanceCount.get(match.homeTeamId) ?? 0) + 1;
    const awayAppearance = (appearanceCount.get(match.awayTeamId) ?? 0) + 1;
    appearanceCount.set(match.homeTeamId, homeAppearance);
    appearanceCount.set(match.awayTeamId, awayAppearance);

    rows.push({
      index: i + 1,
      homeTeam,
      awayTeam,
      homeAppearance,
      awayAppearance,
    });
  });

  return {
    season: data.season,
    roundLabel: round ? formatRoundDisplayName(round) : "対戦表",
    roundDate: round?.date,
    rows,
  };
}

export function buildMatchPairingsExportFilename(data: LeagueData, roundId: string): string {
  return `${buildMatchPairingsExportBasename(data, roundId)}.jpg`;
}

export function buildMatchPairingsPdfFilename(data: LeagueData, roundId: string): string {
  return `${buildMatchPairingsExportBasename(data, roundId)}.pdf`;
}

function buildMatchPairingsExportBasename(data: LeagueData, roundId: string): string {
  const round = data.rounds.find((r) => r.id === roundId);
  const roundPart = round
    ? round.type === "league" && round.number > 0
      ? `round${round.number}${round.subNumber > 1 ? `-${round.subNumber}` : ""}`
      : round.id.slice(0, 8)
    : "pairings";
  return `boccia-himeji-${data.season}-pairings-${roundPart}`;
}

/** チームカラー背景に合わせた文字色 */
export function getContrastTextColor(hex: string): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return "#1f2937";
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1f2937" : "#ffffff";
}
