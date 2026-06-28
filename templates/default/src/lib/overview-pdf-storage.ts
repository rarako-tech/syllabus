import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOAD_ROOT = path.join(process.cwd(), "var", "uploads", "overview-pdfs");

export function getOverviewPdfPath(syllabusId: string, pdfId: string) {
  return path.join(UPLOAD_ROOT, syllabusId, `${pdfId}.pdf`);
}

export async function saveOverviewPdf(
  syllabusId: string,
  pdfId: string,
  data: Buffer,
) {
  const dir = path.join(UPLOAD_ROOT, syllabusId);
  await mkdir(dir, { recursive: true });
  await writeFile(getOverviewPdfPath(syllabusId, pdfId), data);
}

export async function readOverviewPdf(syllabusId: string, pdfId: string) {
  return readFile(getOverviewPdfPath(syllabusId, pdfId));
}
