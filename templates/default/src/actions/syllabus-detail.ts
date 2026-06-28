"use server";

import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  organizations,
  sessionReferences,
  sessionScheduleItems,
  sessionSlides,
  syllabusOverviewPdfs,
  syllabusOverviewSlides,
  syllabusSessions,
  syllabuses,
} from "@/db/schema";
import { failure, success, type ActionResult } from "@/lib/action-result";
import { requireAuthContext } from "@/lib/auth";
import { saveOverviewPdf } from "@/lib/overview-pdf-storage";
import { syllabusSessionSchema } from "@/lib/validations/syllabus-session";
import { scheduleItemSchema } from "@/lib/validations/session-schedule";
import { sessionReferenceSchema } from "@/lib/validations/session-reference";
import { sessionSlideSchema } from "@/lib/validations/session-slide";
import { syllabusOverviewSchema } from "@/lib/validations/syllabus-overview";
import type {
  OverviewPdf,
  OverviewSlide,
  ScheduleItem,
  SessionReference,
  SessionSlide,
  SyllabusDetail,
  SyllabusOverview,
  SyllabusSession,
} from "@/lib/types/syllabus-detail";

const MAX_OVERVIEW_PDF_BYTES = 10 * 1024 * 1024;
const MAX_OVERVIEW_PDFS_PER_UPLOAD = 20;

function isPdfFile(file: File) {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

function mapOverviewPdfs(
  rows: { id: string; fileName: string }[],
): OverviewPdf[] {
  return rows.map((pdf) => ({
    id: pdf.id,
    fileName: pdf.fileName,
  }));
}

export type SyllabusDetailAccess =
  | { status: "ok"; detail: SyllabusDetail }
  | { status: "not_found" }
  | { status: "wrong_org"; title: string; orgName: string }
  | { status: "unauthorized" };

export async function resolveSyllabusDetailAccess(
  syllabusId: string,
): Promise<SyllabusDetailAccess> {
  let ctx;
  try {
    ctx = await requireAuthContext();
  } catch {
    return { status: "unauthorized" };
  }

  const [syllabus] = await db
    .select({
      id: syllabuses.id,
      title: syllabuses.title,
      organizationId: syllabuses.organizationId,
    })
    .from(syllabuses)
    .where(eq(syllabuses.id, syllabusId))
    .limit(1);

  if (!syllabus) return { status: "not_found" };

  if (syllabus.organizationId !== ctx.organizationId) {
    const [org] = await db
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, syllabus.organizationId))
      .limit(1);
    return {
      status: "wrong_org",
      title: syllabus.title,
      orgName: org?.name ?? "別の組織",
    };
  }

  const detail = await getSyllabusDetail(syllabusId);
  if (!detail) return { status: "not_found" };
  return { status: "ok", detail };
}

function mapOverview(
  syllabus: typeof syllabuses.$inferSelect,
  slides: (typeof syllabusOverviewSlides.$inferSelect)[],
  pdfs: (typeof syllabusOverviewPdfs.$inferSelect)[],
): SyllabusOverview {
  return {
    textbookName: syllabus.textbookName ?? "",
    courseGoals: syllabus.courseGoals ?? "",
    targetStudentLevel: syllabus.targetStudentLevel ?? "",
    plannedSessionCount: syllabus.plannedSessionCount ?? null,
    slides: slides.map(
      (slide): OverviewSlide => ({
        id: slide.id,
        title: slide.title,
        content: slide.content,
      }),
    ),
    pdfs: mapOverviewPdfs(pdfs),
  };
}

