import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeagueData } from "@/lib/data";
import { buildRoundCrossTables, getRoundMatchStats, roundHasMatches } from "@/lib/crossTable";
import { formatRoundScheduleLabel, getLogicalRoundRoot } from "@/lib/logicalRounds";
import { formatRoundDisplayName, isLeagueRound, isPublicRound } from "@/lib/rounds";
import { calculateRoundDayStandings, calculateStandings, formatDate } from "@/lib/standings";
import RoundCrossTable from "@/components/RoundCrossTable";
import RoundScheduleInfo from "@/components/RoundScheduleInfo";
import StandingsTable from "@/components/StandingsTable";
import SectionTitle from "@/components/SectionTitle";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ roundId: string }> }) {
  const { roundId } = await params;
  const data = await getLeagueData();
  const round = data.rounds.find((r) => r.id === roundId);
  return { title: round ? `${formatRoundDisplayName(round)} — 日程・結果` : "日程・結果" };
}

export default async function ScheduleRoundPage({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) {
  const { roundId } = await params;
  const data = await getLeagueData();
  const round = data.rounds.find((r) => r.id === roundId);

  if (!round || !isPublicRound(round)) notFound();

  const hasMatches = roundHasMatches(data, roundId);
  const stats = getRoundMatchStats(data, roundId);
  const crossTables = buildRoundCrossTables(data, roundId);
  const isLeague = isLeagueRound(round);
  const logicalRoot = getLogicalRoundRoot(data, roundId);
  const standingsRoundId = logicalRoot?.id ?? round.id;

  const standingsA = isLeague
    ? calculateStandings(data, {
        displayLeague: "A",
        leagueCumulativeThroughRoundId: standingsRoundId,
      })
    : [];
  const standingsB = isLeague
    ? calculateStandings(data, {
        displayLeague: "B",
        leagueCumulativeThroughRoundId: standingsRoundId,
      })
    : [];
  const dayStandings = calculateRoundDayStandings(data, round.id);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Link
        href="/schedule"
        className="inline-flex items-center text-sm text-primary hover:text-primary-light mb-6 transition-colors"
      >
        ← 日程一覧に戻る
      </Link>

      <div className="flex flex-wrap items-center gap-3 mb-2">
        <span
          className={`text-sm px-4 py-1.5 rounded-full font-semibold text-white ${
            isLeagueRound(round)
              ? "bg-gradient-to-r from-primary to-primary-light"
              : "bg-gradient-to-r from-accent to-accent-light"
          }`}
        >
          {formatRoundScheduleLabel(data, round)}
        </span>
        {!isLeagueRound(round) && (
          <span className="text-xs tag-red">リーグ外</span>
        )}
        {hasMatches ? (
          <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
            結果 {stats.completed}/{stats.total}試合
          </span>
        ) : (
          <span className="text-xs px-3 py-1 rounded-full bg-accent/10 text-accent-dark font-medium">
            開催予定
          </span>
        )}
      </div>

      {(round.date || round.time || round.venue) && (
        <p className="text-sm text-gray-600 mb-8 truncate">
          {round.date && (
            <span className="text-base font-semibold text-gray-800">{formatDate(round.date)}</span>
          )}
          {round.time && <span className="ml-2">{round.time}</span>}
          {round.venue && <span className="ml-2 text-gray-500">📍 {round.venue}</span>}
        </p>
      )}

      {hasMatches ? (
        <>
          <SectionTitle title="対戦表" subtitle="グループ別の総当たり結果" />
          {crossTables.map((table) => (
            <RoundCrossTable key={table.group} table={table} />
          ))}

          {isLeague ? (
            <>
              {dayStandings.length > 0 && (
                <div className="mt-12">
                  <SectionTitle
                    title="本節の順位"
                    subtitle="勝数・得失点差の順"
                  />
                  <div className="card !p-0 overflow-hidden ring-1 ring-primary/10">
                    <StandingsTable standings={dayStandings} hidePointsColumn />
                  </div>
                </div>
              )}
              {(standingsA.length > 0 || standingsB.length > 0) && (
                <div className="mt-12">
                  <SectionTitle
                    title="累計順位"
                    subtitle={`${formatRoundDisplayName(logicalRoot ?? round)}時点`}
                  />
                <div className="grid md:grid-cols-2 gap-6">
                  {standingsA.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-primary mb-2">Aリーグ</h3>
                      <div className="card !p-0 overflow-hidden ring-1 ring-primary/10">
                        <StandingsTable standings={standingsA} compact />
                      </div>
                    </div>
                  )}
                  {standingsB.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-accent mb-2">Bリーグ</h3>
                      <div className="card !p-0 overflow-hidden ring-1 ring-accent/10">
                        <StandingsTable standings={standingsB} compact />
                      </div>
                    </div>
                  )}
                </div>
                </div>
              )}
            </>
          ) : (
            dayStandings.length > 0 && (
              <div className="mt-12">
                <SectionTitle title="当日順位" subtitle="勝数 → 得失点差 の順" />
                <div className="card !p-0 overflow-hidden ring-1 ring-primary/10">
                  <StandingsTable standings={dayStandings} hidePointsColumn />
                </div>
              </div>
            )
          )}
        </>
      ) : (
        <>
          <SectionTitle title="開催情報" />
          <RoundScheduleInfo round={round} data={data} />
        </>
      )}
    </div>
  );
}
