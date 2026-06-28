"use server";

import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSyllabusDetail } from "@/actions/syllabus-detail";
import { db } from "@/db";
import {
  sessionScheduleItems,
  syllabusOverviewPdfs,
  syllabusOverviewSlides,
  syllabusSessions,
  syllabuses,
} from "@/db/schema";
import { failure, success, type ActionResult } from "@/lib/action-result";
import { requireAuthContext } from "@/lib/auth";
import { readOverviewPdf } from "@/lib/overview-pdf-storage";
import type { SyllabusOverview, SyllabusSession } from "@/lib/types/syllabus-detail";

type SyncResult = {
  sessions: SyllabusSession[];
  message: string;
  schedulesGenerated: boolean;
};

async function requireSyllabusInOrg(syllabusId: string, organizationId: string) {
  const [row] = await db
    .select()
    .from(syllabuses)
    .where(
      and(
        eq(syllabuses.id, syllabusId),
        eq(syllabuses.organizationId, organizationId),
      ),
    )
    .limit(1);

  return row ?? null;
}

async function syncSessionsFromOverviewSlides(
  syllabusId: string,
  overviewSlides: { title: string; content: string }[],
  plannedSessionCount: number | null,
) {
  const targets =
    overviewSlides.length > 0
      ? overviewSlides.map((slide, index) => ({
          sessionNumber: index + 1,
          title: slide.title.trim() || `第${index + 1}回`,
          learningObjectives: slide.content.trim() || null,
        }))
      : Array.from({ length: plannedSessionCount ?? 0 }, (_, index) => ({
          sessionNumber: index + 1,
          title: `第${index + 1}回`,
          learningObjectives: null,
        }));

  if (targets.length === 0) {
    return db
      .select()
      .from(syllabusSessions)
      .where(eq(syllabusSessions.syllabusId, syllabusId))
      .orderBy(
        asc(syllabusSessions.sortOrder),
        asc(syllabusSessions.sessionNumber),
      );
  }

  const existing = await db
    .select()
    .from(syllabusSessions)
    .where(eq(syllabusSessions.syllabusId, syllabusId));

  const existingByNumber = new Map(
    existing.map((session) => [session.sessionNumber, session]),
  );

  for (const target of targets) {
    const current = existingByNumber.get(target.sessionNumber);
    if (current) {
      await db
        .update(syllabusSessions)
        .set({
          title: target.title,
          learningObjectives: target.learningObjectives,
          sortOrder: target.sessionNumber - 1,
        })
        .where(eq(syllabusSessions.id, current.id));
    } else {
      await db.insert(syllabusSessions).values({
        syllabusId,
        sessionNumber: target.sessionNumber,
        title: target.title,
        learningObjectives: target.learningObjectives,
        sortOrder: target.sessionNumber - 1,
      });
    }
  }

  return db
    .select()
    .from(syllabusSessions)
    .where(eq(syllabusSessions.syllabusId, syllabusId))
    .orderBy(
      asc(syllabusSessions.sortOrder),
      asc(syllabusSessions.sessionNumber),
    );
}

async function saveGeneratedSessionSchedule(
  sessionId: string,
  items: {
    time: string;
    content: string;
    teacherAction?: string;
    studentActivity?: string;
    materials?: string;
  }[],
) {
  await db.transaction(async (tx) => {
    await tx
      .delete(sessionScheduleItems)
      .where(eq(sessionScheduleItems.sessionId, sessionId));

    if (items.length === 0) return;

    await tx.insert(sessionScheduleItems).values(
      items.map((item, index) => ({
        sessionId,
        sortOrder: index,
        time: item.time,
        content: item.content,
        teacherAction: item.teacherAction?.trim() || null,
        studentActivity: item.studentActivity?.trim() || null,
        materials: item.materials?.trim() || null,
      })),
    );
  });
}

