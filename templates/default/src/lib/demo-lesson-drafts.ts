import type { SyllabusSession } from "@/lib/types/syllabus-detail";

export function buildDemoLessonDrafts(
  sessions: SyllabusSession[],
): SyllabusSession[] {
  return sessions.map((session) => ({
    ...session,
    scheduleItems: [
      {
        id: `demo-draft-${session.id}-1`,
        time: "0:00",
        content: `${session.title}の導入`,
        teacherAction: "本日の目標と流れを説明する",
        studentActivity: "前回の振り返りをペアで共有する",
        materials: "スライド・板書",
      },
      {
        id: `demo-draft-${session.id}-2`,
        time: "0:20",
        content: "本題の説明と演習",
        teacherAction: "デモを見せながら要点を解説する",
        studentActivity: "ワークシートに沿って取り組む",
        materials: "教材PDF・ワークシート",
      },
      {
        id: `demo-draft-${session.id}-3`,
        time: "1:10",
        content: "まとめと次回予告",
        teacherAction: "要点を整理し課題を提示する",
        studentActivity: "学んだことを1文でまとめる",
        materials: "スライド",
      },
    ],
  }));
}
