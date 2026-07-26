"use client";

import { useEffect, useState } from "react";
import { BASE_PARTICIPATION_POINTS, DEFAULT_ROUND_POINT_SETTINGS } from "@/lib/pointSettings";

const defaults = DEFAULT_ROUND_POINT_SETTINGS;

const scoringItems = [
  {
    name: "ベースP",
    type: "固定",
    formula: `${BASE_PARTICIPATION_POINTS}点`,
    note: "リーグ節に参加したチームに、シーズン通算で1回のみ付与",
  },
  {
    name: "勝率P",
    type: "固定",
    formula: "勝率（%）をそのまま加点",
    note: "例：勝率50% → +50点",
  },
  {
    name: "得失P",
    type: "調整",
    formula: `得失点差（0以上）× ${defaults.pointDiffMultiplier}`,
    note: "マイナスの得失点差は0として計算",
  },
  {
    name: "圧勝P",
    type: "調整",
    formula: `圧勝点 × ${defaults.blowoutMultiplier}`,
    note: "4点差=1点、5点差=2点、6点差以上=3点（勝利時）",
  },
  {
    name: "ジャイキリP",
    type: "調整",
    formula: `${defaults.giantKillerMultiplier}点`,
    note: "前節時点で5位以上上位の相手に勝利した場合に1点",
  },
  {
    name: "奮闘P",
    type: "調整",
    formula: `奮闘点 × ${defaults.fightingSpiritMultiplier}`,
    note: "前節時点のリーグ内順位が下位30%のチームが勝利で1点",
  },
  {
    name: "試合回数P",
    type: "調整",
    formula: `試合回数 × ${defaults.matchCountMultiplier}`,
    note: "節内の試合数に応じて加点",
  },
];

export default function StandingsScoringHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <p className="mb-8 -mt-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm text-primary hover:text-primary-light hover:underline underline-offset-2"
        >
          得点の計算方法について
        </button>
      </p>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="閉じる"
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="scoring-help-title"
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="h-1 bg-stripe shrink-0" />
            <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3 shrink-0">
              <div>
                <h2 id="scoring-help-title" className="font-bold text-lg text-primary-dark">
                  得点の計算方法
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 shrink-0"
                aria-label="閉じる"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-4 overflow-y-auto">
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                ランキングポイントは、以下の合計で決まります。
              </p>
              <p className="text-xs font-mono bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 mb-5 text-gray-700">
                ベースP ＋ 勝率P ＋ 得失P ＋ 圧勝P ＋ ジャイキリP ＋ 奮闘P ＋ 試合回数P
              </p>

              <div className="space-y-3">
                {scoringItems.map((item) => (
                  <div
                    key={item.name}
                    className="rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-primary-dark">{item.name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          item.type === "固定"
                            ? "bg-primary/10 text-primary"
                            : "bg-accent/10 text-accent-dark"
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800">{item.formula}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.note}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400 mt-5 leading-relaxed">
                ※「調整」項目の倍率は節ごとに変わることがあります。
                <br />
                ※順位表の各行「詳細」から、各チームの内訳を確認できます。
              </p>
            </div>

            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 shrink-0">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-secondary w-full text-sm"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
