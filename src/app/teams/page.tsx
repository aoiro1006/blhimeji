import { getLeagueData } from "@/lib/data";
import { filterTeamsForPublicDisplay } from "@/lib/entrySheetExport";
import {
  calculateStandings,
  getSeasonParticipantTeamIds,
  sortTeamsForTeamsPage,
} from "@/lib/standings";
import SectionTitle from "@/components/SectionTitle";
import TeamsPageContent from "@/components/TeamsPageContent";

export const dynamic = "force-dynamic";

export const metadata = { title: "参加チーム" };

export default async function TeamsPage() {
  const data = await getLeagueData();
  const standingsA = calculateStandings(data, { displayLeague: "A", leagueOnly: true });
  const standingsB = calculateStandings(data, { displayLeague: "B", leagueOnly: true });
  const standingsByTeamId = Object.fromEntries(
    [...standingsA, ...standingsB].map((s) => [s.team.id, s])
  );

  const publicTeams = filterTeamsForPublicDisplay(data.teams);
  const participantIds = getSeasonParticipantTeamIds(data);
  const seasonTeams = sortTeamsForTeamsPage(
    publicTeams.filter((t) => participantIds.has(t.id)),
    standingsByTeamId
  );
  const otherTeams = sortTeamsForTeamsPage(
    publicTeams.filter((t) => !participantIds.has(t.id)),
    standingsByTeamId
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <SectionTitle title="参加チーム" subtitle={`${data.season}シーズン`} />
      <TeamsPageContent
        seasonTeams={seasonTeams}
        otherTeams={otherTeams}
        standingsByTeamId={standingsByTeamId}
      />
    </div>
  );
}
