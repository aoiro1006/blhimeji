import type { LeagueData, Match, Team } from "@/types";
import { formatDate, getRoundLabel, getTeamById } from "@/lib/standings";

interface MatchListProps {
  matches: Match[];
  teams: Team[];
  data: LeagueData;
  limit?: number;
}

export default function MatchList({ matches, teams, data, limit }: MatchListProps) {
  const sorted = [...matches].sort((a, b) => a.slotOrder - b.slotOrder);
  const displayMatches = limit ? sorted.slice(0, limit) : sorted;

  if (displayMatches.length === 0) {
    return <p className="text-gray-500 text-sm">試合はまだありません</p>;
  }

  return (
    <div className="space-y-3">
      {displayMatches.map((match, i) => {
        const home = getTeamById(teams, match.homeTeamId);
        const away = getTeamById(teams, match.awayTeamId);
        if (!home || !away) return null;

        const round = data.rounds.find((r) => r.id === match.roundId);
        const isCompleted =
          match.status === "completed" &&
          match.homeScore !== null &&
          match.awayScore !== null;
        const isInProgress = match.status === "in_progress";

        return (
          <div
            key={match.id}
            className={`flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border transition-all hover:shadow-card ${
              i % 2 === 0
                ? "border-l-4 border-l-primary border-gray-100"
                : "border-l-4 border-l-accent border-gray-100"
            }`}
          >
            <div className="text-xs text-gray-400 font-medium flex items-center gap-2">
              <span className={i % 2 === 0 ? "tag-blue" : "tag-red"}>
                {getRoundLabel(data, match.roundId)} {match.group}グループ
              </span>
              <span>第{match.slotOrder + 1}試合</span>
              {round?.date && <span>{formatDate(round.date)}</span>}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-right w-20 text-primary-dark">
                {home.shortName}
              </span>
              <div className="flex items-center gap-1.5 min-w-[90px] justify-center bg-gray-50 rounded-full px-4 py-1.5">
                {isCompleted ? (
                  <>
                    <span className="text-lg font-bold text-primary">{match.homeScore}</span>
                    <span className="text-gray-300 font-light">-</span>
                    <span className="text-lg font-bold text-accent">{match.awayScore}</span>
                  </>
                ) : isInProgress ? (
                  <span className="text-sm font-medium text-amber-700">試合中</span>
                ) : (
                  <span className="text-sm text-gray-400">
                    {match.status === "cancelled" ? "中止" : "未実施"}
                  </span>
                )}
              </div>
              <span className="font-semibold text-left w-20 text-primary-dark">
                {away.shortName}
              </span>
            </div>
            {round?.venue && (
              <div className="text-xs text-gray-400 hidden md:block">📍 {round.venue}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
