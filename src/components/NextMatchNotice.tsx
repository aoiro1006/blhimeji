import { formatRoundScheduleLabel } from "@/lib/logicalRounds";
import { getNextUpcomingRound } from "@/lib/rounds";
import { formatDate } from "@/lib/standings";
import type { LeagueData } from "@/types";

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

export default function NextMatchNotice({ data }: { data: LeagueData }) {
  const round = getNextUpcomingRound(data);
  if (!round) return null;

  const hasScheduleInfo = Boolean(round.date || round.time || round.venue);
  const roundLabel = formatRoundScheduleLabel(data, round);

  const parts: string[] = [];
  if (round.date) parts.push(formatDate(round.date));
  if (round.time) parts.push(round.time);
  if (round.venue) parts.push(round.venue);

  return (
    <div
      role="status"
      aria-label={`次の試合: ${roundLabel}${parts.length ? ` ${parts.join(" ")}` : ""}`}
      className="mb-4 relative flex items-center gap-2.5 min-h-[2.75rem] overflow-hidden rounded-lg border border-[#e8dfd0] bg-[#f5f0e8] px-3 py-2 pl-4 shadow-[0_1px_8px_rgba(160,130,80,0.1)]"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" aria-hidden />

      <div
        className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-[#eadfce] text-accent-dark"
        aria-hidden
      >
        <BellIcon className="w-4 h-4" />
      </div>

      <span className="shrink-0 text-[10px] font-bold tracking-wide text-accent-dark bg-white/70 border border-[#e0d5c5] px-2 py-0.5 rounded-full">
        次の試合
      </span>

      <p className="flex-1 min-w-0 text-sm text-gray-800 truncate">
        <span className="font-bold text-primary-dark">{roundLabel}</span>
        {hasScheduleInfo ? (
          <>
            <span className="text-[#c4b8a8] mx-1.5" aria-hidden>
              ·
            </span>
            <span className="text-gray-700">{parts.join(" · ")}</span>
          </>
        ) : (
          <span className="text-gray-500 ml-1.5">— 日程・会場は準備中</span>
        )}
      </p>
    </div>
  );
}