async function generateScheduleDrafts(
  syllabusId: string,
  overview: SyllabusOverview,
  sessions: (typeof syllabusSessions.$inferSelect)[],
  pdfRows: (typeof syllabusOverviewPdfs.$inferSelect)[],
  overviewSlideRows: { title: string; content: string }[],
  options?: { onlyMissing?: boolean },
) {
  const { extractPdfText } = await import("@/lib/pdf-text.server");
  const { generateLessonDraftForSession } = await import(
    "@/lib/lesson-draft-generator"
  );
  const pdfTexts: { fileName: string; text: string }[] = [];

  for (let index = 0; index < Math.max(pdfRows.length, sessions.length); index++) {
    const pdf = pdfRows[index];
    const slide = overviewSlideRows[index];
    const fallbackText =
      slide?.content.trim() ||
      sessions[index]?.learningObjectives?.trim() ||
      "";

    if (!pdf) {
      if (fallbackText) {
        pdfTexts[index] = {
          fileName: `第${index + 1}回（概要）`,
          text: fallbackText,
        };
      }
      continue;
    }

    try {
      const buffer = await readOverviewPdf(syllabusId, pdf.id);
      const text = await extractPdfText(buffer);
      pdfTexts[index] = {
        fileName: pdf.fileName,
        text: text.trim() || fallbackText,
      };
    } catch {
      pdfTexts[index] = {
        fileName: pdf.fileName,
        text: fallbackText,
      };
    }
  }

  const usableTexts = pdfTexts.filter((pdf) => pdf?.text.trim());
  if (usableTexts.length === 0) {
    throw new Error(
      "教材テキストがありません。PDFに文字が含まれていない場合は、概要の「内容」欄を入力してください",
    );
  }

  let targets = sessions;
  if (options?.onlyMissing) {
    const existingCounts = await db
      .select({
        sessionId: sessionScheduleItems.sessionId,
        count: sql<number>`count(*)::int`,
      })
      .from(sessionScheduleItems)
      .where(
        inArray(
          sessionScheduleItems.sessionId,
          sessions.map((session) => session.id),
        ),
      )
      .groupBy(sessionScheduleItems.sessionId);

    const countBySessionId = new Map(
      existingCounts.map((row) => [row.sessionId, row.count]),
    );
    targets = sessions.filter((session) => !countBySessionId.get(session.id));
  }

  if (targets.length === 0) {
    return { insertedCount: 0, failedSessions: [] as number[] };
  }

  let insertedCount = 0;
  const failedSessions: number[] = [];

  for (const session of targets) {
    try {
      const generated = await generateLessonDraftForSession(
        overview,
        {
          sessionNumber: session.sessionNumber,
          title: session.title,
          learningObjectives: session.learningObjectives ?? "",
        },
        pdfTexts,
      );

      await saveGeneratedSessionSchedule(session.id, generated.items);
      insertedCount += generated.items.length;
    } catch {
      failedSessions.push(session.sessionNumber);
    }
  }

  if (insertedCount === 0) {
    throw new Error(
      failedSessions.length > 0
        ? `スケジュール生成に失敗しました（第${failedSessions.join("、")}回）`
        : "スケジュール行が1件も生成されませんでした。再生成をお試しください",
    );
  }

  return { insertedCount, failedSessions };
}

async function loadOverviewContext(syllabusId: string) {
  const overviewSlideRows = await db
    .select()
    .from(syllabusOverviewSlides)
    .where(eq(syllabusOverviewSlides.syllabusId, syllabusId))
    .orderBy(asc(syllabusOverviewSlides.sortOrder));

  const pdfRows = await db
    .select()
    .from(syllabusOverviewPdfs)
    .where(eq(syllabusOverviewPdfs.syllabusId, syllabusId))
    .orderBy(asc(syllabusOverviewPdfs.sortOrder));

  return { overviewSlideRows, pdfRows };
}

