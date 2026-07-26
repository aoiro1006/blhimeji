import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeagueData } from "@/lib/data";
import { formatDate } from "@/lib/standings";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const data = await getLeagueData();
  const item = data.news.find((n) => n.id === id);
  if (!item) return { title: "お知らせが見つかりません" };
  return { title: item.title };
}

export default async function NewsDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getLeagueData();
  const item = data.news.find((n) => n.id === id);

  if (!item) notFound();

  return (
    <article className="max-w-3xl mx-auto px-4 py-10">
      <Link
        href="/news"
        className="text-sm font-medium text-primary hover:text-primary-light transition-colors mb-6 inline-flex items-center gap-1"
      >
        ← お知らせ一覧
      </Link>
      <div className="card border-t-4 border-t-primary">
        <div className="flex items-center gap-3 mb-3">
          <time className="tag-blue">{formatDate(item.date)}</time>
          <span className="tag-red">{item.category}</span>
        </div>
        <h1 className="text-3xl font-bold text-primary-dark leading-tight">{item.title}</h1>
        <div className="border-t border-gray-100 mt-6 pt-6">
          {item.content.split("\n\n").map((paragraph, i) => (
            <p key={i} className="text-gray-700 leading-relaxed mb-4">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </article>
  );
}
