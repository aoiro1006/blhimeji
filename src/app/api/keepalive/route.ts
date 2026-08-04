import { NextResponse } from "next/server";
import { LEAGUE_DOCUMENT_KEY } from "@/lib/documentKeys";
import {
  createServiceClient,
  isDocumentStoreEnabled,
} from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * Supabase Free の自動一時停止対策。
 * Vercel Cron から定期的に呼び、DB へ軽い SELECT を送る。
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!isDocumentStoreEnabled()) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "document_store_disabled",
    });
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("app_documents")
      .select("document_key, version, updated_at")
      .eq("document_key", LEAGUE_DOCUMENT_KEY)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      documentKey: data?.document_key ?? null,
      version: data?.version ?? null,
      updatedAt: data?.updated_at ?? null,
      at: new Date().toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "keepalive failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
