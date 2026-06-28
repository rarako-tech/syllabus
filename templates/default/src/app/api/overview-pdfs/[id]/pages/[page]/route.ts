import { NextResponse } from "next/server";
import { getOverviewPdfAccess } from "@/actions/syllabus-detail";
import { renderOverviewPdfPage } from "@/lib/overview-pdf-render.server";
import { readOverviewPdf } from "@/lib/overview-pdf-storage";

type Props = { params: Promise<{ id: string; page: string }> };

export async function GET(_request: Request, { params }: Props) {
  const { id, page: pageParam } = await params;
  const pageNumber = Number.parseInt(pageParam, 10);

  if (!Number.isFinite(pageNumber) || pageNumber < 1) {
    return NextResponse.json({ error: "Invalid page number" }, { status: 400 });
  }

  let access;
  try {
    access = await getOverviewPdfAccess(id);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!access) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const data = await readOverviewPdf(access.syllabusId, access.id);
    const png = await renderOverviewPdfPage(data, pageNumber);

    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to render page" }, { status: 500 });
  }
}
