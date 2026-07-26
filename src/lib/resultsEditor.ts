import { getDefaultAdminRoundId } from "@/lib/rounds";
import { getMatchGroupBadgeTone } from "@/lib/matchGroups";
import type { Match, Round, Team } from "@/types";

/** @deprecated getDefaultAdminRoundId を使用 */
export function getDefaultResultsRoundId(rounds: Round[]): string {
  return getDefaultAdminRoundId(rounds);
}

/** チーム名語尾の回数表示に含める試合（完了＋試合中） */
function isMatchCountedForPlayCount(match: Match): boolean {
  return match.status === "completed" || match.status === "in_progress";
}

/** 試合中の試合一覧（slotOrder 順） */
export function getInProgressMatches(matches: Match[]): Match[] {
  return [...matches]
    .filter((m) => m.status === "in_progress")
    .sort((a, b) => a.slotOrder - b.slotOrder);
}

export function formatMatchScoreDisplay(match: Match): string {
  const home = match.homeScore ?? "—";
  const away = match.awayScore ?? "—";
  return `${home} - ${away}`;
}

/** 試合中のチームID一覧 */
export function buildInProgressTeamIdSet(matches: Match[]): Set<string> {
  const ids = new Set<string>();
  for (const match of matches) {
    if (match.status !== "in_progress") continue;
    ids.add(match.homeTeamId);
    ids.add(match.awayTeamId);
  }
  return ids;
}

/** 節内のチーム試合回数（完了＋試合中、節全体） */
export function getTeamCompletedCountInRound(matches: Match[], teamId: string): number {
  let count = 0;
  for (const match of matches) {
    const involves = match.homeTeamId === teamId || match.awayTeamId === teamId;
    if (involves && isMatchCountedForPlayCount(match)) count++;
  }
  return count;
}

/** 節内の全チーム試合回数（完了＋試合中、表示用マップ） */
export function buildTeamCompletedCountMap(matches: Match[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const match of matches) {
    if (!isMatchCountedForPlayCount(match)) continue;
    counts.set(match.homeTeamId, (counts.get(match.homeTeamId) ?? 0) + 1);
    counts.set(match.awayTeamId, (counts.get(match.awayTeamId) ?? 0) + 1);
  }
  return counts;
}

const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];

export function formatCompletedCountSuffix(count: number): string {
  if (count <= 0) return "";
  if (count <= CIRCLED.length) return CIRCLED[count - 1];
  return `(${count})`;
}

export function getTeamById(teams: Team[], id: string): Team | undefined {
  return teams.find((t) => t.id === id);
}

/** 背景色に合わせた文字色 */
export function getMatchResultRowClass(status: Match["status"]): string {
  switch (status) {
    case "completed":
      return "bg-gray-200 border-gray-300";
    case "in_progress":
      return "bg-amber-50 border-amber-200";
    case "cancelled":
      return "bg-red-50/60 border-red-100";
    default:
      return "bg-gray-50 border-gray-100";
  }
}

export function getMatchStatusSelectColorClass(status: Match["status"]): string {
  switch (status) {
    case "completed":
      return "bg-gray-300 border-gray-400 text-gray-700";
    case "in_progress":
      return "bg-amber-100 border-amber-300 text-amber-900";
    case "cancelled":
      return "bg-red-50 border-red-200 text-red-700";
    default:
      return "bg-white border-gray-200 text-gray-700";
  }
}

export function getMatchStatusSelectClass(status: Match["status"]): string {
  const base =
    "px-2 py-1 text-sm rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60 font-medium shrink-0 w-[5.5rem] max-w-[5.5rem]";
  return `${base} ${getMatchStatusSelectColorClass(status)}`;
}

export function getMatchGroupBadgeClass(status: Match["status"], group?: Match["group"]): string {
  const base = "shrink-0 text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap";
  if (status === "completed") {
    return `${base} bg-gray-300/70 text-gray-600`;
  }
  const tone = group ? getMatchGroupBadgeTone(group) : "blue";
  const toneClass =
    tone === "red"
      ? "bg-accent/15 text-accent-dark"
      : tone === "green"
        ? "bg-green-100 text-green-800"
        : tone === "purple"
          ? "bg-purple-100 text-purple-800"
          : tone === "orange"
            ? "bg-orange-100 text-orange-800"
            : tone === "teal"
              ? "bg-teal-100 text-teal-800"
              : "bg-primary/10 text-primary";
  return `${base} ${toneClass}`;
}

export function getContrastTextColor(hex: string): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return "#1f2937";
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1f2937" : "#ffffff";
}
