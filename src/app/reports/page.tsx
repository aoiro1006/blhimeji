import Link from "next/link";
import { getLeagueData } from "@/lib/data";
import { formatDateShort } from "@/lib/standings";
import SectionTitle from "@/components/SectionTitle";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "大会レポート",
};

export default async function ReportsPage() {
  const data = await getLeagueData();
  const sortedReports = [...data.reports].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <SectionTitle title="大会レポート" subtitle="各節の様子をお届けします" />

      {sortedReports.length === 0 ? (
        <p className="text-gray-500">大会レポートはまだありません</p>
      ) : (
        <div className="grid gap-5">
          {sortedReports.map((report, i) => (
            <Link
              key={report.id}
              href={`/reports/${report.id}`}
              className={`card-fun group border-l-4 ${
                i % 2 === 0 ? "border-l-primary" : "border-l-accent"
              }`}
            >
              <time className="text-xs text-gray-400 font-medium">{formatDateShort(report.date)}</time>
              <h3
                className={`text-lg font-bold mt-1 transition-colors ${
                  i % 2 === 0
                    ? "text-primary-dark group-hover:text-primary"
                    : "text-accent-dark group-hover:text-accent"
                }`}
              >
                {report.title}
              </h3>
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{report.excerpt}</p>
              <span
                className={`inline-block text-sm font-medium mt-3 ${
                  i % 2 === 0 ? "text-primary" : "text-accent"
                } group-hover:underline`}
              >
                続きを読む →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
