import Link from "next/link";
import { listArchives } from "@/lib/archives";
import { formatDateShort } from "@/lib/standings";
import SectionTitle from "@/components/SectionTitle";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "過去大会アーカイブ",
};

export default async function ArchiveIndexPage() {
  const archives = await listArchives();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <SectionTitle
        title="過去大会アーカイブ"
        subtitle="過去シーズンの最終順位表と大会写真"
      />

      {archives.length === 0 ? (
        <p className="text-gray-500">アーカイブはまだありません</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {archives.map((archive, i) => (
            <Link
              key={archive.season}
              href={`/archive/${archive.season}`}
              className={`card-fun group overflow-hidden border-l-4 ${
                i % 2 === 0 ? "border-l-primary" : "border-l-accent"
              } !p-0`}
            >
              {archive.coverImageUrl ? (
                <div className="aspect-[16/10] overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={archive.coverImageUrl}
                    alt={archive.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="aspect-[16/10] bg-gradient-to-br from-primary-pale to-accent-pale flex items-center justify-center">
                  <span className="text-4xl font-bold text-primary/30">{archive.season}</span>
                </div>
              )}
              <div className="p-5">
                <time className="text-xs text-gray-400 font-medium">
                  {formatDateShort(archive.finalizedAt.split("T")[0])}
                </time>
                <h3
                  className={`text-lg font-bold mt-1 transition-colors ${
                    i % 2 === 0
                      ? "text-primary-dark group-hover:text-primary"
                      : "text-accent-dark group-hover:text-accent"
                  }`}
                >
                  {archive.title}
                </h3>
                {archive.summary && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{archive.summary}</p>
                )}
                <span
                  className={`inline-block text-sm font-medium mt-3 ${
                    i % 2 === 0 ? "text-primary" : "text-accent"
                  } group-hover:underline`}
                >
                  詳細を見る →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
