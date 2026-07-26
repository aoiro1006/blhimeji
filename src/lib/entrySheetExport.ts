import { getLogicalRoundIds, getLogicalRoundRoot } from "@/lib/logicalRounds";
import { formatRoundDisplayName } from "@/lib/rounds";
import type { LeagueData, PlayerRoundAwards, Round, Team } from "@/types";

/** 1チームあたりの選手枠数 */
export const ENTRY_SHEET_PLAYER_SLOTS = 8;

/** A3縦 1ページあたりの列数（チームブロック） */
export const ENTRY_SHEET_GRID_COLUMNS = 3;

/** A3縦 1ページに載せるチーム数（3列 × 5行 — 6行目以降は用紙からはみ出すため） */
export const ENTRY_SHEET_TEAMS_PER_PAGE = 15;

/** A3縦（297×420mm）@ 96dpi — html-to-image 用 */
export const ENTRY_SHEET_PAGE_WIDTH_PX = 1122;
export const ENTRY_SHEET_PAGE_HEIGHT_PX = 1587;

export interface EntrySheetPlayerSlot {
  number: number;
  name: string;
}

export interface EntrySheetTeamBlock {
  index: number;
  team: Team;
  isEntry: boolean;
  slots: EntrySheetPlayerSlot[];
}

export interface EntrySheetPage {
  pageNumber: number;
  totalPages: number;
  teams: EntrySheetTeamBlock[];
}

export interface EntrySheetExportContent {
  season: string;
  roundLabel: string;
  roundDate?: string;
  pages: EntrySheetPage[];
}

function buildPlayerSlots(team: Team): EntrySheetPlayerSlot[] {
  const registered = team.players.filter((p) => p.name.trim());
  const slots: EntrySheetPlayerSlot[] = [];

  for (let i = 0; i < ENTRY_SHEET_PLAYER_SLOTS; i++) {
    const player = registered[i];
    slots.push({
      number: i + 1,
      name: player?.name ?? "",
    });
  }

  return slots;
}

/** 追加試合用の複製チーム（shortName が ② で終わる） */
export function isDuplicateMarkTeam(team: Team): boolean {
  return team.shortName.endsWith("②");
}

/** 公開サイトの参加チーム一覧用：②付き複製チームを除外 */
export function filterTeamsForPublicDisplay(teams: Team[]): Team[] {
  return teams.filter((t) => !isDuplicateMarkTeam(t));
}

/** 追加試合用の複製チーム（②）などを除外し、同名は teamNumber が小さい方のみ */
export function filterTeamsForEntrySheet(teams: Team[]): Team[] {
  const withoutDuplicates = filterTeamsForPublicDisplay(teams);

  const byName = new Map<string, Team>();
  for (const team of [...withoutDuplicates].sort((a, b) => a.teamNumber - b.teamNumber)) {
    const key = team.name.trim();
    if (!byName.has(key)) byName.set(key, team);
  }

  return [...byName.values()];
}

function sortTeamsForEntrySheet(teams: Team[], entryTeamIds: Set<string>): Team[] {
  return [...teams].sort((a, b) => {
    const aEntry = entryTeamIds.has(a.id);
    const bEntry = entryTeamIds.has(b.id);
    if (aEntry !== bEntry) return aEntry ? -1 : 1;
    return a.teamNumber - b.teamNumber;
  });
}

function paginateTeams(teams: EntrySheetTeamBlock[]): EntrySheetPage[] {
  if (teams.length === 0) return [];

  const totalPages = Math.ceil(teams.length / ENTRY_SHEET_TEAMS_PER_PAGE);
  const pages: EntrySheetPage[] = [];

  for (let page = 0; page < totalPages; page++) {
    const slice = teams.slice(
      page * ENTRY_SHEET_TEAMS_PER_PAGE,
      (page + 1) * ENTRY_SHEET_TEAMS_PER_PAGE
    );
    pages.push({
      pageNumber: page + 1,
      totalPages,
      teams: slice,
    });
  }

  return pages;
}

export function getEntrySheetExportContent(
  data: LeagueData,
  roundId: string,
  _editedAwards: PlayerRoundAwards[] = []
): EntrySheetExportContent {
  const root = getLogicalRoundRoot(data, roundId);
  const round = root ?? data.rounds.find((r) => r.id === roundId);
  const logicalRoundIds = getLogicalRoundIds(data, roundId);

  const entryTeamIds = new Set<string>();
  for (const rid of logicalRoundIds) {
    const r = data.rounds.find((x) => x.id === rid);
    for (const teamId of r?.participatingTeamIds ?? []) {
      entryTeamIds.add(teamId);
    }
  }

  const sortedTeams = sortTeamsForEntrySheet(
    filterTeamsForEntrySheet(data.teams),
    entryTeamIds
  );
  const teamBlocks: EntrySheetTeamBlock[] = sortedTeams.map((team, i) => ({
    index: i + 1,
    team,
    isEntry: entryTeamIds.has(team.id),
    slots: buildPlayerSlots(team),
  }));

  return {
    season: data.season,
    roundLabel: round ? formatRoundDisplayName(round) : "エントリー表",
    roundDate: round?.date,
    pages: paginateTeams(teamBlocks),
  };
}

function buildEntrySheetRoundPart(data: LeagueData, round: Round | undefined): string {
  if (round && round.type === "league" && round.number > 0) {
    return `round${round.number}${round.subNumber > 1 ? `-${round.subNumber}` : ""}`;
  }
  return round?.id.slice(0, 8) ?? "entry";
}

export function buildEntrySheetExportFilename(
  data: LeagueData,
  round: Round | undefined,
  pageNumber: number,
  totalPages: number
): string {
  const pagePart = totalPages > 1 ? `-p${pageNumber}` : "";
  return `boccia-himeji-${data.season}-entry-${buildEntrySheetRoundPart(data, round)}${pagePart}.jpg`;
}

export function buildEntrySheetPdfFilename(data: LeagueData, round: Round | undefined): string {
  return `boccia-himeji-${data.season}-entry-${buildEntrySheetRoundPart(data, round)}.pdf`;
}

/** A3縦（mm） */
export const ENTRY_SHEET_A3_WIDTH_MM = 297;
export const ENTRY_SHEET_A3_HEIGHT_MM = 420;
