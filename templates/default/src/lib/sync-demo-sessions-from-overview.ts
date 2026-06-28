import type { SyllabusOverview, SyllabusSession } from "@/lib/types/syllabus-detail";
import { buildDemoLessonDrafts } from "@/lib/demo-lesson-drafts";

export function syncDemoSessionsFromOverview(
  overview: SyllabusOverview,
  existingSessions: SyllabusSession[],
): SyllabusSession[] {
  if (overview.slides.length === 0) return existingSessions;

  return overview.slides.map((slide, index) => {
    const sessionNumber = index + 1;
    const existing = existingSessions.find(
      (session) => session.sessionNumber === sessionNumber,
    );

    return {
      id: existing?.id ?? `demo-session-${sessionNumber}`,
      sessionNumber,
      sessionDate: existing?.sessionDate ?? null,
      title: slide.title.trim() || `第${sessionNumber}回`,
      learningObjectives: slide.content.trim(),
      preparation: existing?.preparation ?? "",
      scheduleItems: existing?.scheduleItems ?? [],
      slides: existing?.slides ?? [],
      references: existing?.references ?? [],
    };
  });
}

export function applyDemoDraftsIfPossible(
  overview: SyllabusOverview,
  sessions: SyllabusSession[],
): SyllabusSession[] {
  if (overview.pdfs.length === 0) return sessions;
  return buildDemoLessonDrafts(sessions);
}
