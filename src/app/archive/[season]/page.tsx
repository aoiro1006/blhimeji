import Link from "next/link";
import { notFound } from "next/navigation";
import { archivedToTeamStandings, getArchive } from "@/lib/archives";
import { formatDateShort } from "@/lib/standings";
import GalleryGrid from "@/components/GalleryGrid";
import SectionTitle from "@/components/SectionTitle";
import StandingsTable from "@/components/StandingsTable";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ season: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { season } = await params;
  const archive = await getArchive(season);
  if (!archive) return { title: "アーカイブ" };
  return { title: `${archive.title} — アーカイブ` };
}

export default async function ArchiveDetailPage({ params }: PageProps) {
  const { season } = await params;
  const archive = await getArchive(season);
  if (!archive) notFound();

  const standingsA = archivedToTeamStandings(archive.standings.leagueA);
  const standingsB = archivedToTeamStandings(archive.standings.leagueB);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Link
        href="/archive"
        className="inline-flex items-center text-sm text-primary hover:underline mb-6"
      >
        ← 過去大会一覧
      </Link>

      <SectionTitle
        title={archive.title}
        subtitle={
          archive.summary ||
          `${formatDateShort(archive.finalizedAt.split("T")[0])} — 最終順位表`
        }
      />

      {(standingsA.length > 0 || standingsB.length > 0) && (
        <div className="space-y-10">
          <div>
            <h3 className="text-lg font-bold text-primary-dark mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold bg-primary">
                最終
              </span>
              最終順位表
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {standingsA.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-primary mb-2">Aリーグ</h4>
                  <div className="card !p-0 overflow-hidden ring-1 ring-primary/10">
                    <StandingsTable standings={standingsA} compact />
                  </div>
                </div>
              )}
              {standingsB.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-accent mb-2">Bリーグ</h4>
                  <div className="card !p-0 overflow-hidden ring-1 ring-accent/10">
                    <StandingsTable standings={standingsB} compact />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {archive.gallery.length > 0 && (
        <div className="mt-14">
          <SectionTitle title="大会写真" subtitle={`${archive.title}のギャラリー`} />
          <GalleryGrid images={archive.gallery} />
        </div>
      )}
    </div>
  );
}
