import { promises as fs } from "fs";
import path from "path";
import {
  archiveDocumentKey,
  documentTypeFromKey,
  LEAGUE_DOCUMENT_KEY,
  parseArchiveSeason,
  SITE_DOCUMENT_KEY,
  type AppDocumentType,
} from "@/lib/documentKeys";
import {
  createServiceClient,
  isDocumentStoreEnabled,
} from "@/lib/supabase/service";
import { peekExpectedDocumentVersion } from "@/lib/documentWriteContext";

export class DocumentConflictError extends Error {
  readonly code = "DOCUMENT_CONFLICT" as const;
  constructor() {
    super(
      "他のユーザーが更新しました。最新版を読み込み、内容を確認してから再度保存してください。"
    );
    this.name = "DocumentConflictError";
  }
}

export type DocumentRecord<T> = {
  documentKey: string;
  documentType: AppDocumentType;
  season: string | null;
  payload: T;
  version: number;
  updatedAt: string;
};

type VersionsFile = Record<string, number>;

const DATA_DIR = path.join(process.cwd(), "data");
const VERSIONS_PATH = path.join(DATA_DIR, "document-versions.json");

function seasonForKey(documentKey: string): string | null {
  return parseArchiveSeason(documentKey);
}

function filePathForKey(documentKey: string): string {
  if (documentKey === LEAGUE_DOCUMENT_KEY) {
    return path.join(DATA_DIR, "league.json");
  }
  if (documentKey === SITE_DOCUMENT_KEY) {
    return path.join(DATA_DIR, "site.json");
  }
  const season = parseArchiveSeason(documentKey);
  if (season) {
    return path.join(DATA_DIR, "archives", `${season}.json`);
  }
  throw new Error(`不明な document_key です: ${documentKey}`);
}

async function ensureDir(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function readVersions(): Promise<VersionsFile> {
  try {
    const raw = await fs.readFile(VERSIONS_PATH, "utf-8");
    return JSON.parse(raw) as VersionsFile;
  } catch {
    return {};
  }
}

async function writeVersions(versions: VersionsFile): Promise<void> {
  await ensureDir(VERSIONS_PATH);
  await fs.writeFile(VERSIONS_PATH, JSON.stringify(versions, null, 2), "utf-8");
}

async function fileGetDocument<T>(
  documentKey: string
): Promise<DocumentRecord<T> | null> {
  const filePath = filePathForKey(documentKey);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const payload = JSON.parse(raw) as T;
    const versions = await readVersions();
    const version = versions[documentKey] ?? 1;
    const stat = await fs.stat(filePath);
    return {
      documentKey,
      documentType: documentTypeFromKey(documentKey),
      season: seasonForKey(documentKey),
      payload,
      version,
      updatedAt: stat.mtime.toISOString(),
    };
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return null;
    throw err;
  }
}

async function fileSaveDocument<T>(
  documentKey: string,
  payload: T,
  expectedVersion: number | undefined
): Promise<DocumentRecord<T>> {
  const documentType = documentTypeFromKey(documentKey);
  const season = seasonForKey(documentKey);
  const versions = await readVersions();
  const current = await fileGetDocument<T>(documentKey);
  const currentVersion = current?.version ?? 0;

  if (expectedVersion !== undefined && expectedVersion !== currentVersion) {
    throw new DocumentConflictError();
  }

  const filePath = filePathForKey(documentKey);
  await ensureDir(filePath);
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf-8");

  const nextVersion = currentVersion + 1;
  versions[documentKey] = nextVersion;
  await writeVersions(versions);

  return {
    documentKey,
    documentType,
    season,
    payload,
    version: nextVersion,
    updatedAt: new Date().toISOString(),
  };
}

async function fileListByType(
  documentType: AppDocumentType
): Promise<string[]> {
  if (documentType === "league") return [LEAGUE_DOCUMENT_KEY];
  if (documentType === "site") return [SITE_DOCUMENT_KEY];
  const archivesDir = path.join(DATA_DIR, "archives");
  try {
    const files = await fs.readdir(archivesDir);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => archiveDocumentKey(f.replace(/\.json$/, "")))
      .sort();
  } catch {
    return [];
  }
}

