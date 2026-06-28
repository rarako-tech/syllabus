"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { syncAndGenerateFromOverview } from "@/actions/generate-lesson-drafts";
import { updateSyllabusOverview } from "@/actions/syllabus-detail";
import { SyllabusOverviewPdfUpload } from "@/components/syllabuses/detail/syllabus-overview-pdf-upload";
import { GenerateLessonDraftsButton } from "@/components/syllabuses/detail/generate-lesson-drafts-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SyllabusOverview, SyllabusSession } from "@/lib/types/syllabus-detail";
import {
  applyDemoDraftsIfPossible,
  syncDemoSessionsFromOverview,
} from "@/lib/sync-demo-sessions-from-overview";
import {
  syllabusOverviewFormSchema,
  syllabusOverviewSchema,
  type SyllabusOverviewFormInput,
} from "@/lib/validations/syllabus-overview";

const textareaClassName =
  "flex min-h-[72px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 disabled:cursor-not-allowed disabled:opacity-50";

type Props = {
  syllabusId: string;
  overview: SyllabusOverview;
  sessions: SyllabusSession[];
  demo?: boolean;
  onSaved: (overview: SyllabusOverview) => void;
  onPdfsUploaded: (pdfs: SyllabusOverview["pdfs"]) => void;
  onDraftsGenerated: (
    sessions: SyllabusSession[],
    message?: string,
    isError?: boolean,
  ) => void;
};

function toFormValues(overview: SyllabusOverview): SyllabusOverviewFormInput {
  return {
    textbookName: overview.textbookName,
    courseGoals: overview.courseGoals,
    targetStudentLevel: overview.targetStudentLevel,
    plannedSessionCount:
      overview.plannedSessionCount === null
        ? ""
        : String(overview.plannedSessionCount),
    slides: overview.slides.map((slide) => ({
      title: slide.title,
      content: slide.content,
    })),
  };
}

function toOverview(
  values: SyllabusOverviewFormInput,
  prev: SyllabusOverview,
  plannedSessionCount: number | null,
): SyllabusOverview {
  return {
    textbookName: values.textbookName.trim(),
    courseGoals: values.courseGoals.trim(),
    targetStudentLevel: values.targetStudentLevel.trim(),
    plannedSessionCount,
    slides: values.slides.map((slide, index) => ({
      id: prev.slides[index]?.id ?? `overview-slide-${Date.now()}-${index}`,
      title: slide.title,
      content: slide.content,
    })),
    pdfs: prev.pdfs,
  };
}