/** 概要スライドから各回を同期し、PDFがあれば②ペインのスケジュールも生成する */
export async function syncAndGenerateFromOverview(
  syllabusId: string,
): Promise<ActionResult<SyncResult>> {
  try {
    const ctx = await requireAuthContext();
    const syllabus = await requireSyllabusInOrg(syllabusId, ctx.organizationId);
    if (!syllabus) return failure("シラバスが見つかりません");

    const { overviewSlideRows, pdfRows } = await loadOverviewContext(syllabusId);

    const overviewSlides = overviewSlideRows.map((slide) => ({
      title: slide.title,
      content: slide.content,
    }));

    const sessions = await syncSessionsFromOverviewSlides(
      syllabusId,
      overviewSlides,
      syllabus.plannedSessionCount,
    );

    if (sessions.length === 0) {
      return failure(
        "各回の概要を入力してください（概要タブのスライド欄）",
      );
    }

    if (pdfRows.length === 0) {
      revalidatePath(`/syllabuses/${syllabusId}`);
      const detail = await getSyllabusDetail(syllabusId);
      if (!detail) return failure("データの取得に失敗しました");

      return success({
        sessions: detail.sessions,
        message: "各回の内容を更新しました。スケジュール生成にはPDFが必要です。",
        schedulesGenerated: false,
      });
    }

    const overview: SyllabusOverview = {
      textbookName: syllabus.textbookName ?? "",
      courseGoals: syllabus.courseGoals ?? "",
      targetStudentLevel: syllabus.targetStudentLevel ?? "",
      plannedSessionCount: syllabus.plannedSessionCount ?? null,
      slides: overviewSlideRows.map((slide) => ({
        id: slide.id,
        title: slide.title,
        content: slide.content,
      })),
      pdfs: pdfRows.map((pdf) => ({ id: pdf.id, fileName: pdf.fileName })),
    };

    try {
      const { insertedCount, failedSessions } = await generateScheduleDrafts(
        syllabusId,
        overview,
        sessions,
        pdfRows,
        overviewSlideRows,
        { onlyMissing: true },
      );

      revalidatePath(`/syllabuses/${syllabusId}`);

      const detail = await getSyllabusDetail(syllabusId);
      if (!detail) return failure("生成後のデータ取得に失敗しました");

      if (insertedCount === 0 && failedSessions.length === 0) {
        return success({
          sessions: detail.sessions,
          message: "各回の内容を更新しました（スケジュールは既に生成済みです）。",
          schedulesGenerated: true,
        });
      }

      if (failedSessions.length > 0) {
        return success({
          sessions: detail.sessions,
          message: `一部の回のスケジュール生成に失敗しました（第${failedSessions.join("、")}回）。「スケジュールを再生成」をもう一度押すと、未生成の回だけ再試行します。`,
          schedulesGenerated: true,
        });
      }

      return success({
        sessions: detail.sessions,
        message: "各回の内容とスケジュールを生成しました。",
        schedulesGenerated: true,
      });
    } catch (scheduleError) {
      revalidatePath(`/syllabuses/${syllabusId}`);

      const detail = await getSyllabusDetail(syllabusId);
      if (!detail) return failure("データの取得に失敗しました");

      const scheduleMessage =
        scheduleError instanceof Error
          ? scheduleError.message
          : "スケジュールの自動生成に失敗しました";

      return success({
        sessions: detail.sessions,
        message: `各回の内容は更新しました。スケジュール生成: ${scheduleMessage}`,
        schedulesGenerated: false,
      });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "自動生成に失敗しました";
    return failure(message);
  }
}

export async function generateLessonDraftsFromOverview(
  syllabusId: string,
): Promise<
  ActionResult<{
    sessions: SyllabusSession[];
    message: string;
    schedulesGenerated: boolean;
  }>
> {
  const ctx = await requireAuthContext();
  const syllabus = await requireSyllabusInOrg(syllabusId, ctx.organizationId);
  if (!syllabus) return failure("シラバスが見つかりません");

  const { pdfRows } = await loadOverviewContext(syllabusId);
  if (pdfRows.length === 0) {
    return failure("PDFをアップロードしてからたたき台を生成してください");
  }

  const result = await syncAndGenerateFromOverview(syllabusId);
  if (!result.ok) return result;

  return success({
    sessions: result.data.sessions,
    message: result.data.message,
    schedulesGenerated: result.data.schedulesGenerated,
  });
}
