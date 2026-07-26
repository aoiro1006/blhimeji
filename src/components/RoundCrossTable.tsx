import type { CrossTableCell, GroupCrossTable } from "@/lib/crossTable";
import type { Team } from "@/types";

import type { MatchGroup } from "@/types";

const GROUP_LABELS: Record<
  MatchGroup,
  { bg: string; light: string }
> = {
  A: { bg: "bg-primary", light: "bg-primary/10" },
  B: { bg: "bg-accent", light: "bg-accent/10" },
  C: { bg: "bg-gray-500", light: "bg-gray-100" },
  D: { bg: "bg-purple-600", light: "bg-purple-100" },
  E: { bg: "bg-orange-500", light: "bg-orange-100" },
  F: { bg: "bg-teal-600", light: "bg-teal-100" },
};

function CellContent({ cell }: { cell: CrossTableCell }) {
  if (cell.type === "self") {
    return <span className="text-gray-300 text-lg font-light">／</span>;
  }
  if (cell.type === "empty" || cell.type === "pending") {
    return <span className="text-gray-300">—</span>;
  }
  if (cell.type === "cancelled") {
    return <span className="text-xs text-gray-400">中止</span>;
  }
  return (
    <div className="flex items-center justify-center gap-0.5 font-bold text-sm">
      <span className="text-primary min-w-[1.25rem] text-right">{cell.rowScore}</span>
      <span className="text-gray-300 font-normal">|</span>
      <span className="text-accent min-w-[1.25rem] text-left">{cell.colScore}</span>
    </div>
  );
}

function TeamLabel({ team, vertical = false }: { team: Team; vertical?: boolean }) {
  return (
    <span
      className={`text-xs font-semibold text-gray-800 leading-tight ${
        vertical
          ? "whitespace-nowrap [writing-mode:vertical-rl]"
          : "truncate max-w-[6rem] sm:max-w-none"
      }`}
      title={team.name}
    >
      {team.shortName || team.name}
    </span>
  );
}

export default function RoundCrossTable({ table }: { table: GroupCrossTable }) {
  const { group, teams, matrix } = table;
  const style = GROUP_LABELS[group];

  if (teams.length === 0) return null;

  return (
    <div className="mb-10">
      <h3 className="text-md font-bold text-primary-dark mb-4 flex items-center gap-2">
        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${style.bg}`}>
          {group}
        </span>
        {group}グループ
      </h3>

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full border-collapse text-sm bg-white min-w-[320px]">
          <thead>
            <tr>
              <th className="border border-gray-200 bg-gray-50 p-2 w-24 sticky left-0 z-10" />
              {teams.map((team) => (
                <th
                  key={team.id}
                  className="border border-gray-200 p-2 min-w-[2.5rem] align-bottom"
                  style={{ backgroundColor: `${team.color}18` }}
                >
                  <div className="flex justify-center h-28 items-end pb-2 px-0.5">
                    <TeamLabel team={team} vertical />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.map((rowTeam, i) => (
              <tr key={rowTeam.id}>
                <th
                  className="border border-gray-200 p-2 text-left sticky left-0 z-10"
                  style={{ backgroundColor: `${rowTeam.color}18` }}
                >
                  <TeamLabel team={rowTeam} />
                </th>
                {matrix[i].map((cell, j) => (
                  <td
                    key={`${rowTeam.id}-${teams[j].id}`}
                    className={`border border-gray-200 p-2 text-center ${
                      cell.type === "self" ? "bg-gray-50" : ""
                    }`}
                  >
                    <CellContent cell={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        ※ 左の数字が行チームの得点、右が列チームの得点です
      </p>
    </div>
  );
}
