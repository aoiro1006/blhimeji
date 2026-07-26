"use client";

import { useMemo, useRef, useState } from "react";
import type { Team } from "@/types";
import { getContrastTextColor } from "@/lib/resultsEditor";

export interface PlayerSearchCandidate {
  teamId: string;
  playerId: string;
  playerName: string;
  team: Team;
  isEntry: boolean;
}

interface PlayerEntrySearchProps {
  candidates: PlayerSearchCandidate[];
  onSelect: (teamId: string, playerId: string) => void;
}

const MAX_RESULTS = 12;

export default function PlayerEntrySearch({ candidates, onSelect }: PlayerEntrySearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return candidates
      .filter(({ playerName, team }) => {
        const haystack = `${playerName} ${team.name} ${team.shortName}`.toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, MAX_RESULTS);
  }, [query, candidates]);

  function handleFocus() {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setOpen(true);
  }

  function handleBlur() {
    blurTimer.current = setTimeout(() => setOpen(false), 150);
  }

  function handleSelect(teamId: string, playerId: string) {
    onSelect(teamId, playerId);
    setQuery("");
    setOpen(false);
  }

  const showDropdown = open && query.trim().length > 0;

  return (
    <div className="relative mb-4 max-w-md">
      <label htmlFor="entry-player-search" className="sr-only">
        選手検索
      </label>
      <input
        id="entry-player-search"
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="選手名・チーム名で検索"
        autoComplete="off"
        className="input-field pr-9"
      />
      {query && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setQuery("");
            setOpen(false);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          aria-label="検索をクリア"
        >
          ×
        </button>
      )}

      {showDropdown && (
        <ul
          className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg py-1"
          role="listbox"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500">該当する選手がいません</li>
          ) : (
            results.map(({ teamId, playerId, playerName, team, isEntry }) => (
              <li key={`${teamId}:${playerId}`} role="option">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(teamId, playerId)}
                  className="w-full px-3 py-2 text-left hover:bg-primary-pale/60 flex items-center gap-2 min-w-0"
                >
                  <span
                    className="inline-flex items-center justify-center h-6 px-1.5 rounded text-[10px] font-semibold shrink-0 max-w-[5rem] truncate"
                    style={{
                      backgroundColor: team.color,
                      color: getContrastTextColor(team.color),
                    }}
                    title={team.name}
                  >
                    {team.shortName || team.name}
                  </span>
                  <span className="font-medium text-gray-800 truncate">{playerName}</span>
                  {!isEntry && (
                    <span className="text-[10px] text-gray-400 shrink-0 ml-auto">その他</span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export function buildPlayerSearchCandidates(
  teamsWithPlayers: {
    team: Team;
    players: Team["players"];
    isEntry: boolean;
  }[]
): PlayerSearchCandidate[] {
  const list: PlayerSearchCandidate[] = [];
  for (const { team, players, isEntry } of teamsWithPlayers) {
    for (const player of players) {
      if (!player.name.trim()) continue;
      list.push({
        teamId: team.id,
        playerId: player.id,
        playerName: player.name,
        team,
        isEntry,
      });
    }
  }
  return list;
}
