"use server";

import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { syllabusSessions, syllabuses, syllabusOverviewSlides } from "@/db/schema";
import { failure, success, type ActionResult } from "@/lib/action-result";
import { requireAuthContext } from "@/lib/auth";
import {
  extractSentencePatterns,
  getOverviewSlideForSession,
} from "@/lib/overview-slide-session";
import {
  buildDemoWorksheet,
  generateWorksheetWithAnthropic,
} from "@/lib/worksheet-generator";
import {
  buildWorksheetDocx,
  getWorksheetFileName,
} from "@/lib/worksheet-docx.server";

async function requireSessionInOrg(sessionId: string, organizationId: string) {
  const [row] = await db
    .select({
      id: syllabusSessions.id,
      sessionNumber: syllabusSessions.sessionNumber,
      title: syllabusSessions.title,
      syllabusId: syllabusSessions.syllabusId,
    })
    .from(syllabusSessions)
    .innerJoin(syllabuses, eq(syllabusSessions.syllabusId, syllabuses.id))
    .where(
      and(
        eq(syllabusSessions.id, sessionId),
        eq(syllabuses.organizationId, organizationId),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function generateSessionWorksheet(input: {
  sessionId: string;
  demo?: boolean;
  sessionNumber?: number;
  sessionTitle?: string;
  overviewContent?: string;
}): Promise<
  ActionResult<{ fileName: string; fileBase64: string }>
> {
  let sessionNumber: number;
  let sessionTitle: string;
  let contentText: string;

  if (input.demo) {
    if (
      input.sessionNumber == null ||
      !input.sessionTitle ||
      input.overviewContent == null
    ) {
      return failure("デモ用の回情報が不足しています");
    }
    sessionNumber = input.sessionNumber;
    sessionTitle = input.sessionTitle;
    contentText = input.overviewContent;
  } else {
    const ctx = await requireAuthContext();
    const session = await requireSessionInOrg(input.sessionId, ctx.organizationId);
    if (!session) return failure("回が見つかりません");

    const overviewSlideRows = await db
      .select()
      .from(syllabusOverviewSlides)
      .where(eq(syllabusOverviewSlides.syllabusId, session.syllabusId))
      .orderBy(asc(syllabusOverviewSlides.sortOrder));

    const overviewSlides = overviewSlideRows.map((slide) => ({
      id: slide.id,
      title: slide.title,
      content: slide.content,
    }));

    const overviewSlide = getOverviewSlideForSession(
      overviewSlides,
      session.sessionNumber,
    );

    if (!overviewSlide) {
      return failure(
        `概要タブの第${session.sessionNumber}回スライドが見つかりません。内容を入力してください。`,
      );
    }

    sessionNumber = session.sessionNumber;
    sessionTitle = session.title;
    contentText = overviewSlide.content;
  }

  const patterns = extractSentencePatterns(contentText);
  if (patterns.length === 0) {
    return failure(
      "概要タブの各回スライド「内容」に文型リストを入力してください（1行1文型）。",
    );
  }

  let worksheet;
  try {
    worksheet = input.demo
      ? buildDemoWorksheet(patterns)
      : await generateWorksheetWithAnthropic({
          sessionNumber,
          sessionTitle,
          contentText,
          patterns,
        });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "ワークシートの生成に失敗しました";
    return failure(message);
  }

  try {
    const buffer = await buildWorksheetDocx({
      sessionNumber,
      sessionTitle,
      worksheet,
    });

    return success({
      fileName: getWorksheetFileName(sessionNumber),
      fileBase64: buffer.toString("base64"),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Wordファイルの作成に失敗しました";
    return failure(message);
  }
}
