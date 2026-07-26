import Link from "next/link";
import { getLeagueData } from "@/lib/data";
import { getRoundMatchStats, roundHasMatches } from "@/lib/crossTable";
import { getPublicRounds, isLeagueRound, isNonLeagueRound } from "@/lib/rounds";
import { formatRoundScheduleLabel, interleaveLinkedChildRounds } from "@/lib/logicalRounds";
import { formatDate } from "@/lib/standings";
import SectionTitle from "@/components/SectionTitle";

export const dynamic = "force-dynamic";

export const metadata = { title: "日程・結果" };

export default async function SchedulePage() {
  const data = await getLeagueData();
  const rounds = interleaveLinkedChildRounds(getPublicRounds(data.rounds));

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <SectionTitle title="日程・結果" subtitle={`${data.season}シーズン`} />

      {rounds.length === 0 ? (
        <p className="text-gray-500">日程はまだありません</p>
      ) : (
        <div className="space-y-3">
          {rounds.map((round) => {
            const hasMatches = roundHasMatches(data, round.id);
            const stats = getRoundMatchStats(data, round.id);

            return (
              <Link
                key={round.id}
                href={`/schedule/${round.id}`}
                className="card flex flex-wrap items-center justify-between gap-4 hover:ring-2 hover:ring-primary/20 transition-all group"
              >
                <div className="flex flex-wrap items-center gap-3 min-w-0">
                  <span
                    className={`shrink-0 text-sm px-4 py-1.5 rounded-full font-semibold text-white ${
                      isLeagueRound(round)
                        ? "bg-gradient-to-r from-primary to-primary-light"
                        : "bg-gradient-to-r from-accent to-accent-light"
                    }`}
                  >
                    {formatRoundScheduleLabel(data, round)}
                  </span>
                  {isNonLeagueRound(round) && (
                    <span className="text-xs tag-red shrink-0">リーグ外</span>
                  )}
                  <p className="text-sm text-gray-600 min-w-0 truncate">
                    {round.date && (
                      <span className="text-base font-semibold text-gray-800">
                        {formatDate(round.date)}
                      </span>
                    )}
                    {round.time && <span className="ml-2">{round.time}</span>}
                    {round.venue && (
                      <span className="ml-2 text-gray-500">📍 {round.venue}</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {hasMatches ? (
                    <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                      結果 {stats.completed}/{stats.total}試合
                    </span>
                  ) : (
                    <span className="text-xs px-3 py-1 rounded-full bg-accent/10 text-accent-dark font-medium">
                      開催予定
                    </span>
                  )}
                  <span className="text-sm text-primary font-medium group-hover:translate-x-0.5 transition-transform">
                    詳細を見る →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