export async function getSyllabusDetail(
  syllabusId: string,
): Promise<SyllabusDetail | null> {
  const ctx = await requireAuthContext();

  const [syllabus] = await db
    .select()
    .from(syllabuses)
    .where(
      and(
        eq(syllabuses.id, syllabusId),
        eq(syllabuses.organizationId, ctx.organizationId),
      ),
    )
    .limit(1);

  if (!syllabus) return null;

  const overviewSlideRows = await db
    .select()
    .from(syllabusOverviewSlides)
    .where(eq(syllabusOverviewSlides.syllabusId, syllabusId))
    .orderBy(asc(syllabusOverviewSlides.sortOrder));

  const overviewPdfRows = await db
    .select()
    .from(syllabusOverviewPdfs)
    .where(eq(syllabusOverviewPdfs.syllabusId, syllabusId))
    .orderBy(asc(syllabusOverviewPdfs.sortOrder));

  const overview = mapOverview(syllabus, overviewSlideRows, overviewPdfRows);

  const sessions = await db
    .select()
    .from(syllabusSessions)
    .where(eq(syllabusSessions.syllabusId, syllabusId))
    .orderBy(asc(syllabusSessions.sortOrder), asc(syllabusSessions.sessionNumber));

  const sessionIds = sessions.map((s) => s.id);
  if (!sessionIds.length) {
    return {
      id: syllabus.id,
      title: syllabus.title,
      description: syllabus.description,
      status: syllabus.status,
      overview,
      sessions: [],
    };
  }

  const [schedules, slides, references] = await Promise.all([
    db
      .select()
      .from(sessionScheduleItems)
      .where(inArray(sessionScheduleItems.sessionId, sessionIds))
      .orderBy(asc(sessionScheduleItems.sortOrder)),
    db
      .select()
      .from(sessionSlides)
      .where(inArray(sessionSlides.sessionId, sessionIds))
      .orderBy(asc(sessionSlides.sortOrder)),
    db
      .select()
      .from(sessionReferences)
      .where(inArray(sessionReferences.sessionId, sessionIds))
      .orderBy(asc(sessionReferences.sortOrder)),
  ]);

  const sessionsWithChildren: SyllabusSession[] = sessions.map((session) => ({
    id: session.id,
    sessionNumber: session.sessionNumber,
    sessionDate: session.sessionDate ?? null,
    title: session.title,
    learningObjectives: session.learningObjectives ?? "",
    preparation: session.preparation ?? "",
    scheduleItems: schedules
      .filter((s) => s.sessionId === session.id)
      .map(
        (s): ScheduleItem => ({
          id: s.id,
          time: s.time,
          content: s.content,
          teacherAction: s.teacherAction ?? "",
          studentActivity: s.studentActivity ?? "",
          materials: s.materials ?? "",
        }),
      ),
    slides: slides
      .filter((s) => s.sessionId === session.id)
      .map(
        (s): SessionSlide => ({
          id: s.id,
          title: s.title,
          thumbnailUrl: s.thumbnailUrl,
          linkUrl: s.linkUrl,
          linkProvider: s.linkProvider,
        }),
      ),
    references: references
      .filter((r) => r.sessionId === session.id)
      .map(
        (r): SessionReference => ({
          id: r.id,
          title: r.title,
          url: r.url,
          type: r.type ?? "",
          memo: r.memo ?? "",
        }),
      ),
  }));

  return {
    id: syllabus.id,
    title: syllabus.title,
    description: syllabus.description,
    status: syllabus.status,
    overview,
    sessions: sessionsWithChildren,
  };
}

