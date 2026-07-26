import { formatRoundName, normalizeRoundFields } from "@/lib/rounds";
import {
  getAdditionalAssignmentRoundId,
  getLogicalRoundIds,
  getLogicalRoundRoot,
  hasAdditionalMatches,
} from "@/lib/logicalRounds";
import { ADDITIONAL_MATCH_GROUPS, PRIMARY_MATCH_GROUPS } from "@/lib/matchGroups";
import { generateScheduledMatchesForGroups, reindexSlotOrder } from "@/lib/scheduling";
import { buildRoundResultsNewsItem } from "@/lib/roundResultsNews";
import {
  getDocument,
  LEAGUE_DOCUMENT_KEY,
  saveDocument,
} from "@/lib/documentStore";
import type {
  DisplayLeague,
  LeagueData,
  Match,
  MatchGroup,
  NewsItem,
  Report,
  Round,
  RoundTeamAssignment,
  StandingsOverride,
  Team,
  PlayerRoundAwards,
} from "@/types";

export type SaveResult = {
  lastUpdated: string;
  documentVersion: number;
};

let memoryCache: LeagueData | null = null;
let memoryVersion: number | null = null;

function ensureTeamDisplayLeagues(data: LeagueData): void {
  const half = Math.ceil(data.teams.length / 2);
  for (const team of data.teams) {
    if (!team.displayLeague) {
      team.displayLeague = (team.teamNumber <= half ? "A" : "B") as DisplayLeague;
    }
  }
}

function normalizeData(data: LeagueData): LeagueData {
  ensureTeamDisplayLeagues(data);
  data.rounds = data.rounds.map((r) => {
    const type = r.type ?? "league";
    const subNumber = r.subNumber ?? 1;
    const participatingTeamIds =
      r.participatingTeamIds?.length > 0
        ? r.participatingTeamIds
        : [
            ...new Set(
              data.roundAssignments
                .filter((a) => a.roundId === r.id)
                .map((a) => a.teamId)
            ),
          ];
    const round: Round = normalizeRoundFields({
      ...r,
      type,
      number: r.number ?? 1,
      subNumber,
      participatingTeamIds,
      name: r.name || formatRoundName({ ...r, type, subNumber, participatingTeamIds } as Round),
    });
    return round;
  });
  if (!data.playerAwards) {
    data.playerAwards = [];
  }
  return data;
}

async function readData(): Promise<LeagueData> {
  if (process.env.NODE_ENV === "development") {
    memoryCache = null;
    memoryVersion = null;
  }
  if (memoryCache) return memoryCache;

  const doc = await getDocument<LeagueData>(LEAGUE_DOCUMENT_KEY);
  if (!doc) {
    throw new Error(
      "league ドキュメントが見つかりません。data/league.json を配置するか、Supabase の app_documents に document_key=league を投入してください。"
    );
  }
  memoryCache = normalizeData(doc.payload);
  memoryVersion = doc.version;
  return memoryCache;
}

async function writeData(
  data: LeagueData,
  expectedVersion?: number
): Promise<SaveResult> {
  data.lastUpdated = new Date().toISOString();
  const normalized = normalizeData(data);
  try {
    const saved = await saveDocument(
      LEAGUE_DOCUMENT_KEY,
      normalized,
      expectedVersion
    );
    memoryCache = normalized;
    memoryVersion = saved.version;
    return { lastUpdated: data.lastUpdated, documentVersion: saved.version };
  } catch (error) {
    memoryCache = null;
    memoryVersion = null;
    throw error;
  }
}

export async function getLeagueData(): Promise<LeagueData> {
  return readData();
}

export async function getLeagueDocumentVersion(): Promise<number> {
  if (memoryVersion != null && memoryCache) return memoryVersion;
  const doc = await getDocument<LeagueData>(LEAGUE_DOCUMENT_KEY);
  if (!doc) {
    throw new Error("league ドキュメントが見つかりません");
  }
  memoryVersion = doc.version;
  return doc.version;
}

