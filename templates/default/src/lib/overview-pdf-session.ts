import type { OverviewPdf } from "@/lib/types/syllabus-detail";

/** 概要タブの PDF 一覧（sortOrder 順）の N 番目を第 N 回に紐付ける */
export function getOverviewPdfForSession(
  pdfs: OverviewPdf[],
  sessionNumber: number,
): OverviewPdf | null {
  const index = sessionNumber - 1;
  if (index < 0 || index >= pdfs.length) return null;
  return pdfs[index] ?? null;
}

export function isDemoOverviewPdf(pdfId: string): boolean {
  return pdfId.startsWith("demo-overview-pdf");
}

export function getOverviewPdfUrl(pdfId: string): string {
  return `/api/overview-pdfs/${pdfId}`;
}
