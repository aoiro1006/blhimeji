import Link from "next/link";
import type { NewsItem } from "@/types";
import { formatDateShort } from "@/lib/standings";

interface NewsListProps {
  items: NewsItem[];
  compact?: boolean;
  limit?: number;
}

export default function NewsList({ items, compact = false, limit }: NewsListProps) {
  const displayItems = limit ? items.slice(0, limit) : items;

  if (displayItems.length === 0) {
    return <p className="text-gray-500 text-sm">お知らせはありません</p>;
  }

  return (
    <ul className={compact ? "space-y-1" : "space-y-3"}>
      {displayItems.map((item, i) => (
        <li key={item.id}>
          <Link
            href={`/news/${item.id}`}
            className={`flex items-start gap-3 ${
              compact
                ? "py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50/80 rounded-lg px-1 -mx-1 transition-colors"
                : "p-3 rounded-xl hover:bg-primary-pale/50 transition-colors block"
            }`}
          >
            <time className="text-xs text-gray-400 whitespace-nowrap pt-0.5 font-medium">
              {formatDateShort(item.date)}
            </time>
            <span className={i % 2 === 0 ? "tag-blue" : "tag-red"}>{item.category}</span>
            <span className={`text-sm text-gray-800 flex-1 ${compact ? "line-clamp-1" : ""}`}>
              {item.title}
            </span>
            {!compact && (
              <span className="text-xs text-primary whitespace-nowrap">詳細 →</span>
            )}
          </Link>
        </li>
      ))}
      {limit && items.length > limit && (
        <li className="text-right pt-2">
          <Link href="/news" className="text-sm text-accent font-medium hover:underline">
            一覧へ →
          </Link>
        </li>
      )}
    </ul>
  );
}
