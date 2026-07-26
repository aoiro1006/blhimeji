import { getLeagueData } from "@/lib/data";
import { calculatePlayerSeasonStats, INDIVIDUAL_AWARD_COLUMNS } from "@/lib/playerAwards";
import PlayerAwardsStatsTable from "@/components/PlayerAwardsStatsTable";
import SectionTitle from "@/components/SectionTitle";

export const dynamic = "force-dynamic";

export const metadata = { title: "個人賞" };

export default async function AwardsPage() {
  const data = await getLeagueData();
  const groups = calculatePlayerSeasonStats(data);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <SectionTitle title="個人賞" subtitle={`${data.season}シーズン`} />

      <div className="mb-6 rounded-xl bg-primary-pale/50 border border-primary/10 px-4 py-3 text-sm text-gray-600">
        <p>出場した節をカウントします（欠席は除く）。</p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          {INDIVIDUAL_AWARD_COLUMNS.map((col) => (
            <li key={col.key}>
              <span className="font-medium text-gray-600">{col.shortLabel}</span> … {col.label}
            </li>
          ))}
        </ul>
      </div>

      <PlayerAwardsStatsTable groups={groups} />

      <p className="text-xs text-gray-400 mt-6 text-right">
        最終更新: {new Date(data.lastUpdated).toLocaleString("ja-JP")}
      </p>
    </div>
  );
}
