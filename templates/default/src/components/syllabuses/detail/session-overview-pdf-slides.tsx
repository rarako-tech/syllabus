"use client";

import { FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getOverviewPdfUrl,
  isDemoOverviewPdf,
} from "@/lib/overview-pdf-session";
import type { OverviewPdf } from "@/lib/types/syllabus-detail";

type Props = {
  pdf: OverviewPdf;
  sessionNumber: number;
  demo?: boolean;
};

type PdfMeta = {
  fileName: string;
  pageCount: number;
};

export function SessionOverviewPdfSlides({
  pdf,
  sessionNumber,
  demo,
}: Props) {
  const [meta, setMeta] = useState<PdfMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (demo && isDemoOverviewPdf(pdf.id)) {
      setLoading(false);
      setMeta(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const url = getOverviewPdfUrl(pdf.id) + "/meta";
        let response: Response | null = null;

        for (let attempt = 0; attempt < 3; attempt++) {
          response = await fetch(url, { credentials: "include" });
          if (response.ok || response.status === 404) break;
          if (attempt < 2) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1500 * (attempt + 1)),
            );
          }
        }

        if (!response?.ok) {
          throw new Error("PDF情報の取得に失敗しました");
        }

        const data = (await response.json()) as PdfMeta;
        if (!cancelled) {
          setMeta(data);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "PDFの読み込みに失敗しました",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdf.id, demo]);

  if (demo && isDemoOverviewPdf(pdf.id)) {
    return (
      <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
        <p className="text-xs font-medium text-muted-foreground">
          第{sessionNumber}回（概要PDF）
        </p>
        <div className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 break-all">{pdf.fileName}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          デモモードではPDFプレビューは表示されません。本番環境でアップロードすると各ページが表示されます。
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>PDFを読み込んでいます...</span>
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!meta || meta.pageCount === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        PDFにページがありません。
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
        <p className="text-xs font-medium text-muted-foreground">
          第{sessionNumber}回（概要PDF）
        </p>
        <p className="mt-0.5 text-sm">{meta.fileName}</p>
      </div>

      <ul className="space-y-3">
        {Array.from({ length: meta.pageCount }, (_, index) => {
          const pageNumber = index + 1;
          return (
            <li
              key={pageNumber}
              className="overflow-hidden rounded-lg border border-border bg-background"
            >
              <p className="border-b border-border bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
                スライド {pageNumber} / {meta.pageCount}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${getOverviewPdfUrl(pdf.id)}/pages/${pageNumber}`}
                alt={`${meta.fileName} ${pageNumber}ページ`}
                className="block w-full bg-white"
                loading="lazy"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
