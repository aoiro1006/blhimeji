import { NextResponse } from "next/server";
import {
  getArchive,
  getArchiveDocumentVersion,
  listArchives,
} from "@/lib/archives";
import { isAuthenticated } from "@/lib/auth";
import type { SeasonArchive } from "@/types";

async function requireAuth() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const summaries = await listArchives();
    const archives: SeasonArchive[] = [];
    const versions: Record<string, number> = {};
    for (const summary of summaries) {
      const archive = await getArchive(summary.season);
      if (archive) {
        archives.push(archive);
        versions[summary.season] = await getArchiveDocumentVersion(summary.season);
      }
    }
    return NextResponse.json({ archives, versions });
  } catch (e) {
    const message = e instanceof Error ? e.message : "アーカイブの取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