export function SyllabusOverviewForm({
  syllabusId,
  overview,
  sessions,
  demo,
  onSaved,
  onPdfsUploaded,
  onDraftsGenerated,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const form = useForm<SyllabusOverviewFormInput>({
    resolver: zodResolver(syllabusOverviewFormSchema),
    defaultValues: toFormValues(overview),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "slides",
  });

  useEffect(() => {
    form.reset(toFormValues(overview));
  }, [form, syllabusId]);

  const onSubmit = form.handleSubmit((values) => {
    setStatusMessage(null);
    startTransition(async () => {
      try {
      const parsed = syllabusOverviewSchema.safeParse(values);
      if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        if (fieldErrors.plannedSessionCount?.[0]) {
          form.setError("plannedSessionCount", {
            message: fieldErrors.plannedSessionCount[0],
          });
        }
        const slideErrors = parsed.error.flatten().fieldErrors.slides;
        const slideMessage =
          Array.isArray(slideErrors) &&
          slideErrors.find((message) => typeof message === "string");
        form.setError("root", {
          message:
            typeof slideMessage === "string"
              ? slideMessage
              : "入力内容を確認してください。各回のタイトルと内容は必須です。",
        });
        return;
      }

      const nextOverview = toOverview(
        values,
        overview,
        parsed.data.plannedSessionCount,
      );

      if (demo) {
        onSaved(nextOverview);
        const syncedSessions = syncDemoSessionsFromOverview(
          nextOverview,
          sessions,
        );
        onDraftsGenerated(
          applyDemoDraftsIfPossible(nextOverview, syncedSessions),
          nextOverview.pdfs.length > 0
            ? "各回の内容とスケジュールを生成しました。"
            : "各回の内容を更新しました。",
        );
        setStatusMessage(null);
        return;
      }

      const result = await updateSyllabusOverview(syllabusId, parsed.data);
      if (!result.ok) {
        form.setError("root", { message: result.error });
        return;
      }

      onSaved({
        ...nextOverview,
        slides: result.data.slides,
        pdfs: overview.pdfs,
      });
      form.reset(
        toFormValues({
          ...nextOverview,
          slides: result.data.slides,
          pdfs: overview.pdfs,
        }),
      );

      const generated = await syncAndGenerateFromOverview(syllabusId);
      if (!generated.ok) {
        form.setError("root", { message: generated.error });
        return;
      }

      onDraftsGenerated(
        generated.data.sessions,
        generated.data.message,
        !generated.data.schedulesGenerated,
      );
      if (generated.data.schedulesGenerated) {
        setStatusMessage(generated.data.message);
      }
      router.refresh();
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : "保存中にエラーが発生しました";
        form.setError("root", { message });
        onDraftsGenerated(sessions, message, true);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="textbookName" className="text-xs">
          教科書名
        </Label>
        <Input id="textbookName" {...form.register("textbookName")} />
        {form.formState.errors.textbookName && (
          <p className="text-xs text-red-600">
            {form.formState.errors.textbookName.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="courseGoals" className="text-xs">
          コースの目標
        </Label>
        <textarea
          id="courseGoals"
          className={textareaClassName}
          rows={4}
          {...form.register("courseGoals")}
        />
        {form.formState.errors.courseGoals && (
          <p className="text-xs text-red-600">
            {form.formState.errors.courseGoals.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="targetStudentLevel" className="text-xs">
          対象学生のレベル
        </Label>
        <Input id="targetStudentLevel" {...form.register("targetStudentLevel")} />
        {form.formState.errors.targetStudentLevel && (
          <p className="text-xs text-red-600">
            {form.formState.errors.targetStudentLevel.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="plannedSessionCount" className="text-xs">
          授業回数
        </Label>
        <Input
          id="plannedSessionCount"
          type="number"
          min={1}
          placeholder="例: 15"
          {...form.register("plannedSessionCount")}
        />
        {form.formState.errors.plannedSessionCount && (
          <p className="text-xs text-red-600">
            {form.formState.errors.plannedSessionCount.message}
          </p>
        )}
      </div>

      <SyllabusOverviewPdfUpload
        syllabusId={syllabusId}
        pdfs={overview.pdfs}
        demo={demo}
        onUploaded={onPdfsUploaded}
      />

      <p className="text-xs text-muted-foreground">
        PDFをアップロードしても、下の「概要を保存して自動生成」を押すまで各回の内容には反映されません。
        保存すると①各回の内容（タイトル・学習目標）と②スケジュールを自動生成します（PDFアップロード済みの場合）。
      </p>

      <GenerateLessonDraftsButton
        syllabusId={syllabusId}
        overview={overview}
        sessions={sessions}
        demo={demo}
        onGenerated={onDraftsGenerated}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">スライド（タイトル・内容）</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => append({ title: "", content: "" })}
          >
            <Plus className="mr-1 h-3 w-3" />
            行を追加
          </Button>
        </div>

        {fields.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            スライドがありません。「行を追加」から入力できます。
          </p>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="space-y-2 rounded-lg border border-border bg-muted/40 p-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    第{index + 1}回
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 px-0"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`slide-title-${index}`} className="text-xs">
                    タイトル
                  </Label>
                  <Input
                    id={`slide-title-${index}`}
                    {...form.register(`slides.${index}.title`)}
                  />
                  {form.formState.errors.slides?.[index]?.title && (
                    <p className="text-xs text-red-600">
                      {form.formState.errors.slides[index]?.title?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`slide-content-${index}`} className="text-xs">
                    内容
                  </Label>
                  <textarea
                    id={`slide-content-${index}`}
                    className={textareaClassName}
                    rows={3}
                    {...form.register(`slides.${index}.content`)}
                  />
                  {form.formState.errors.slides?.[index]?.content && (
                    <p className="text-xs text-red-600">
                      {form.formState.errors.slides[index]?.content?.message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {form.formState.errors.slides?.root && (
          <p className="text-xs text-red-600">
            {form.formState.errors.slides.root.message}
          </p>
        )}
      </div>

      {statusMessage && (
        <p className="text-xs text-green-700 dark:text-green-400">{statusMessage}</p>
      )}

      {form.formState.errors.root && (
        <p className="text-xs text-red-600">{form.formState.errors.root.message}</p>
      )}

      <Button type="submit" size="sm" disabled={pending} className="w-full">
        {pending ? "保存中..." : "概要を保存して自動生成"}
      </Button>
    </form>
  );
}
