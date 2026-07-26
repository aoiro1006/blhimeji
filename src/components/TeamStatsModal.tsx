"use client";

import { useEffect } from "react";
import type { TeamStanding } from "@/types";
import { formatDateShort } from "@/lib/standings";

interface TeamStatsModalProps {
  standing: TeamStanding | null;
  onClose: () => void;
}

function formatPoints(value: number): string {
  return Math.round(value * 10) / 10 === Math.round(value)
    ? String(Math.round(value))
    : value.toFixed(1);
}

export default function TeamStatsModal({ standing, onClose }: TeamStatsModalProps) {
  useEffect(() => {
    if (!standing) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [standing, onClose]);

  if (!standing) return null;

  const { team } = standing;
  const matches = standing.matchHistory ?? [];
  const b = standing.pointBreakdown;
  const entryPlayers = team.players.filter((p) => p.name.trim());

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="閉じる"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-stats-modal-title"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="h-1 bg-stripe shrink-0" />
        {team.imageUrl ? (
          <div className="relative w-full aspect-[2/1] bg-gray-100 shrink-0">
            <img src={team.imageUrl} alt={team.name} className="w-full h-full object-cover" />
          </div>
        ) : null}

        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            {standing.rank > 0 && (
              <p className="text-xs text-gray-400 mb-1">{standing.displayLeague}リーグ 第{standing.rank}位</p>
            )}
            <h2 id="team-stats-modal-title" className="font-bold text-lg text-primary-dark truncate">
              {team.name}
            </h2>
            {team.shortName !== team.name && (
              <p className="text-sm text-gray-500 truncate">{team.shortName}</p>
            )}
            {entryPlayers.length > 0 && (
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                <span className="text-xs text-gray-400 block mb-0.5">エントリー選手</span>
                {entryPlayers.map((p) => p.name.trim()).join("、")}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 shrink-0"
            aria-label="閉じる"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-5">
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              シーズン成績
            </h3>
            {standing.played === 0 ? (
              <p className="text-sm text-gray-500">試合はまだありません</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {[
                  { label: "ポイント", value: formatPoints(standing.rankingPoints), accent: true },
                  { label: "試合", value: String(standing.played) },
                  { label: "勝", value: String(standing.wins) },
                  { label: "敗", value: String(standing.losses) },
                  { label: "得点", value: String(standing.pointsFor) },
                  { label: "失点", value: String(standing.pointsAgainst) },
                  {
                    label: "得失",
                    value: standing.pointDiff > 0 ? `+${standing.pointDiff}` : String(standing.pointDiff),
                  },
                ].map(({ label, value, accent }) => (
                  <div
                    key={label}
                    className="rounded-lg bg-gray-50 border border-gray-100 px-2.5 py-2 text-center"
                  >
                    <p className="text-[10px] text-gray-500 mb-0.5">{label}</p>
                    <p
                      className={`text-sm font-bold tabular-nums ${
                        accent ? "text-primary" : "text-gray-800"
                      }`}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {b && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                ポイント内訳
              </h3>
              <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 text-xs">
                  {[
                    { label: "ベースP", value: b.basePoints },
                    { label: "勝率P", value: b.winRatePoints },
                    { label: "得失P", value: b.pointDiffBonus },
                    { label: "圧勝P", value: b.blowoutBonus },
                    { label: "ジャイキリP", value: b.giantKillerBonus },
                    { label: "奮闘P", value: b.fightingSpiritBonus },
                    { label: "試合回数P", value: b.matchCountBonus },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between gap-2 tabular-nums">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-semibold text-gray-800">{formatPoints(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              試合結果（{matches.length}試合）
            </h3>
            {matches.length === 0 ? (
              <p className="text-sm text-gray-500">完了した試合はありません</p>
            ) : (
              <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                {matches.map((m, i) => (
                  <li
                    key={`${m.roundLabel}-${m.opponentName}-${i}`}
                    className="px-3 py-2.5 bg-white hover:bg-gray-50/80"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                          m.isLeagueRound
                            ? "bg-primary/10 text-primary"
                            : "bg-accent/10 text-accent-dark"
                        }`}
                      >
                        {m.roundLabel}
                      </span>
                      {m.roundDate && (
                        <time className="text-[10px] text-gray-400 shrink-0">
                          {formatDateShort(m.roundDate)}
                        </time>
                      )}
                      <span
                        className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          m.result === "win"
                            ? "bg-primary/10 text-primary"
                            : m.result === "loss"
                              ? "bg-accent/10 text-accent"
                              : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {m.result === "win" ? "勝" : m.result === "loss" ? "敗" : "分"}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-2 mt-1">
                      <span className="text-sm text-gray-700 truncate">
                        vs {m.opponentShortName || m.opponentName}
                      </span>
                      <span className="text-sm font-bold tabular-nums text-gray-900 shrink-0">
                        {m.teamScore} - {m.opponentScore}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary w-full text-sm">
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
