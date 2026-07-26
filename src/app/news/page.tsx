import { getLeagueData } from "@/lib/data";
import NewsList from "@/components/NewsList";
import SectionTitle from "@/components/SectionTitle";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "お知らせ",
};

export default async function NewsPage() {
  const data = await getLeagueData();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <SectionTitle title="お知らせ" />
      <div className="card border-l-4 border-l-primary">
        <NewsList items={data.news} />
      </div>
    </div>
  );
}
