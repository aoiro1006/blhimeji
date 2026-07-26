import type { LeagueData, Round } from "@/types";
import { expandRoundIdsWithLinkedChildren, interleaveLinkedChildRounds } from "@/lib/logicalRounds";

export function buildLeagueRoundName(number: number, subNumber = 1): string {
  if (subNumber > 1) return `第${number}-${subNumber}節`;
  return `第${number}節`;
}

export function formatRoundName(round: Round): string {
  if (round.type === "other") return round.name;
  return buildLeagueRoundName(round.number, round.subNumber);
}

export function isLeagueRound(round: Round): boolean {
  return round.type === "league";
}

/** リーグ外の試合（累計対象外・日程に表示） */
export function isNonLeagueRound(round: Round): boolean {
  return round.type === "other";
}

/** 保留（非公開・リーグ累計から除外） */
export function isHeldRound(round: Round): boolean {
  return round.held === true;
}

/** 累計・公開対象のリーグ節 */
export function isActiveLeagueRound(round: Round): boolean {
  return isLeagueRound(round) && !isHeldRound(round);
}

/** @deprecated isHeldRound を使用 */
export function isHeldLeagueRound(round: Round): boolean {
  return isHeldRound(round);
}

/** リーグ節として節番号が付いているか */
export function hasLeaguePosition(round: Round): boolean {
  return round.number > 0;
}

export function formatRoundDisplayName(round: Round): string {
  if (isLeagueRound(round)) return buildLeagueRoundName(round.number, round.subNumber);
  return round.name;
}

/** 公開サイトに表示する節か */
export function isPublicRound(round: Round): boolean {
  return !isHeldRound(round);
}

export function holdLeagueRound(round: Round): Round {
  const leagueName = buildLeagueRoundName(round.number, round.subNumber);
  return {
    ...round,
    type: "league",
    held: true,
    name: round.name && round.name !== leagueName ? round.name : leagueName,
  };
}

/** 同一節番号のリーグ節が重複した場合、既存を保留にする */
export function findLeagueNumberConflict(
  rounds: Round[],
  activeId: string,
  number: number,
  subNumber: number
): Round | undefined {
  return rounds.find(
    (r) =>
      r.id !== activeId &&
      isActiveLeagueRound(r) &&
      r.number === number &&
      r.subNumber === subNumber
  );
}

/** 同一節番号のリーグ節が重複した場合、既存を保留にする */
export function resolveLeagueNumberConflict(
  rounds: Round[],
  activeId: string,
  number: number,
  subNumber: number
): { rounds: Round[]; notice: string | null } {
  const conflict = findLeagueNumberConflict(rounds, activeId, number, subNumber);
  if (!conflict) return { rounds, notice: null };

  const label = buildLeagueRoundName(number, subNumber);
  return {
    rounds: rounds.map((r) => (r.id === conflict.id ? holdLeagueRound(r) : r)),
    notice: `${label}は既に登録されています。既存の${label}を保留に設定しました。`,
  };
}

/** 日付順（未設定は末尾）→ 同日はリーグ節番号順 */
export function compareRoundsByDate(a: Round, b: Round): number {
  const da = a.date ?? "";
  const db = b.date ?? "";
  if (da && db && da !== db) return da.localeCompare(db);
  if (da && !db) return -1;
  if (!da && db) return 1;
  if (isActiveLeagueRound(a) && isActiveLeagueRound(b)) return compareLeagueRounds(a, b);
  if (isActiveLeagueRound(a) && !isActiveLeagueRound(b)) return -1;
  if (!isActiveLeagueRound(a) && isActiveLeagueRound(b)) return 1;
  return a.name.localeCompare(b.name, "ja");
}

/** 管理画面用（保留は末尾、それ以外は日付順） */
export function sortRoundsForAdmin(rounds: Round[]): Round[] {
  return [...rounds].sort((a, b) => {
    if (isHeldRound(a) && !isHeldRound(b)) return 1;
    if (!isHeldRound(a) && isHeldRound(b)) return -1;
    return compareRoundsByDate(a, b);
  });
}

/** 管理画面の既定節（結果入力未終了のうち最も早い節） */
export function getDefaultAdminRoundId(rounds: Round[]): string {
  const sorted = sortRoundsForAdmin(rounds);
  const unfinished = sorted.find((r) => !r.resultsFinished);
  return unfinished?.id ?? sorted[sorted.length - 1]?.id ?? "";
}

/** 公開サイト用（保留を除外し日付順） */
export function getPublicRounds(rounds: Round[]): Round[] {
  return sortRoundsForAdmin(rounds).filter(isPublicRound);
}

/** リーグ節の並び順（第1節 → 第1-2節 → 第2節 …） */
export function compareLeagueRounds(a: Round, b: Round): number {
  if (a.number !== b.number) return a.number - b.number;
  return a.subNumber - b.subNumber;
}

/** 指定リーグ節まで（節番号順・その節を含む）のうち、有効なリーグ節ID */
export function getLeagueRoundIdsUpTo(
  data: { rounds: Round[] },
  target: Round
): Set<string> {
  const ids = new Set<string>();
  for (const r of data.rounds) {
    if (!isActiveLeagueRound(r) || !hasLeaguePosition(r)) continue;
    if (!hasLeaguePosition(target)) continue;
    if (compareLeagueRounds(r, target) <= 0) ids.add(r.id);
  }
  return expandRoundIdsWithLinkedChildren(data, ids);
}

/** 旧データの正規化（other+節番号の保留表現を移行） */
export function normalizeRoundFields(round: Round): Round {
  let r: Round = {
    ...round,
    held: round.held ?? false,
    subNumber: round.subNumber ?? 1,
    additionalMatches: round.additionalMatches
      ? {
          enabled: round.additionalMatches.enabled ?? false,
          mode: round.additionalMatches.mode ?? "embedded",
          linkedRoundId: round.additionalMatches.linkedRoundId,
        }
      : undefined,
  };

  if (r.type === "other" && r.number > 0 && !r.held) {
    const leagueName = buildLeagueRoundName(r.number, r.subNumber);
    const wasHeld =
      r.name.includes("保留") ||
      r.name.includes("（その他）") ||
      r.name === `${leagueName}（保留）`;
    if (wasHeld) {
      r = {
        ...r,
        type: "league",
        held: true,
        name: r.name.replace(/（保留）$/, "").replace(/（その他）$/, "") || leagueName,
      };
    } else {
      r = { ...r, number: 0 };
    }
  }

  if (isLeagueRound(r) && r.number > 0 && !r.name) {
    r.name = buildLeagueRoundName(r.number, r.subNumber);
  }

  return r;
}

/** 公開サイト用：結果入力が終了していない直近（日程順）の節 */
export function getNextUpcomingRound(data: LeagueData): Round | undefined {
  const rounds = interleaveLinkedChildRounds(getPublicRounds(data.rounds));
  return rounds.find((r) => !r.resultsFinished);
}