export async function updateSyllabusOverview(
  syllabusId: string,
  input: unknown,
): Promise<ActionResult<{ slides: OverviewSlide[] }>> {
  const ctx = await requireAuthContext();
  const parsed = syllabusOverviewSchema.safeParse(input);
  if (!parsed.success) {
    return failure(
      "入力内容を確認してください",
      parsed.error.flatten().fieldErrors,
    );
  }

  const [syllabus] = await db
    .select({ id: syllabuses.id })
    .from(syllabuses)
    .where(
      and(
        eq(syllabuses.id, syllabusId),
        eq(syllabuses.organizationId, ctx.organizationId),
      ),
    )
    .limit(1);

  if (!syllabus) return failure("シラバスが見つかりません");

  await db.transaction(async (tx) => {
    await tx
      .update(syllabuses)
      .set({
        textbookName: parsed.data.textbookName?.trim() || null,
        courseGoals: parsed.data.courseGoals?.trim() || null,
        targetStudentLevel: parsed.data.targetStudentLevel?.trim() || null,
        plannedSessionCount: parsed.data.plannedSessionCount,
        updatedAt: new Date(),
      })
      .where(eq(syllabuses.id, syllabusId));

    await tx
      .delete(syllabusOverviewSlides)
      .where(eq(syllabusOverviewSlides.syllabusId, syllabusId));

    if (parsed.data.slides.length > 0) {
      await tx.insert(syllabusOverviewSlides).values(
        parsed.data.slides.map((slide, index) => ({
          syllabusId,
          sortOrder: index,
          title: slide.title,
          content: slide.content,
        })),
      );
    }
  });

  const slides = await db
    .select()
    .from(syllabusOverviewSlides)
    .where(eq(syllabusOverviewSlides.syllabusId, syllabusId))
    .orderBy(asc(syllabusOverviewSlides.sortOrder));

  revalidatePath(`/syllabuses/${syllabusId}`);
  return success({
    slides: slides.map(
      (slide): OverviewSlide => ({
        id: slide.id,
        title: slide.title,
        content: slide.content,
      }),
    ),
  });
}

async function requireSyllabusInOrg(syllabusId: string, organizationId: string) {
  const [row] = await db
    .select({ id: syllabuses.id })
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

export async function uploadSyllabusOverviewPdfs(
  syllabusId: string,
  formData: FormData,
): Promise<ActionResult<{ pdfs: OverviewPdf[] }>> {
  const ctx = await requireAuthContext();
  const syllabus = await requireSyllabusInOrg(syllabusId, ctx.organizationId);
  if (!syllabus) return failure("シラバスが見つかりません");

  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) {
    return failure("PDFファイルを選択してください");
  }

  if (files.length > MAX_OVERVIEW_PDFS_PER_UPLOAD) {
    return failure(`一度にアップロードできるのは${MAX_OVERVIEW_PDFS_PER_UPLOAD}件までです`);
  }

  for (const file of files) {
    if (!isPdfFile(file)) {
      return failure("PDFファイルのみアップロードできます");
    }
    if (file.size > MAX_OVERVIEW_PDF_BYTES) {
      return failure("1ファイルあたり10MBまでアップロードできます");
    }
  }

  const [{ maxSort }] = await db
    .select({
      maxSort: sql<number>`coalesce(max(${syllabusOverviewPdfs.sortOrder}), -1)`,
    })
    .from(syllabusOverviewPdfs)
    .where(eq(syllabusOverviewPdfs.syllabusId, syllabusId));

  let nextSort = maxSort + 1;

  for (const file of files) {
    const [row] = await db
      .insert(syllabusOverviewPdfs)
      .values({
        syllabusId,
        sortOrder: nextSort,
        fileName: file.name,
      })
      .returning({
        id: syllabusOverviewPdfs.id,
        fileName: syllabusOverviewPdfs.fileName,
      });

    nextSort += 1;
    const buffer = Buffer.from(await file.arrayBuffer());
    await saveOverviewPdf(syllabusId, row.id, buffer);
  }

  const allPdfs = await db
    .select({
      id: syllabusOverviewPdfs.id,
      fileName: syllabusOverviewPdfs.fileName,
    })
    .from(syllabusOverviewPdfs)
    .where(eq(syllabusOverviewPdfs.syllabusId, syllabusId))
    .orderBy(asc(syllabusOverviewPdfs.sortOrder));

  revalidatePath(`/syllabuses/${syllabusId}`);
  return success({ pdfs: mapOverviewPdfs(allPdfs) });
}

