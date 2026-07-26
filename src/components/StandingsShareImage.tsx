"use client";

import type { StandingsExportContent } from "@/lib/standingsExport";
import { formatDateShort } from "@/lib/standings";
import StandingsTable from "@/components/StandingsTable";

interface StandingsShareImageProps {
  content: StandingsExportContent;
}

function buildHeaderLine(content: StandingsExportContent): string {
  const parts = ["ボッチャリーグひめじ", content.title];
  if (content.subtitle) parts.push(content.subtitle);
  if (content.roundDate) parts.push(formatDateShort(content.roundDate));
  return parts.join(" · ");
}

export default function StandingsShareImage({ content }: StandingsShareImageProps) {
  const generatedAt = new Date().toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="w-max min-w-[720px] max-w-none bg-white font-sans text-gray-800">
      <div className="h-1 bg-stripe" />
      <div className="px-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-9 h-9 flex-shrink-0">
            <span className="boccia-ball absolute top-0 left-0 w-6 h-6 bg-primary" />
            <span className="boccia-ball absolute bottom-0 right-0 w-6 h-6 bg-accent" />
          </div>
          <p className="text-sm font-bold text-primary-dark leading-normal whitespace-nowrap">
            {buildHeaderLine(content)}
          </p>
        </div>

        {content.sections.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">表示できる順位データがありません</p>
        ) : (
          <div className="space-y-6">
            {content.sections.map((section) => (
              <div key={section.label || "main"}>
                {section.label && (
                  <h3 className="text-base font-bold text-primary-dark mb-3 flex items-center gap-2">
                    {section.league && (
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          section.league === "A" ? "bg-primary" : "bg-accent"
                        }`}
                      >
                        {section.league}
                      </span>
                    )}
                    {section.label}
                  </h3>
                )}
                <div className="rounded-2xl overflow-hidden ring-1 ring-primary/10 border border-gray-100 bg-white">
                  <StandingsTable standings={section.standings} exportMode />
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 text-right mt-4 pt-3 border-t border-gray-100">
          公式順位表 · {generatedAt}
        </p>
      </div>
    </div>
  );
}
