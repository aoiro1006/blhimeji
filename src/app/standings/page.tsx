import { getLeagueData } from "@/lib/data";
import { formatRoundDisplayName, isLeagueRound, isNonLeagueRound, isPublicRound } from "@/lib/rounds";
import { calculateRoundDayStandings, calculateStandings } from "@/lib/standings";
import StandingsTable from "@/components/StandingsTable";
import StandingsScoringHelp from "@/components/StandingsScoringHelp";
import SectionTitle from "@/components/SectionTitle";
import type { DisplayLeague } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "順位表" };

const displayLeagues: DisplayLeague[] = ["A", "B"];

export default async function StandingsPage() {
  const data = await getLeagueData();
  const otherRounds = data.rounds.filter((r) => isNonLeagueRound(r) && isPublicRound(r));

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <SectionTitle
        title="順位表"
        subtitle={`${data.season}シーズン`}
      />
      <StandingsScoringHelp />

      <div className="space-y-10">
        {displayLeagues.map((league) => {
          const standings = calculateStandings(data, { displayLeague: league, leagueOnly: true });
          if (standings.length === 0) return null;
          return (
            <div key={league}>
              <h3 className="text-lg font-bold text-primary-dark mb-4 flex items-center gap-2">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    league === "A" ? "bg-primary" : "bg-accent"
                  }`}
                >
                  {league}
                </span>
                {league}リーグ
              </h3>
              <div className="card !p-0 overflow-hidden ring-1 ring-primary/10">
                <StandingsTable standings={standings} showPointDetails />
              </div>
            </div>
          );
        })}
      </div>

      {otherRounds.length > 0 && (
        <div className="mt-14">
          <SectionTitle title="リーグ外の試合" subtitle="当日の順位" />
          <div className="space-y-8">
            {otherRounds.map((round) => {
              const roundStandings = calculateRoundDayStandings(data, round.id);
              if (roundStandings.length === 0) return null;
              return (
                <div key={round.id}>
                  <h3 className="font-bold text-accent-dark mb-3">{formatRoundDisplayName(round)}</h3>
                  <div className="card !p-0 overflow-hidden">
                    <StandingsTable standings={roundStandings} compact hidePointsColumn />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4 text-right">
        最終更新: {new Date(data.lastUpdated).toLocaleString("ja-JP")}
      </p>
    </div>
  );
}
