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
  const report = data.reports.find((r) => r.id === id);
  if (!report) return { title: "レポートが見つかりません" };
  return { title: report.title };
}

export default async function ReportDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getLeagueData();
  const report = data.reports.find((r) => r.id === id);

  if (!report) notFound();

  return (
    <article className="max-w-3xl mx-auto px-4 py-10">
      <Link
        href="/reports"
        className="text-sm font-medium text-primary hover:text-primary-light transition-colors mb-6 inline-flex items-center gap-1"
      >
        ← 大会レポート一覧
      </Link>
      <div className="card border-t-4 border-t-accent">
        <time className="tag-red">{formatDate(report.date)}</time>
        <h1 className="text-3xl font-bold text-primary-dark mt-3 mb-6 leading-tight">
          {report.title}
        </h1>
        <div className="border-t border-gray-100 pt-6">
          {report.content.split("\n\n").map((paragraph, i) => (
            <p key={i} className="text-gray-700 leading-relaxed mb-4 text-base">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </article>
  );
}
