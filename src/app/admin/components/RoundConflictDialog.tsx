"use client";

import { buildLeagueRoundName } from "@/lib/rounds";
import type { Round } from "@/types";

export type RoundConflictChoice = "replace" | "additional";

interface RoundConflictDialogProps {
  label: string;
  existingRound: Round;
  onChoose: (choice: RoundConflictChoice) => void;
  onCancel: () => void;
}

export default function RoundConflictDialog({
  label,
  existingRound,
  onChoose,
  onCancel,
}: RoundConflictDialogProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button type="button" aria-label="閉じる" className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
      >
        <h3 className="font-bold text-lg text-primary-dark mb-2">同じ節が既にあります</h3>
        <p className="text-sm text-gray-600 mb-4">
          {label} は「{existingRound.name || buildLeagueRoundName(existingRound.number, existingRound.subNumber)}
          」と重複しています。どちらにしますか？
        </p>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onChoose("replace")}
            className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50"
          >
            <span className="font-semibold text-gray-800 block">新規追加</span>
            <span className="text-xs text-gray-500">既存の節を保留にし、この節を有効にする</span>
          </button>
          <button
            type="button"
            onClick={() => onChoose("additional")}
            className="w-full text-left px-4 py-3 rounded-xl border border-primary/30 bg-primary-pale/40 hover:bg-primary-pale/70"
          >
            <span className="font-semibold text-primary-dark block">追加試合</span>
            <span className="text-xs text-gray-600">
              既存の「{existingRound.name}」に D/E/F 追加試合セクションを設ける
            </span>
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary w-full mt-2">
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