export async function saveTeams(
  teams: Team[],
  expectedVersion?: number
): Promise<SaveResult> {
  const data = await readData();
  data.teams = teams.map((t, i) => ({ ...t, teamNumber: i + 1 }));
  return writeData(data, expectedVersion);
}

export async function saveNews(
  news: NewsItem[],
  expectedVersion?: number
): Promise<SaveResult> {
  const data = await readData();
  data.news = news;
  return writeData(data, expectedVersion);
}

export async function saveReports(
  reports: Report[],
  expectedVersion?: number
): Promise<SaveResult> {
  const data = await readData();
  data.reports = reports;
  return writeData(data, expectedVersion);
}

export async function saveMatches(
  matches: Match[],
  expectedVersion?: number
): Promise<SaveResult> {
  const data = await readData();
  data.matches = matches.map((m) => ({ ...m }));
  return writeData(data, expectedVersion);
}

export async function saveRounds(
  rounds: Round[],
  expectedVersion?: number
): Promise<SaveResult> {
  const data = await readData();
  data.rounds = rounds.map((r) => ({
    ...r,
    name: r.type === "other" ? r.name : formatRoundName(r),
  }));
  return writeData(data, expectedVersion);
}

/** 節を終了し、試合結果更新のお知らせを自動追加 */
export async function finishRoundWithNews(
  roundId: string,
  expectedVersion?: number
): Promise<SaveResult> {
  const data = await readData();
  const index = data.rounds.findIndex((r) => r.id === roundId);
  if (index === -1) throw new Error("節が見つかりません");

  const round = data.rounds[index];
  if (round.resultsFinished) throw new Error("既に終了しています");

  const updated: Round = {
    ...round,
    resultsFinished: true,
    name: round.type === "other" ? round.name : formatRoundName({ ...round, resultsFinished: true }),
  };
  data.rounds[index] = updated;
  data.news = [buildRoundResultsNewsItem(updated), ...data.news];

  return writeData(data, expectedVersion);
}

/** 節と関連データを削除（論理節単位・取り消し不可） */
export async function deleteRound(
  roundId: string,
  expectedVersion?: number
): Promise<SaveResult> {
  const data = await readData();
  const idsToDelete = new Set(getLogicalRoundIds(data, roundId));

  if (idsToDelete.size === 0) {
    throw new Error("節が見つかりません");
  }

  const remaining = data.rounds.filter((r) => !idsToDelete.has(r.id));
  if (remaining.length === 0) {
    throw new Error("最後の節は削除できません");
  }

  data.rounds = remaining;
  data.matches = data.matches.filter((m) => !idsToDelete.has(m.roundId));
  data.roundAssignments = data.roundAssignments.filter((a) => !idsToDelete.has(a.roundId));
  data.playerAwards = data.playerAwards.filter((a) => !idsToDelete.has(a.roundId));

  return writeData(data, expectedVersion);
}

export async function saveRoundAssignments(
  assignments: RoundTeamAssignment[],
  expectedVersion?: number
): Promise<SaveResult> {
  const data = await readData();
  data.roundAssignments = assignments;
  return writeData(data, expectedVersion);
}

export async function saveStandingsOverrides(
  overrides: StandingsOverride[],
  expectedVersion?: number
): Promise<SaveResult> {
  const data = await readData();
  data.standingsOverrides = overrides;
  return writeData(data, expectedVersion);
}

export async function savePlayerAwards(
  awards: PlayerRoundAwards[],
  expectedVersion?: number
): Promise<SaveResult> {
  const data = await readData();
  data.playerAwards = awards.map((a) => ({ ...a }));
  return writeData(data, expectedVersion);
}

export type ScheduleGenerateScope = "primary" | "additional";

