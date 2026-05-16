"use server";

import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  sessionReferences,
  sessionScheduleItems,
  sessionSlides,
  syllabusSessions,
  syllabuses,
} from "@/db/schema";
import { requireAuthContext } from "@/lib/auth";
import type {
  ScheduleItem,
  SessionReference,
  SessionSlide,
  SyllabusDetail,
  SyllabusSession,
} from "@/lib/types/syllabus-detail";

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
    sessions: sessionsWithChildren,
  };
}
