"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { generateLessonDraftsFromOverview } from "@/actions/generate-lesson-drafts";
import { Button } from "@/components/ui/button";
import { buildDemoLessonDrafts } from "@/lib/demo-lesson-drafts";
import type { SyllabusOverview, SyllabusSession } from "@/lib/types/syllabus-detail";
import { Sparkles } from "lucide-react";

type Props = {
  syllabusId: string;
  overview: SyllabusOverview;
  sessions: SyllabusSession[];
  demo?: boolean;
  onGenerated: (
    sessions: SyllabusSession[],
    message?: string,
    isError?: boolean,
  ) => void;
};

export function GenerateLessonDraftsButton({
  syllabusId,
  overview,
  sessions,
  demo,
  onGenerated,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      try {
        if (demo) {
          const baseSessions =
            sessions.length > 0
              ? sessions
              : overview.slides.map((slide, index) => ({
                  id: `demo-session-${index + 1}`,
                  sessionNumber: index + 1,
                  sessionDate: null,
                  title: slide.title || `第${index + 1}回`,
                  learningObjectives: "",
                  preparation: "",
                  scheduleItems: [],
                  slides: [],
                  references: [],
                }));

          if (baseSessions.length === 0) {
            setError("各回の概要または回の登録が必要です");
            return;
          }

          onGenerated(
            buildDemoLessonDrafts(baseSessions),
            "各回のスケジュールを生成しました。",
          );
          return;
        }

        if (overview.pdfs.length === 0) {
          setError("PDFをアップロードしてからたたき台を生成してください");
          return;
        }

        const result = await generateLessonDraftsFromOverview(syllabusId);
        if (!result.ok) {
          setError(result.error);
          onGenerated(sessions, result.error, true);
          return;
        }

        onGenerated(
          result.data.sessions,
          result.data.message,
          !result.data.schedulesGenerated,
        );
        router.refresh();
      } catch (cause) {
        const message =
          cause instanceof Error
            ? cause.message
            : "スケジュール生成中にエラーが発生しました";
        setError(message);
        onGenerated(sessions, message, true);
      }
    });
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="sm"
        className="w-full"
        disabled={pending}
        onClick={handleClick}
      >
        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
        {pending ? "生成中..." : "スケジュールを再生成"}
      </Button>
      <p className="text-xs text-muted-foreground">
        未生成の回だけ自動作成します（第6回以降など）。完了まで数分かかることがあります。
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
