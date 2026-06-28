"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { getScheduleAdvice } from "@/actions/schedule-advice";
import { Button } from "@/components/ui/button";
import type { ScheduleItem } from "@/lib/types/syllabus-detail";

type Props = {
  row: ScheduleItem;
  demo?: boolean;
};

export function ScheduleAdviceButton({ row, demo }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleClick = () => {
    setOpen(true);
    setAdvice(null);
    setError(null);

    startTransition(async () => {
      try {
        const result = await getScheduleAdvice({
          itemId: row.id,
          demo,
          time: row.time,
          content: row.content,
          teacherAction: row.teacherAction,
          studentActivity: row.studentActivity,
          materials: row.materials,
        });

        if (!result.ok) {
          setError(result.error);
          return;
        }

        setAdvice(result.data.advice);
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "アドバイスの取得に失敗しました",
        );
      }
    });
  };

  const handleClose = () => {
    setOpen(false);
    setAdvice(null);
    setError(null);
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 px-0 text-base"
        title="AIアドバイスを表示"
        aria-label="AIアドバイスを表示"
        disabled={pending && open}
        onClick={handleClick}
      >
        {pending && open ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "💡"
        )}
      </Button>

      <dialog
        ref={dialogRef}
        className="w-[min(32rem,calc(100vw-2rem))] max-w-lg rounded-lg border border-border bg-background p-0 text-foreground shadow-lg backdrop:bg-black/40"
        onClose={handleClose}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">AIアドバイス</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 px-0"
            aria-label="閉じる"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="max-h-[min(24rem,60vh)] overflow-y-auto px-4 py-3 text-sm">
          {pending && !advice && !error ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>アドバイスを生成しています...</span>
            </div>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed">{advice}</p>
          )}
        </div>

        <div className="border-t border-border px-4 py-3">
          <Button type="button" size="sm" variant="outline" onClick={handleClose}>
            閉じる
          </Button>
        </div>
      </dialog>
    </>
  );
}
