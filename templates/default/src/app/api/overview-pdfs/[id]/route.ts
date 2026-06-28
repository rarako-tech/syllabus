import { NextResponse } from "next/server";
import { getOverviewPdfAccess } from "@/actions/syllabus-detail";
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
    const encodedName = encodeURIComponent(access.fileName);

    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename*=UTF-8''${encodedName}`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
