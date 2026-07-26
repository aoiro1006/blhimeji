"use client";

import { useState } from "react";
import type { Team, TeamStanding } from "@/types";
import TeamStatsModal from "@/components/TeamStatsModal";

interface TeamsGridProps {
  teams: Team[];
  standingsByTeamId: Record<string, TeamStanding>;
}

function emptyStanding(team: Team): TeamStanding {
  return {
    team,
    rank: 0,
    rankingPoints: 0,
    played: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    pointDiff: 0,
    winRate: 0,
    matchHistory: [],
  };
}

export default function TeamsGrid({ teams, standingsByTeamId }: TeamsGridProps) {
  const [selectedStanding, setSelectedStanding] = useState<TeamStanding | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {teams.map((team, i) => (
          <button
            key={team.id}
            type="button"
            onClick={() => setSelectedStanding(standingsByTeamId[team.id] ?? emptyStanding(team))}
            className={`text-left bg-white rounded-xl border border-gray-100/80 shadow-sm px-3 py-2.5 flex items-start gap-2.5 transition-shadow hover:shadow-md hover:ring-2 hover:ring-primary/20 border-t-[3px] cursor-pointer ${
              i % 2 === 0 ? "border-t-primary" : "border-t-accent"
            }`}
          >
            <div className="flex-shrink-0">
              {team.imageUrl ? (
                <img
                  src={team.imageUrl}
                  alt={team.name}
                  className="w-10 h-10 rounded-lg object-cover"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm boccia-ball"
                  style={{ backgroundColor: team.color }}
                >
                  {team.shortName.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-primary-dark leading-snug truncate">
                {team.name}
              </h3>
              {team.shortName !== team.name && (
                <p className="text-[11px] text-gray-400 truncate">{team.shortName}</p>
              )}
              {team.players.length > 0 && (
                <p className="text-[11px] text-gray-500 mt-1 leading-snug line-clamp-2">
                  {team.players.map((p) => p.name).join("、")}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      <TeamStatsModal standing={selectedStanding} onClose={() => setSelectedStanding(null)} />
    </>
  );
}
