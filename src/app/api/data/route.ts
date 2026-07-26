import { NextResponse } from "next/server";
import { getLeagueData } from "@/lib/data";
import { calculateStandings } from "@/lib/standings";

export async function GET() {
  try {
    const data = await getLeagueData();
    const standings = calculateStandings(data);

    return NextResponse.json({
      season: data.season,
      lastUpdated: data.lastUpdated,
      teams: data.teams,
      matches: data.matches,
      news: data.news,
      reports: data.reports,
      standings,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "データの取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
