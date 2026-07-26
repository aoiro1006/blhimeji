"use client";

import { useState } from "react";
import type { Team, TeamStanding } from "@/types";
import TeamsGrid from "@/components/TeamsGrid";

interface TeamsPageContentProps {
  seasonTeams: Team[];
  otherTeams: Team[];
  standingsByTeamId: Record<string, TeamStanding>;
}

export default function TeamsPageContent({
  seasonTeams,
  otherTeams,
  standingsByTeamId,
}: TeamsPageContentProps) {
  const [showOthers, setShowOthers] = useState(false);

  return (
    <>
      <p className="text-sm text-gray-500 mb-4">
        チームをタップすると成績の詳細を見られます
      </p>
      <TeamsGrid teams={seasonTeams} standingsByTeamId={standingsByTeamId} />

      {otherTeams.length > 0 && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setShowOthers((v) => !v)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-primary/30 hover:text-primary hover:bg-primary-pale/40 transition-colors"
          >
            {showOthers
              ? "閉じる"
              : `ほかのチーム（${otherTeams.length}）`}
            <span
              className={`inline-block transition-transform ${showOthers ? "rotate-180" : ""}`}
              aria-hidden
            >
              ▼
            </span>
          </button>

          {showOthers && (
            <div className="mt-4">
              <TeamsGrid teams={otherTeams} standingsByTeamId={standingsByTeamId} />
            </div>
          )}
        </div>
      )}
    </>
  );
}