export async function getOverviewPdfAccess(pdfId: string) {
  const ctx = await requireAuthContext();

  const [row] = await db
    .select({
      id: syllabusOverviewPdfs.id,
      syllabusId: syllabusOverviewPdfs.syllabusId,
      fileName: syllabusOverviewPdfs.fileName,
      organizationId: syllabuses.organizationId,
    })
    .from(syllabusOverviewPdfs)
    .innerJoin(syllabuses, eq(syllabusOverviewPdfs.syllabusId, syllabuses.id))
    .where(eq(syllabusOverviewPdfs.id, pdfId))
    .limit(1);

  if (!row || row.organizationId !== ctx.organizationId) return null;
  return row;
}

export async function createSyllabusSession(
  syllabusId: string,
  input: unknown,
): Promise<ActionResult<{ sessionId: string }>> {
  const ctx = await requireAuthContext();
  const parsed = syllabusSessionSchema.safeParse(input);
  if (!parsed.success) {
    return failure(
      "入力内容を確認してください",
      parsed.error.flatten().fieldErrors,
    );
  }

  const [syllabus] = await db
    .select({ id: syllabuses.id })
    .from(syllabuses)
    .where(
      and(
        eq(syllabuses.id, syllabusId),
        eq(syllabuses.organizationId, ctx.organizationId),
      ),
    )
    .limit(1);

  if (!syllabus) return failure("シラバスが見つかりません");

  const [{ maxSort }] = await db
    .select({
      maxSort: sql<number>`coalesce(max(${syllabusSessions.sortOrder}), -1)`,
    })
    .from(syllabusSessions)
    .where(eq(syllabusSessions.syllabusId, syllabusId));

  const [row] = await db
    .insert(syllabusSessions)
    .values({
      syllabusId,
      sessionNumber: parsed.data.sessionNumber,
      sessionDate: parsed.data.sessionDate?.trim() || null,
      title: parsed.data.title,
      learningObjectives: parsed.data.learningObjectives?.trim() || null,
      preparation: parsed.data.preparation?.trim() || null,
      sortOrder: maxSort + 1,
    })
    .returning({ id: syllabusSessions.id });

  revalidatePath(`/syllabuses/${syllabusId}`);
  return success({ sessionId: row.id });
}

