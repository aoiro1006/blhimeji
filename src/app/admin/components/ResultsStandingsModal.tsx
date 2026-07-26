"use client";

import { useEffect, useMemo } from "react";
import type { LeagueData, Match } from "@/types";
import StandingsTable from "@/components/StandingsTable";
import {
  buildPreviewLeagueData,
  getResultsStandingsPreview,
} from "@/lib/standingsExport";

interface ResultsStandingsModalProps {
  data: LeagueData;
  roundId: string;
  editedMatches: Match[];
  includesUnsaved?: boolean;
  onClose: () => void;
}

export default function ResultsStandingsModal({
  data,
  roundId,
  editedMatches,
  includesUnsaved = false,
  onClose,
}: ResultsStandingsModalProps) {
  const preview = useMemo(() => {
    const previewData = buildPreviewLeagueData(data, roundId, editedMatches);
    return getResultsStandingsPreview(previewData, roundId);
  }, [data, roundId, editedMatches]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const hasContent =
    preview.roundSections.length > 0 || preview.cumulativeSections.length > 0;

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
        aria-labelledby="results-standings-modal-title"
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        <div className="h-1 bg-stripe shrink-0" />
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3 shrink-0">
          <div>
            <h2 id="results-standings-modal-title" className="font-bold text-lg text-primary-dark">
              現在の成績
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {preview.roundLabel}
              {includesUnsaved && (
                <span className="ml-2 text-amber-700">· 未保存の入力を反映</span>
              )}
            </p>
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

        <div className="px-5 py-4 overflow-auto flex-1 bg-gray-50 space-y-8">
          {!hasContent ? (
            <p className="text-sm text-gray-500 text-center py-8">
              完了した試合がないため、順位を表示できません。
            </p>
          ) : (
            <>
              {preview.roundSections.map((section) => (
                <section key={section.label}>
                  <h3 className="text-sm font-bold text-primary-dark mb-2">本節の順位</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    {section.label} · 勝数 → 得失点差 の順
                  </p>
                  <div className="card !p-0 overflow-hidden ring-1 ring-primary/10">
                    <StandingsTable standings={section.standings} compact hidePointsColumn />
                  </div>
                </section>
              ))}

              {preview.isLeagueRound && preview.cumulativeSections.length > 0 && (
                <section>
                  <h3 className="text-sm font-bold text-primary-dark mb-2">累計順位</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    {preview.roundLabel}時点のA/Bリーグ累計
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    {preview.cumulativeSections.map((section) => (
                      <div key={section.label}>
                        <h4
                          className={`text-xs font-bold mb-2 ${
                            section.league === "A" ? "text-primary" : "text-accent"
                          }`}
                        >
                          {section.label}
                        </h4>
                        <div
                          className={`card !p-0 overflow-hidden ring-1 ${
                            section.league === "A" ? "ring-primary/10" : "ring-accent/10"
                          }`}
                        >
                          <StandingsTable standings={section.standings} compact />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {!preview.isLeagueRound && preview.roundSections.length > 0 && (
                <p className="text-xs text-gray-400">
                  リーグ外の試合のため、累計順位はありません。
                </p>
              )}
            </>
          )}
        </div>

        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary w-full sm:w-auto sm:min-w-[120px]">
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
