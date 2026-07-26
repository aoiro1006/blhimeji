import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  createArchiveFromCurrentSeason,
  deleteArchive,
  getArchiveDocumentVersion,
  listArchives,
  saveArchive,
} from "@/lib/archives";
import {
  generateRoundSchedule,
  deleteRound,
  finishRoundWithNews,
  getLeagueData,
  getLeagueDocumentVersion,
  saveMatches,
  saveNews,
  savePlayerAwards,
  saveReports,
  saveRoundAssignments,
  saveRounds,
  saveStandingsOverrides,
  saveTeams,
} from "@/lib/data";
import { DocumentConflictError } from "@/lib/documentStore";
import type {
  LeagueData,
  Match,
  NewsItem,
  Report,
  Round,
  RoundTeamAssignment,
  PlayerRoundAwards,
  SeasonArchive,
} from "@/types";

async function requireAuth() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  return null;
}

function conflictResponse(error: DocumentConflictError) {
  return NextResponse.json(
    { error: error.message, code: error.code },
    { status: 409 }
  );
}

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const data = await getLeagueData();
    const documentVersion = await getLeagueDocumentVersion();
    return NextResponse.json({ ...data, documentVersion });
  } catch (e) {
    const message = e instanceof Error ? e.message : "データの取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const body = await request.json();
  const { type, payload, expectedVersion } = body as {
    type:
      | "matches"
      | "news"
      | "reports"
      | "teams"
      | "rounds"
      | "roundAssignments"
      | "standingsOverrides"
      | "playerAwards"
      | "generateSchedule"
      | "deleteRound"
      | "finishRound"
      | "archive"
      | "deleteArchive"
      | "archiveSnapshot";
    payload?: unknown;
    roundId?: string;
    expectedVersion?: number;
  };

  try {
    if (type === "archive") {
      const archive = payload as SeasonArchive;
      const result = await saveArchive(archive, expectedVersion);
      const archives = await listArchives();
      return NextResponse.json({
        success: true,
        archives,
        documentVersion: result.documentVersion,
        season: archive.season,
      });
    }

    if (type === "deleteArchive") {
      const { season } = payload as { season: string };
      await deleteArchive(season);
      const archives = await listArchives();
      return NextResponse.json({ success: true, archives });
    }

    if (type === "archiveSnapshot") {
      const opts = payload as { season: string; title: string; summary?: string };
      const archive = await createArchiveFromCurrentSeason(opts);
      const existingVersion = await getArchiveDocumentVersion(opts.season);
      // 新規は 0、既存上書きはクライアント expectedVersion（未指定なら現行版）
      const expected =
        expectedVersion !== undefined
          ? expectedVersion
          : existingVersion === 0
            ? 0
            : existingVersion;
      const result = await saveArchive(archive, expected);
      const archives = await listArchives();
      return NextResponse.json({
        success: true,
        archive,
        archives,
        documentVersion: result.documentVersion,
        season: archive.season,
      });
    }

    if (typeof expectedVersion !== "number") {
      return NextResponse.json(
        { error: "expectedVersion が必要です" },
        { status: 400 }
      );
    }

    let result;
    switch (type) {
      case "matches":
        result = await saveMatches(payload as Match[], expectedVersion);
        break;
      case "news":
        result = await saveNews(payload as NewsItem[], expectedVersion);
        break;
      case "reports":
        result = await saveReports(payload as Report[], expectedVersion);
        break;
      case "teams":
        result = await saveTeams(payload as LeagueData["teams"], expectedVersion);
        break;
      case "rounds":
        result = await saveRounds(payload as Round[], expectedVersion);
        break;
      case "roundAssignments":
        result = await saveRoundAssignments(
          payload as RoundTeamAssignment[],
          expectedVersion
        );
        break;
      case "standingsOverrides":
        result = await saveStandingsOverrides(
          payload as LeagueData["standingsOverrides"],
          expectedVersion
        );
        break;
      case "playerAwards":
        result = await savePlayerAwards(
          payload as PlayerRoundAwards[],
          expectedVersion
        );
        break;
      case "generateSchedule": {
        const scope =
          (body as { scope?: "primary" | "additional" }).scope ??
          (payload as { scope?: "primary" | "additional" } | undefined)?.scope ??
          "primary";
        result = await generateRoundSchedule(
          body.roundId as string,
          scope,
          expectedVersion
        );
        break;
      }
      case "deleteRound":
        result = await deleteRound(body.roundId as string, expectedVersion);
        break;
      case "finishRound":
        result = await finishRoundWithNews(
          body.roundId as string,
          expectedVersion
        );
        break;
      default:
        return NextResponse.json({ error: "不明な更新タイプです" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      lastUpdated: result.lastUpdated,
      documentVersion: result.documentVersion,
    });
  } catch (e) {
    if (e instanceof DocumentConflictError) {
      return conflictResponse(e);
    }
    const message = e instanceof Error ? e.message : "保存に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
