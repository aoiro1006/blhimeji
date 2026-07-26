"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LeagueData, PlayerRoundAwards } from "@/types";
import EntrySheetShareImage from "@/components/EntrySheetShareImage";
import {
  buildEntrySheetExportFilename,
  buildEntrySheetPdfFilename,
  ENTRY_SHEET_A3_HEIGHT_MM,
  ENTRY_SHEET_A3_WIDTH_MM,
  getEntrySheetExportContent,
} from "@/lib/entrySheetExport";
import { getLogicalRoundRoot } from "@/lib/logicalRounds";

interface EntrySheetExportModalProps {
  data: LeagueData;
  roundId: string;
  editedAwards: PlayerRoundAwards[];
  onClose: () => void;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureEntrySheetPages(container: HTMLElement): Promise<string[]> {
  const { toJpeg } = await import("html-to-image");
  const pageElements = container.querySelectorAll<HTMLElement>("[data-entry-page]");
  const images: string[] = [];

  for (const pageEl of pageElements) {
    const height = Math.max(pageEl.offsetHeight, pageEl.scrollHeight);
    const dataUrl = await toJpeg(pageEl, {
      quality: 0.92,
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: "#ffffff",
      skipFonts: false,
      width: pageEl.offsetWidth,
      height,
    });
    images.push(dataUrl);
  }

  return images;
}

export default function EntrySheetExportModal({
  data,
  roundId,
  editedAwards,
  onClose,
}: EntrySheetExportModalProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState<"pdf" | "jpg" | null>(null);
  const [error, setError] = useState("");

  const content = useMemo(
    () => getEntrySheetExportContent(data, roundId, editedAwards),
    [data, roundId, editedAwards]
  );

  const round = useMemo(
    () => getLogicalRoundRoot(data, roundId),
    [data, roundId]
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    document.body.classList.add("entry-sheet-printing");
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      document.body.classList.remove("entry-sheet-printing");
    };
  }, [onClose]);

  const handleDownloadPdf = useCallback(async () => {
    if (!captureRef.current || content.pages.length === 0) return;
    setDownloading("pdf");
    setError("");

    try {
      const images = await captureEntrySheetPages(captureRef.current);
      const { jsPDF } = await import("jspdf");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a3",
      });

      images.forEach((dataUrl, index) => {
        if (index > 0) pdf.addPage([ENTRY_SHEET_A3_WIDTH_MM, ENTRY_SHEET_A3_HEIGHT_MM], "portrait");
        pdf.addImage(
          dataUrl,
          "JPEG",
          0,
          0,
          ENTRY_SHEET_A3_WIDTH_MM,
          ENTRY_SHEET_A3_HEIGHT_MM
        );
      });

      pdf.save(buildEntrySheetPdfFilename(data, round));
    } catch {
      setError("PDFのダウンロードに失敗しました。もう一度お試しください。");
    } finally {
      setDownloading(null);
    }
  }, [content.pages.length, data, round]);

  const handleDownloadJpg = useCallback(async () => {
    if (!captureRef.current || content.pages.length === 0) return;
    setDownloading("jpg");
    setError("");

    try {
      const images = await captureEntrySheetPages(captureRef.current);

      for (let i = 0; i < images.length; i++) {
        const link = document.createElement("a");
        link.href = images[i];
        link.download = buildEntrySheetExportFilename(
          data,
          round,
          i + 1,
          content.pages.length
        );
        link.click();

        if (i < images.length - 1) {
          await delay(400);
        }
      }
    } catch {
      setError("画像のダウンロードに失敗しました。もう一度お試しください。");
    } finally {
      setDownloading(null);
    }
  }, [content.pages.length, data, round]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const isDownloading = downloading !== null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 entry-sheet-export-modal">
      <button
        type="button"
        aria-label="閉じる"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] entry-sheet-export-backdrop"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-export-title"
        className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col entry-sheet-export-dialog"
      >
        <div className="h-1 bg-stripe shrink-0 entry-sheet-export-chrome" />
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3 shrink-0 entry-sheet-export-chrome">
          <div>
            <h2 id="entry-export-title" className="font-bold text-lg text-primary-dark">
              エントリー表プレビュー（A3縦）
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              3列レイアウト · 選手8枠 · 参加欄は手書き用 · {content.pages.length}ページ
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 shrink-0"
            aria-label="閉じる"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 overflow-auto flex-1 bg-gray-50 entry-sheet-export-preview">
          <div className="flex flex-col items-center gap-6" data-entry-print-root ref={captureRef}>
            <EntrySheetShareImage content={content} />
          </div>
        </div>

        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 shrink-0 space-y-3 entry-sheet-export-chrome">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <p className="text-xs text-gray-500">
            PDFは全ページを1ファイルにまとめて保存します。印刷時は「A3・縦」を選んでください。
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => void handleDownloadPdf()}
              disabled={isDownloading || content.pages.length === 0}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {downloading === "pdf"
                ? "生成中..."
                : content.pages.length > 1
                  ? `PDFをダウンロード（全${content.pages.length}ページ）`
                  : "PDFをダウンロード"}
            </button>
            <button
              type="button"
              onClick={() => void handleDownloadJpg()}
              disabled={isDownloading || content.pages.length === 0}
              className="btn-secondary flex-1 sm:flex-none disabled:opacity-50"
            >
              {downloading === "jpg" ? "生成中..." : "JPG（ページ別）"}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={isDownloading || content.pages.length === 0}
              className="btn-secondary flex-1 sm:flex-none sm:min-w-[100px] disabled:opacity-50"
            >
              印刷
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 sm:flex-none sm:min-w-[80px]"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
