import "server-only";

export async function getOverviewPdfPageCount(buffer: Buffer): Promise<number> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getInfo();
    return result.total;
  } finally {
    await parser.destroy();
  }
}

export async function renderOverviewPdfPage(
  buffer: Buffer,
  pageNumber: number,
): Promise<Buffer> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getScreenshot({
      partial: [pageNumber],
      scale: 1.5,
      imageDataUrl: false,
      imageBuffer: true,
    });
    const page = result.pages[0];
    if (!page?.data) {
      throw new Error("PDF page render failed");
    }
    return Buffer.isBuffer(page.data) ? page.data : Buffer.from(page.data);
  } finally {
    await parser.destroy();
  }
}
