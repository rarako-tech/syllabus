import { NextResponse } from "next/server";
import { getOverviewPdfAccess } from "@/actions/syllabus-detail";
import { getOverviewPdfPageCount } from "@/lib/overview-pdf-render.server";
import { readOverviewPdf } from "@/lib/overview-pdf-storage";

type Props = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;

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
    const pageCount = await getOverviewPdfPageCount(data);

    return NextResponse.json({
      fileName: access.fileName,
      pageCount,
    });
  } catch {
    return NextResponse.json({ error: "Failed to read PDF" }, { status: 500 });
  }
}
