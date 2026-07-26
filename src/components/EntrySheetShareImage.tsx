"use client";

import type { EntrySheetExportContent, EntrySheetTeamBlock } from "@/lib/entrySheetExport";
import {
  ENTRY_SHEET_GRID_COLUMNS,
  ENTRY_SHEET_PAGE_HEIGHT_PX,
  ENTRY_SHEET_PAGE_WIDTH_PX,
} from "@/lib/entrySheetExport";
import { getContrastTextColor } from "@/lib/resultsEditor";
import { formatDateShort } from "@/lib/standings";

interface EntrySheetShareImageProps {
  content: EntrySheetExportContent;
}

const AWARD_HEADERS = ["ス", "ユ", "盛"] as const;

/** 表内セル（細線・グレー） */
const innerBorder = "border border-gray-300";
const cell = `${innerBorder} text-center align-middle text-[10px] leading-tight px-0.5`;
const headerOrange = `${innerBorder} bg-[#f6b26b] text-black text-center font-bold text-[10px] py-0.5`;
const participateCell = `${innerBorder} bg-[#d9d9d9] text-center align-middle py-0.5`;
const awardCell = `${innerBorder} bg-white text-center align-middle py-0.5 min-h-[18px]`;

/** チームブロック間の区切り（太線） */
const segmentRight = "border-r-[2px] border-r-black";
const segmentBottom = "border-b-[2px] border-b-black";

function HandwriteCheckbox() {
  return (
    <span
      className="inline-block w-[13px] h-[13px] border-[1.5px] border-gray-500 bg-white rounded-[2px] box-border"
      aria-hidden
    />
  );
}

function TeamEntryBlock({ block }: { block: EntrySheetTeamBlock }) {
  const { team, index, slots } = block;
  const textColor = getContrastTextColor(team.color);

  return (
    <div className="flex flex-col min-w-0 bg-white h-full">
      <div className={`${innerBorder} bg-[#d9d9d9] text-center text-[10px] font-bold py-0.5`}>
        {index}
      </div>
      <table className="w-full border-collapse table-fixed flex-1">
        <thead>
          <tr>
            <th className={`${headerOrange} w-[18%]`}>チーム名</th>
            <th className={`${headerOrange} w-[9%]`}>番号</th>
            <th className={`${headerOrange} w-[32%]`}>名前</th>
            <th className={`${headerOrange} w-[11%]`}>参加</th>
            {AWARD_HEADERS.map((label) => (
              <th key={label} className={`${headerOrange} w-[10%]`}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map((slot, rowIndex) => (
            <tr key={slot.number}>
              {rowIndex === 0 && (
                <td
                  rowSpan={slots.length}
                  className={`${innerBorder} text-center font-bold text-[11px] align-middle px-0.5`}
                  style={{ backgroundColor: team.color, color: textColor }}
                >
                  <span className="block break-all leading-snug">{team.name}</span>
                </td>
              )}
              <td className={`${cell} tabular-nums`}>{slot.number}</td>
              <td className={`${cell} text-left pl-1 truncate`}>{slot.name}</td>
              <td className={participateCell}>
                <HandwriteCheckbox />
              </td>
              {AWARD_HEADERS.map((label) => (
                <td key={label} className={awardCell} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function buildMetaLine(content: EntrySheetExportContent): string {
  const parts = ["ボッチャリーグひめじ", `${content.season}シーズン`, content.roundLabel, "エントリー表"];
  if (content.roundDate) parts.push(formatDateShort(content.roundDate));
  return parts.join(" · ");
}

export default function EntrySheetShareImage({ content }: EntrySheetShareImageProps) {
  if (content.pages.length === 0) {
    return (
      <div
        className="bg-white font-sans text-gray-800 flex items-center justify-center"
        style={{ width: ENTRY_SHEET_PAGE_WIDTH_PX, height: ENTRY_SHEET_PAGE_HEIGHT_PX }}
      >
        <p className="text-sm text-gray-500">表示できるチームがありません</p>
      </div>
    );
  }

  return (
    <div className="font-sans text-gray-900 bg-white">
      {content.pages.map((page) => {
        const rowCount = Math.ceil(page.teams.length / ENTRY_SHEET_GRID_COLUMNS);

        return (
          <div
            key={page.pageNumber}
            data-entry-page={page.pageNumber}
            className="bg-white box-border border-[2px] border-black"
            style={{
              width: ENTRY_SHEET_PAGE_WIDTH_PX,
              minHeight: ENTRY_SHEET_PAGE_HEIGHT_PX,
              padding: "10px 12px",
            }}
          >
            <div className="flex items-center justify-between gap-2 mb-2 border-b border-gray-300 pb-1.5">
              <p className="text-[11px] font-bold text-gray-800 truncate">{buildMetaLine(content)}</p>
              {page.totalPages > 1 && (
                <p className="text-[10px] text-gray-500 shrink-0 tabular-nums">
                  {page.pageNumber} / {page.totalPages}
                </p>
              )}
            </div>

            <div
              className="grid gap-0 border-[2px] border-black"
              style={{
                gridTemplateColumns: `repeat(${ENTRY_SHEET_GRID_COLUMNS}, minmax(0, 1fr))`,
              }}
            >
              {page.teams.map((block, teamIndex) => {
                const col = teamIndex % ENTRY_SHEET_GRID_COLUMNS;
                const row = Math.floor(teamIndex / ENTRY_SHEET_GRID_COLUMNS);
                const isLastCol = col === ENTRY_SHEET_GRID_COLUMNS - 1;
                const isLastRow = row === rowCount - 1;

                return (
                  <div
                    key={block.team.id}
                    className={[
                      !isLastCol ? segmentRight : "",
                      !isLastRow ? segmentBottom : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <TeamEntryBlock block={block} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
