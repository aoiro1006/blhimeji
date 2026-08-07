"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LeagueData, Match } from "@/types";
import MatchPairingsShareImage from "@/components/MatchPairingsShareImage";
import {
  buildMatchPairingsExportFilename,
  buildMatchPairingsPdfFilename,
  getMatchPairingsExportContent,
} from "@/lib/matchPairingsExport";

interface MatchPairingsExportModalProps {
  data: LeagueData;
  roundId: string;
  matches: Match[];
  onClose: () => void;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = dataUrl;
  });
}

export default function MatchPairingsExportModal({
  data,
  roundId,
  matches,
  onClose,
}: MatchPairingsExportModalProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState<"pdf" | "jpg" | null>(null);
  const [error, setError] = useState("");

  const content = useMemo(
    () => getMatchPairingsExportContent(data, roundId, matches),
    [data, roundId, matches]
  );

  const jpgFilename = useMemo(
    () => buildMatchPairingsExportFilename(data, roundId),
    [data, roundId]
  );

  const pdfFilename = useMemo(
    () => buildMatchPairingsPdfFilename(data, roundId),
    [data, roundId]
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const captureJpeg = useCallback(async () => {
    if (!captureRef.current) throw new Error("capture target missing");
    const { toJpeg } = await import("html-to-image");
    return toJpeg(captureRef.current, {
      quality: 0.92,
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: "#ffffff",
      skipFonts: false,
    });
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    if (!captureRef.current || content.rows.length === 0) return;
    setDownloading("pdf");
    setError("");
    try {
      const dataUrl = await captureJpeg();
      const img = await loadImage(dataUrl);
      const { jsPDF } = await import("jspdf");

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const maxW = pageW - margin * 2;
      const maxH = pageH - margin * 2;
      const ratio = img.width / img.height;

      let drawW = maxW;
      let drawH = drawW / ratio;
      if (drawH > maxH) {
        drawH = maxH;
        drawW = drawH * ratio;
      }

      const x = (pageW - drawW) / 2;
      const y = (pageH - drawH) / 2;
      pdf.addImage(dataUrl, "JPEG", x, y, drawW, drawH);
      pdf.save(pdfFilename);
    } catch {
      setError("PDFのダウンロードに失敗しました。もう一度お試しください。");
    } finally {
      setDownloading(null);
    }
  }, [captureJpeg, content.rows.length, pdfFilename]);

  const handleDownloadJpg = useCallback(async () => {
    if (!captureRef.current || content.rows.length === 0) return;
    setDownloading("jpg");
    setError("");
    try {
      const dataUrl = await captureJpeg();
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = jpgFilename;
      link.click();
    } catch {
      setError("画像のダウンロードに失敗しました。もう一度お試しください。");
    } finally {
      setDownloading(null);
    }
  }, [captureJpeg, content.rows.length, jpgFilename]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="閉じる"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pairings-export-title"
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        <div className="h-1 bg-stripe shrink-0" />
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3 shrink-0">
          <div>
            <h2 id="pairings-export-title" className="font-bold text-lg text-primary-dark">
              対戦表プレビュー
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              画面表示どおりの対戦表をPDF（A4横）またはJPGで保存できます。
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

        <div className="px-5 py-4 overflow-auto flex-1 bg-gray-50">
          <div className="flex justify-center">
            <div ref={captureRef} className="shadow-lg rounded-xl border border-gray-200 overflow-hidden">
              <MatchPairingsShareImage content={content} />
            </div>
          </div>
        </div>

        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 shrink-0 space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading !== null || content.rows.length === 0}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {downloading === "pdf" ? "PDF生成中..." : "PDFをダウンロード"}
            </button>
            <button
              type="button"
              onClick={handleDownloadJpg}
              disabled={downloading !== null || content.rows.length === 0}
              className="btn-secondary flex-1 disabled:opacity-50"
            >
              {downloading === "jpg" ? "JPG生成中..." : "JPGをダウンロード"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 sm:flex-none sm:min-w-[120px]"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
