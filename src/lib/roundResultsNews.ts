import type { NewsItem, Round } from "@/types";

function getTodayInJst(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

/** 節終了時に追加するお知らせ（試合結果カテゴリ） */
export function buildRoundResultsNewsItem(round: Round): NewsItem {
  const label = round.name;
  return {
    id: crypto.randomUUID(),
    date: getTodayInJst(),
    category: "試合結果",
    title: `${label} 試合結果を更新しました`,
    content: `${label}の試合結果を更新しました。順位表をご確認ください。`,
  };
}