async function requireSessionInOrg(sessionId: string, organizationId: string) {
  const [row] = await db
    .select({ syllabusId: syllabuses.id })
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

export async function createScheduleItem(
  sessionId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireAuthContext();
  const parsed = scheduleItemSchema.safeParse(input);
  if (!parsed.success) {
    return failure(
      "入力内容を確認してください",
      parsed.error.flatten().fieldErrors,
    );
  }

  const session = await requireSessionInOrg(sessionId, ctx.organizationId);
  if (!session) return failure("回が見つかりません");

  const [{ maxSort }] = await db
    .select({
      maxSort: sql<number>`coalesce(max(${sessionScheduleItems.sortOrder}), -1)`,
    })
    .from(sessionScheduleItems)
    .where(eq(sessionScheduleItems.sessionId, sessionId));

  const [row] = await db
    .insert(sessionScheduleItems)
    .values({
      sessionId,
      sortOrder: maxSort + 1,
      time: parsed.data.time,
      content: parsed.data.content,
      teacherAction: parsed.data.teacherAction?.trim() || null,
      studentActivity: parsed.data.studentActivity?.trim() || null,
      materials: parsed.data.materials?.trim() || null,
    })
    .returning({ id: sessionScheduleItems.id });

  revalidatePath(`/syllabuses/${session.syllabusId}`);
  return success({ id: row.id });
}

async function requireScheduleItemInOrg(
  itemId: string,
  organizationId: string,
) {
  const [row] = await db
    .select({
      id: sessionScheduleItems.id,
      sessionId: sessionScheduleItems.sessionId,
      syllabusId: syllabuses.id,
      time: sessionScheduleItems.time,
      content: sessionScheduleItems.content,
      teacherAction: sessionScheduleItems.teacherAction,
      studentActivity: sessionScheduleItems.studentActivity,
      materials: sessionScheduleItems.materials,
    })
    .from(sessionScheduleItems)
    .innerJoin(
      syllabusSessions,
      eq(sessionScheduleItems.sessionId, syllabusSessions.id),
    )
    .innerJoin(syllabuses, eq(syllabusSessions.syllabusId, syllabuses.id))
    .where(
      and(
        eq(sessionScheduleItems.id, itemId),
        eq(syllabuses.organizationId, organizationId),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function updateScheduleItem(
  itemId: string,
  input: unknown,
): Promise<ActionResult<{ item: ScheduleItem }>> {
  const ctx = await requireAuthContext();
  const parsed = scheduleItemSchema.safeParse(input);
  if (!parsed.success) {
    return failure(
      "入力内容を確認してください",
      parsed.error.flatten().fieldErrors,
    );
  }

  const existing = await requireScheduleItemInOrg(itemId, ctx.organizationId);
  if (!existing) return failure("スケジュール行が見つかりません");

  const [row] = await db
    .update(sessionScheduleItems)
    .set({
      time: parsed.data.time,
      content: parsed.data.content,
      teacherAction: parsed.data.teacherAction?.trim() || null,
      studentActivity: parsed.data.studentActivity?.trim() || null,
      materials: parsed.data.materials?.trim() || null,
    })
    .where(eq(sessionScheduleItems.id, itemId))
    .returning();

  revalidatePath(`/syllabuses/${existing.syllabusId}`);
  return success({
    item: {
      id: row.id,
      time: row.time,
      content: row.content,
      teacherAction: row.teacherAction ?? "",
      studentActivity: row.studentActivity ?? "",
      materials: row.materials ?? "",
    },
  });
}

export async function createSessionSlide(
  sessionId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireAuthContext();
  const parsed = sessionSlideSchema.safeParse(input);
  if (!parsed.success) {
    return failure(
      "入力内容を確認してください",
      parsed.error.flatten().fieldErrors,
    );
  }

  const session = await requireSessionInOrg(sessionId, ctx.organizationId);
  if (!session) return failure("回が見つかりません");

  const [{ maxSort }] = await db
    .select({
      maxSort: sql<number>`coalesce(max(${sessionSlides.sortOrder}), -1)`,
    })
    .from(sessionSlides)
    .where(eq(sessionSlides.sessionId, sessionId));

  const [row] = await db
    .insert(sessionSlides)
    .values({
      sessionId,
      sortOrder: maxSort + 1,
      title: parsed.data.title,
      linkUrl: parsed.data.linkUrl,
      linkProvider: parsed.data.linkProvider,
    })
    .returning({ id: sessionSlides.id });

  revalidatePath(`/syllabuses/${session.syllabusId}`);
  return success({ id: row.id });
}

export async function createSessionReference(
  sessionId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireAuthContext();
  const parsed = sessionReferenceSchema.safeParse(input);
  if (!parsed.success) {
    return failure(
      "入力内容を確認してください",
      parsed.error.flatten().fieldErrors,
    );
  }

  const session = await requireSessionInOrg(sessionId, ctx.organizationId);
  if (!session) return failure("回が見つかりません");

  const [{ maxSort }] = await db
    .select({
      maxSort: sql<number>`coalesce(max(${sessionReferences.sortOrder}), -1)`,
    })
    .from(sessionReferences)
    .where(eq(sessionReferences.sessionId, sessionId));

  const [row] = await db
    .insert(sessionReferences)
    .values({
      sessionId,
      sortOrder: maxSort + 1,
      title: parsed.data.title,
      url: parsed.data.url,
      type: parsed.data.type?.trim() || null,
      memo: parsed.data.memo?.trim() || null,
    })
    .returning({ id: sessionReferences.id });

  revalidatePath(`/syllabuses/${session.syllabusId}`);
  return success({ id: row.id });
}