function getScheduleAssignments(
  data: LeagueData,
  roundId: string,
  round: Round,
  scope: ScheduleGenerateScope
): RoundTeamAssignment[] {
  const scopeGroups =
    scope === "primary" ? PRIMARY_MATCH_GROUPS : ADDITIONAL_MATCH_GROUPS;
  return data.roundAssignments.filter((a) => {
    if (a.roundId !== roundId || !scopeGroups.includes(a.group)) return false;
    if (PRIMARY_MATCH_GROUPS.includes(a.group)) {
      return round.participatingTeamIds.includes(a.teamId);
    }
    return true;
  });
}

function mergeGeneratedMatches(
  data: LeagueData,
  roundId: string,
  round: Round,
  scope: ScheduleGenerateScope
): Match[] {
  const scopeGroups =
    scope === "primary" ? PRIMARY_MATCH_GROUPS : ADDITIONAL_MATCH_GROUPS;
  const roundAssignments = getScheduleAssignments(data, roundId, round, scope);
  const newMatchTemplates = generateScheduledMatchesForGroups(
    roundId,
    roundAssignments,
    scopeGroups
  );
  const existingInScope = data.matches.filter(
    (m) => m.roundId === roundId && scopeGroups.includes(m.group)
  );

  const scoreMap = new Map<string, Match>();
  for (const m of existingInScope) {
    const key = `${m.group}:${[m.homeTeamId, m.awayTeamId].sort().join(":")}`;
    scoreMap.set(key, m);
  }

  const newMatches: Match[] = newMatchTemplates.map((tmpl) => {
    const key = `${tmpl.group}:${[tmpl.homeTeamId, tmpl.awayTeamId].sort().join(":")}`;
    const existing = scoreMap.get(key);
    return {
      ...tmpl,
      id: existing?.id ?? crypto.randomUUID(),
      homeScore: existing?.homeScore ?? null,
      awayScore: existing?.awayScore ?? null,
      status: existing?.status ?? "scheduled",
    };
  });

  const unchanged = data.matches.filter(
    (m) => !(m.roundId === roundId && scopeGroups.includes(m.group))
  );

  return [...unchanged, ...reindexSlotOrder(newMatches)];
}

export async function generateRoundSchedule(
  roundId: string,
  scope: ScheduleGenerateScope = "primary",
  expectedVersion?: number
): Promise<SaveResult> {
  const data = await readData();
  const root = getLogicalRoundRoot(data, roundId);
  if (!root) throw new Error("節が見つかりません");

  if (scope === "primary") {
    const round = data.rounds.find((r) => r.id === root.id);
    if (!round) throw new Error("節が見つかりません");
    data.matches = mergeGeneratedMatches(data, root.id, round, "primary");
  } else {
    if (!hasAdditionalMatches(root)) {
      throw new Error("追加試合が有効化されていません");
    }
    const additionalId = getAdditionalAssignmentRoundId(data, root.id);
    const round = data.rounds.find((r) => r.id === additionalId);
    if (!round) throw new Error("追加試合の節が見つかりません");
    data.matches = mergeGeneratedMatches(data, additionalId, round, "additional");
  }

  return writeData(data, expectedVersion);
}

export function invalidateCache(): void {
  memoryCache = null;
  memoryVersion = null;
}

export function getRoundById(data: LeagueData, roundId: string): Round | undefined {
  return data.rounds.find((r) => r.id === roundId);
}

export function getMatchesForRound(data: LeagueData, roundId: string): Match[] {
  return data.matches
    .filter((m) => m.roundId === roundId)
    .sort((a, b) => a.slotOrder - b.slotOrder);
}

export function getTeamsInGroup(
  data: LeagueData,
  roundId: string,
  group: MatchGroup
): Team[] {
  const teamIds = data.roundAssignments
    .filter((a) => a.roundId === roundId && a.group === group)
    .map((a) => a.teamId);
  return data.teams.filter((t) => teamIds.includes(t.id));
}
