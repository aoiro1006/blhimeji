/** ドキュメントキー: league / site / archive_{season} */

export type AppDocumentType = "league" | "site" | "archive";

export const LEAGUE_DOCUMENT_KEY = "league";
export const SITE_DOCUMENT_KEY = "site";

export function archiveDocumentKey(season: string): string {
  return `archive_${season}`;
}

export function parseArchiveSeason(documentKey: string): string | null {
  if (!documentKey.startsWith("archive_")) return null;
  const season = documentKey.slice("archive_".length);
  return season || null;
}

export function documentTypeFromKey(documentKey: string): AppDocumentType {
  if (documentKey === LEAGUE_DOCUMENT_KEY) return "league";
  if (documentKey === SITE_DOCUMENT_KEY) return "site";
  if (documentKey.startsWith("archive_")) return "archive";
  throw new Error(`不明な document_key です: ${documentKey}`);
}
