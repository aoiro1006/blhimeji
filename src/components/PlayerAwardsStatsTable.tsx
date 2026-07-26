import { INDIVIDUAL_AWARD_COLUMNS } from "@/lib/playerAwards";
import type { TeamPlayerStatsGroup } from "@/types";

interface PlayerAwardsStatsTableProps {
  groups: TeamPlayerStatsGroup[];
}

export default function PlayerAwardsStatsTable({ groups }: PlayerAwardsStatsTableProps) {
  if (groups.length === 0) {
    return (
      <p className="text-gray-500 text-sm">
        まだ出場記録はありません。
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map(({ team, players }) => (
        <section key={team.id}>
          <div className="flex items-center gap-3 mb-3">
            {team.imageUrl ? (
              <img
                src={team.imageUrl}
                alt={team.name}
                className="w-10 h-10 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ backgroundColor: team.color }}
              >
                {(team.shortName || team.name).charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-primary-dark truncate">{team.name}</h3>
              {team.shortName !== team.name && (
                <p className="text-xs text-gray-400 truncate">{team.shortName}</p>
              )}
            </div>
          </div>

          <div className="card !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[28rem]">
                <thead>
                  <tr className="bg-gradient-to-r from-primary to-primary-light text-white">
                    <th className="text-left py-3 px-3 font-semibold rounded-tl-lg">選手</th>
                    <th className="text-center py-3 px-2 font-semibold w-16 whitespace-nowrap">
                      出場
                    </th>
                    {INDIVIDUAL_AWARD_COLUMNS.map((col, index) => (
                      <th
                        key={col.key}
                        className={`text-center py-3 px-2 font-semibold whitespace-nowrap ${
                          index === INDIVIDUAL_AWARD_COLUMNS.length - 1 ? "rounded-tr-lg" : ""
                        }`}
                      >
                        <span className="hidden sm:inline">{col.label}</span>
                        <span className="sm:hidden">{col.shortLabel}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {players.map((player, index) => (
                    <tr
                      key={player.playerId}
                      className={`border-b border-gray-100 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="py-3 px-3 align-middle">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="inline-block w-1 h-6 rounded-full shrink-0"
                            style={{ backgroundColor: team.color }}
                            aria-hidden
                          />
                          <span className="font-medium text-primary-dark truncate">
                            {player.playerName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center align-middle tabular-nums font-semibold text-primary">
                        {player.appearances}
                      </td>
                      {INDIVIDUAL_AWARD_COLUMNS.map((col) => {
                        const count = player[col.key];
                        return (
                          <td
                            key={col.key}
                            className={`py-3 px-2 text-center align-middle tabular-nums ${
                              count > 0 ? "font-semibold text-accent-dark" : "text-gray-400"
                            }`}
                          >
                            {count}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
