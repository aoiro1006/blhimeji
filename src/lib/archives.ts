import { calculateStandings } from "@/lib/standings";
import {
  archiveDocumentKey,
  deleteDocument,
  getDocument,
  listDocumentKeys,
  saveDocument,
} from "@/lib/documentStore";
import type {
  ArchivedStanding,
  GalleryImage,
  SeasonArchive,
  SeasonArchiveSummary,
  TeamStanding,
} from "@/types";

function serializeStandings(standings: TeamStanding[]): ArchivedStanding[] {
  return standings.map((s) => ({
    rank: s.rank,
    team: {
      teamNumber: s.team.teamNumber,
      name: s.team.name,
      shortName: s.team.shortName,
      color: s.team.color,
    },
    rankingPoints: s.rankingPoints,
    played: s.played,
    wins: s.wins,
    losses: s.losses,
    pointsFor: s.pointsFor,
    pointsAgainst: s.pointsAgainst,
    pointDiff: s.pointDiff,
  }));
}

export function archivedToTeamStandings(archived: ArchivedStanding[]): TeamStanding[] {
  return archived.map((s) => ({
    rank: s.rank,
    team: {
      id: `archive-${s.team.teamNumber}-${s.team.shortName}`,
      teamNumber: s.team.teamNumber,
      name: s.team.name,
      shortName: s.team.shortName,
      color: s.team.color,
      players: [],
    },
    rankingPoints: s.rankingPoints,
    played: s.played,
    wins: s.wins,
    losses: s.losses,
    draws: 0,
    pointsFor: s.pointsFor,
    pointsAgainst: s.pointsAgainst,
    pointDiff: s.pointDiff,
    winRate: s.played > 0 ? s.wins / s.played : 0,
  }));
}

function normalizeArchive(archive: SeasonArchive): SeasonArchive {
  return {
    ...archive,
    gallery: [...archive.gallery]
      .map((img, i) => ({ ...img, sortOrder: img.sortOrder ?? i }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
    finalizedAt: archive.finalizedAt || new Date().toISOString(),
  };
}

export async function listArchives(): Promise<SeasonArchiveSummary[]> {
  const keys = await listDocumentKeys("archive");
  const archives: SeasonArchiveSummary[] = [];
  for (const key of keys) {
    const doc = await getDocument<SeasonArchive>(key);
    if (!doc) continue;
    const archive = doc.payload;
    archives.push({
      season: archive.season,
      title: archive.title,
      summary: archive.summary,
      coverImageUrl: archive.coverImageUrl ?? archive.gallery[0]?.url,
      finalizedAt: archive.finalizedAt,
    });
  }
  return archives.sort((a, b) => b.season.localeCompare(a.season));
}

export async function getArchive(season: string): Promise<SeasonArchive | null> {
  const doc = await getDocument<SeasonArchive>(archiveDocumentKey(season));
  if (!doc) return null;
  return normalizeArchive(doc.payload);
}

export async function getArchiveDocumentVersion(season: string): Promise<number> {
  const doc = await getDocument<SeasonArchive>(archiveDocumentKey(season));
  return doc?.version ?? 0;
}

export async function saveArchive(
  archive: SeasonArchive,
  expectedVersion?: number
): Promise<{ documentVersion: number }> {
  const normalized = normalizeArchive(archive);
  const key = archiveDocumentKey(normalized.season);
  const current = await getDocument<SeasonArchive>(key);
  const expected = expectedVersion ?? current?.version ?? 0;
  const saved = await saveDocument(key, normalized, expected);
  return { documentVersion: saved.version };
}

export async function deleteArchive(season: string): Promise<void> {
  await deleteDocument(archiveDocumentKey(season));
}

export async function createArchiveFromCurrentSeason(options: {
  season: string;
  title: string;
  summary?: string;
  coverImageUrl?: string;
}): Promise<SeasonArchive> {
  const { getLeagueData } = await import("@/lib/data");
  const data = await getLeagueData();
  const standingsA = calculateStandings(data, { displayLeague: "A", leagueOnly: true });
  const standingsB = calculateStandings(data, { displayLeague: "B", leagueOnly: true });

  return {
    season: options.season,
    title: options.title,
    summary: options.summary,
    coverImageUrl: options.coverImageUrl,
    finalizedAt: new Date().toISOString(),
    standings: {
      leagueA: serializeStandings(standingsA),
      leagueB: serializeStandings(standingsB),
    },
    gallery: [],
  };
}

export function createEmptyArchive(season: string, title: string): SeasonArchive {
  return {
    season,
    title,
    summary: "",
    finalizedAt: new Date().toISOString(),
    standings: { leagueA: [], leagueB: [] },
    gallery: [],
  };
}

export function sortGalleryImages(gallery: GalleryImage[]): GalleryImage[] {
  return [...gallery].sort((a, b) => a.sortOrder - b.sortOrder);
}
