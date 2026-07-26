"use client";

import { useState } from "react";
import type { TeamStanding } from "@/types";
import StandingsPointModal from "@/components/StandingsPointModal";
import TeamStatsModal from "@/components/TeamStatsModal";

interface StandingsTableProps {
  standings: TeamStanding[];
  compact?: boolean;
  showPointDetails?: boolean;
  /** 本節・当日順位用：ポイント列を非表示 */
  hidePointsColumn?: boolean;
  /** 共有画像用：詳細ボタンなし・省略なし・簡易列 */
  exportMode?: boolean;
}

function RankBadge({ rank }: { rank: number }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-bold shadow-sm ${
        rank === 1
          ? "bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900"
          : rank === 2
            ? "bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700"
            : rank === 3
              ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white"
              : "bg-white border-2 border-gray-200 text-gray-500"
      }`}
    >
      {rank}
    </span>
  );
}

function DetailButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors whitespace-nowrap"
    >
      詳細
    </button>
  );
}

export default function StandingsTable({
  standings,
  compact = false,
  showPointDetails = false,
  hidePointsColumn = false,
  exportMode = false,
}: StandingsTableProps) {
  const [pointDetailStanding, setPointDetailStanding] = useState<TeamStanding | null>(null);
  const [teamStatsStanding, setTeamStatsStanding] = useState<TeamStanding | null>(null);

  if (standings.length === 0) {
    return <p className="text-gray-500 text-sm">順位はまだありません</p>;
  }

  const hasDetailColumn =
    !exportMode && showPointDetails && standings.some((s) => s.pointBreakdown);
  const showPointsColumn = !exportMode && !hidePointsColumn;
  const showScoreColumns = !exportMode;
  const showMobileDetail = !exportMode;

  const teamDisplayName = (s: TeamStanding) =>
    exportMode ? s.team.name : compact ? s.team.shortName : s.team.name;

  const teamMobileName = (s: TeamStanding) => s.team.shortName || s.team.name;

  return (
    <>
      <div className={exportMode ? "" : "sm:overflow-x-auto"}>
        <table
          className={`w-full text-sm ${exportMode ? "table-auto" : "table-fixed sm:table-auto"}`}
        >
          <thead>
            <tr className="bg-gradient-to-r from-primary to-primary-light text-white">
              <th className="text-left py-2.5 sm:py-3 px-2 sm:px-3 font-semibold w-10 sm:w-12 rounded-tl-lg">
                順位
              </th>
              <th className="text-left py-2.5 sm:py-3 px-2 font-semibold min-w-0">チーム</th>
              {showPointsColumn && (
                <th className="text-center py-2.5 sm:py-3 px-1 sm:px-2 font-semibold w-12 sm:w-16 whitespace-nowrap">
                  {exportMode ? "P" : "ポイント"}
                </th>
              )}
              {showMobileDetail && (
                <th
                  className={`sm:hidden text-center py-2.5 px-1 font-semibold w-14 ${
                    !showScoreColumns && !hasDetailColumn ? "rounded-tr-lg" : ""
                  }`}
                >
                  詳細
                </th>
              )}
              <th className="hidden sm:table-cell text-center py-3 px-2 font-semibold w-12 whitespace-nowrap">
                {exportMode ? "試" : "試合"}
              </th>
              <th className="hidden sm:table-cell text-center py-3 px-2 font-semibold w-12">
                勝
              </th>
              <th className="hidden sm:table-cell text-center py-3 px-2 font-semibold w-12">
                敗
              </th>
              {showScoreColumns && (
                <>
                  <th className="hidden sm:table-cell text-center py-3 px-2 font-semibold w-14">
                    得点
                  </th>
                  <th className="hidden sm:table-cell text-center py-3 px-2 font-semibold w-14">
                    失点
                  </th>
                </>
              )}
              <th
                className={`hidden sm:table-cell text-center py-3 px-2 font-semibold w-14 whitespace-nowrap ${
                  !hasDetailColumn ? "rounded-tr-lg" : ""
                }`}
              >
                得失
              </th>
              {hasDetailColumn && (
                <th className="hidden sm:table-cell text-center py-3 px-2 font-semibold w-16 rounded-tr-lg">
                  詳細
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => (
              <tr
                key={s.team.id}
                className={`border-b border-gray-100 ${
                  exportMode ? "" : "transition-colors hover:bg-primary-pale/40"
                } ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
              >
                <td className="py-2 sm:py-3 px-2 sm:px-3 align-middle">
                  <RankBadge rank={s.rank} />
                </td>
                <td className="py-2 sm:py-3 px-2 align-middle min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <span
                      className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full flex-shrink-0 shadow-sm ring-2 ring-white"
                      style={{ backgroundColor: s.team.color }}
                    />
                    {exportMode ? (
                      <span className="font-semibold text-gray-800 whitespace-nowrap">
                        {teamDisplayName(s)}
                      </span>
                    ) : (
                      <>
                        <span
                          className="sm:hidden font-semibold text-gray-800 text-left min-w-0 line-clamp-2 leading-snug text-xs"
                          title={s.team.name}
                        >
                          {teamMobileName(s)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setTeamStatsStanding(s)}
                          className="hidden sm:inline font-semibold text-gray-800 text-left hover:text-primary hover:underline underline-offset-2 transition-colors"
                        >
                          {teamDisplayName(s)}
                        </button>
                      </>
                    )}
                  </div>
                </td>
                {showPointsColumn && (
                  <td className="text-center py-2 sm:py-3 px-1 sm:px-2 font-bold text-primary align-middle tabular-nums text-sm">
                    {Math.round(s.rankingPoints)}
                  </td>
                )}
                {showMobileDetail && (
                  <td className="sm:hidden text-center py-2 px-1 align-middle">
                    <DetailButton onClick={() => setPointDetailStanding(s)} />
                  </td>
                )}
                <td className="hidden sm:table-cell text-center py-3 px-2 text-gray-500 align-middle">
                  {s.played}
                </td>
                <td className="hidden sm:table-cell text-center py-3 px-2 font-bold text-primary align-middle">
                  {s.wins}
                </td>
                <td className="hidden sm:table-cell text-center py-3 px-2 font-bold text-accent align-middle">
                  {s.losses}
                </td>
                {showScoreColumns && (
                  <>
                    <td className="hidden sm:table-cell text-center py-3 px-2 text-gray-600 align-middle">
                      {s.pointsFor}
                    </td>
                    <td className="hidden sm:table-cell text-center py-3 px-2 text-gray-600 align-middle">
                      {s.pointsAgainst}
                    </td>
                  </>
                )}
                <td
                  className={`hidden sm:table-cell text-center py-3 px-2 font-bold align-middle ${
                    s.pointDiff > 0
                      ? "text-primary"
                      : s.pointDiff < 0
                        ? "text-accent"
                        : "text-gray-400"
                  }`}
                >
                  {s.pointDiff > 0 ? `+${s.pointDiff}` : s.pointDiff}
                </td>
                {hasDetailColumn && (
                  <td className="hidden sm:table-cell text-center py-3 px-2 align-middle">
                    {s.pointBreakdown ? (
                      <DetailButton onClick={() => setPointDetailStanding(s)} />
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!exportMode && (
        <>
          <TeamStatsModal
            standing={teamStatsStanding}
            onClose={() => setTeamStatsStanding(null)}
          />
          <StandingsPointModal
            standing={pointDetailStanding}
            onClose={() => setPointDetailStanding(null)}
            hidePoints={hidePointsColumn}
          />
        </>
      )}
    </>
  );
}