async function fileDeleteDocument(documentKey: string): Promise<void> {
  const filePath = filePathForKey(documentKey);
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
  const versions = await readVersions();
  delete versions[documentKey];
  await writeVersions(versions);
}

async function supabaseGetDocument<T>(
  documentKey: string
): Promise<DocumentRecord<T> | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("app_documents")
    .select("document_key, document_type, season, payload, version, updated_at")
    .eq("document_key", documentKey)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    documentKey: data.document_key as string,
    documentType: data.document_type as AppDocumentType,
    season: (data.season as string | null) ?? null,
    payload: data.payload as T,
    version: data.version as number,
    updatedAt: data.updated_at as string,
  };
}

async function supabaseSaveDocument<T>(
  documentKey: string,
  payload: T,
  expectedVersion: number | undefined
): Promise<DocumentRecord<T>> {
  const supabase = createServiceClient();
  const documentType = documentTypeFromKey(documentKey);
  const season = seasonForKey(documentKey);
  const current = await supabaseGetDocument<T>(documentKey);
  const currentVersion = current?.version ?? 0;
  // expectedVersion 未指定時のみ現行版を使う（管理APIは必ず明示すること）
  const expected =
    expectedVersion !== undefined ? expectedVersion : currentVersion;

  if (expected !== currentVersion) {
    throw new DocumentConflictError();
  }

  const { data, error } = await supabase.rpc("save_app_document", {
    p_document_key: documentKey,
    p_document_type: documentType,
    p_season: season,
    p_payload: payload,
    p_expected_version: expected,
  });

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || row.new_version == null) {
    throw new DocumentConflictError();
  }

  return {
    documentKey,
    documentType,
    season,
    payload,
    version: row.new_version as number,
    updatedAt: (row.new_updated_at as string) ?? new Date().toISOString(),
  };
}

async function supabaseListByType(
  documentType: AppDocumentType
): Promise<string[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("app_documents")
    .select("document_key")
    .eq("document_type", documentType)
    .order("document_key");

  if (error) throw error;
  return (data ?? []).map((r) => r.document_key as string);
}

async function supabaseDeleteDocument(documentKey: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("app_documents")
    .delete()
    .eq("document_key", documentKey);
  if (error) throw error;
}

export async function getDocument<T>(
  documentKey: string
): Promise<DocumentRecord<T> | null> {
  if (isDocumentStoreEnabled()) {
    return supabaseGetDocument<T>(documentKey);
  }
  return fileGetDocument<T>(documentKey);
}

/**
 * ドキュメントを保存する。
 * expectedVersion 未指定時は documentWriteContext の値、それも無ければ現在版を想定（単一編集向け）。
 * 管理APIからは明示的に expectedVersion を渡すこと。
 */
export async function saveDocument<T>(
  documentKey: string,
  payload: T,
  expectedVersion?: number
): Promise<DocumentRecord<T>> {
  const expected =
    expectedVersion !== undefined
      ? expectedVersion
      : peekExpectedDocumentVersion();

  if (isDocumentStoreEnabled()) {
    return supabaseSaveDocument(documentKey, payload, expected);
  }
  return fileSaveDocument(documentKey, payload, expected);
}

export async function listDocumentKeys(
  documentType: AppDocumentType
): Promise<string[]> {
  if (isDocumentStoreEnabled()) {
    return supabaseListByType(documentType);
  }
  return fileListByType(documentType);
}

export async function deleteDocument(documentKey: string): Promise<void> {
  if (isDocumentStoreEnabled()) {
    return supabaseDeleteDocument(documentKey);
  }
  return fileDeleteDocument(documentKey);
}

export { LEAGUE_DOCUMENT_KEY, SITE_DOCUMENT_KEY, archiveDocumentKey };
