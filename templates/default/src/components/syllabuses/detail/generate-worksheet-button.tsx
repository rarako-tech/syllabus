"use client";

import { FileDown, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { generateSessionWorksheet } from "@/actions/generate-worksheet";
import { Button } from "@/components/ui/button";
import {
  extractSentencePatterns,
  getOverviewSlideForSession,
} from "@/lib/overview-slide-session";
import type { SyllabusOverview, SyllabusSession } from "@/lib/types/syllabus-detail";

type Props = {
  session: SyllabusSession;
  overview: SyllabusOverview;
  demo?: boolean;
};

function downloadBase64Docx(fileName: string, fileBase64: string) {
  const bytes = Uint8Array.from(atob(fileBase64), (char) => char.charCodeAt(0));
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function GenerateWorksheetButton({ session, overview, demo }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const overviewSlide = getOverviewSlideForSession(
    overview.slides,
    session.sessionNumber,
  );
  const patterns = overviewSlide
    ? extractSentencePatterns(overviewSlide.content)
    : [];

  const handleClick = () => {
    setError(null);

    if (!overviewSlide) {
      setError(
        `概要タブの第${session.sessionNumber}回スライドが見つかりません。`,
      );
      return;
    }

    if (patterns.length === 0) {
      setError(
        "概要タブの「内容」に文型リスト（1行1文型）を入力してください。",
      );
      return;
    }

    startTransition(async () => {
      const result = await generateSessionWorksheet({
        sessionId: session.id,
        demo,
        sessionNumber: session.sessionNumber,
        sessionTitle: session.title,
        overviewContent: overviewSlide.content,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      downloadBase64Docx(result.data.fileName, result.data.fileBase64);
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
        {pending ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileDown className="mr-1.5 h-3.5 w-3.5" />
        )}
        {pending ? "生成中..." : "まとめチェックシートを生成"}
      </Button>
      <p className="text-xs text-muted-foreground">
        概要タブ・第{session.sessionNumber}回スライドの「内容」から文型（〜つき など）を読み取り、
        その回で習った文型をすべて使った4択10問（N3語彙）をWord形式で出力します。
        ウォーミングアップなどの進行ラベルは除外されます。
      </p>
      {patterns.length > 0 && (
        <p className="text-xs text-muted-foreground">
          検出した文型：{patterns.length}件
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
