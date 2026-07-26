"use client";

import type { MatchPairingsExportContent } from "@/lib/matchPairingsExport";
import { getContrastTextColor } from "@/lib/matchPairingsExport";
import { formatDateShort } from "@/lib/standings";

interface MatchPairingsShareImageProps {
  content: MatchPairingsExportContent;
}

const cellBorder = "border border-gray-300 align-middle py-2";
const blankCell = `${cellBorder} bg-white w-9`;
const countCell = `${cellBorder} bg-black text-white text-center font-bold w-9`;

export default function MatchPairingsShareImage({ content }: MatchPairingsShareImageProps) {
  const generatedAt = new Date().toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const metaParts = [
    "ボッチャリーグひめじ",
    `${content.season}シーズン`,
    content.roundLabel,
  ];
  if (content.roundDate) metaParts.push(formatDateShort(content.roundDate));

  return (
    <div className="w-max min-w-[640px] max-w-none bg-white font-sans text-gray-800">
      <div className="px-4 py-3 border-b border-gray-200">
        <p className="text-xs font-semibold text-primary-dark whitespace-nowrap">
          {metaParts.join(" · ")}
        </p>
      </div>

      {content.rows.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-10 px-4">
          この節の組み合わせがありません
        </p>
      ) : (
        <table className="w-full border-collapse text-sm table-auto">
          <thead>
            <tr className="bg-neutral-600 text-white">
              <th className="border border-neutral-500 py-2 w-10" />
              <th className="border border-neutral-500 py-2 w-9" />
              <th className="border border-neutral-500 py-2 w-9" />
              <th className="border border-neutral-500 py-2 px-2 text-center font-semibold">
                対戦A
              </th>
              <th className="border border-neutral-500 py-1 w-9" colSpan={3} />
              <th className="border border-neutral-500 py-2 px-2 text-center font-semibold">
                対戦B
              </th>
              <th className="border border-neutral-500 py-2 w-9" />
              <th className="border border-neutral-500 py-2 w-9" />
            </tr>
          </thead>
          <tbody>
            {content.rows.map((row) => (
              <tr key={row.index}>
                <td className={`${cellBorder} bg-[#6d9eeb] text-white text-center font-bold w-10`}>
                  {row.index}
                </td>
                <td className={blankCell} />
                <td className={countCell}>{row.homeAppearance}</td>
                <td
                  className={`${cellBorder} text-center font-semibold px-2 whitespace-nowrap`}
                  style={{
                    backgroundColor: row.homeTeam.color,
                    color: getContrastTextColor(row.homeTeam.color),
                  }}
                >
                  {row.homeTeam.name}
                </td>
                <td className={blankCell} />
                <td className={`${cellBorder} bg-white text-center text-gray-500 w-9`}>-</td>
                <td className={blankCell} />
                <td
                  className={`${cellBorder} text-center font-semibold px-2 whitespace-nowrap`}
                  style={{
                    backgroundColor: row.awayTeam.color,
                    color: getContrastTextColor(row.awayTeam.color),
                  }}
                >
                  {row.awayTeam.name}
                </td>
                <td className={countCell}>{row.awayAppearance}</td>
                <td className={blankCell} />
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="text-xs text-gray-400 text-right px-4 py-3 border-t border-gray-100">
        対戦表 · {generatedAt}
      </p>
    </div>
  );
}
