"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createSyllabusSession } from "@/actions/syllabus-detail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SyllabusSession } from "@/lib/types/syllabus-detail";
import {
  syllabusSessionSchema,
  type SyllabusSessionInput,
} from "@/lib/validations/syllabus-session";

const textareaClassName =
  "flex min-h-[72px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 disabled:cursor-not-allowed disabled:opacity-50";

type Props = {
  syllabusId: string;
  sessions: SyllabusSession[];
  demo?: boolean;
  onSessionAdded: (session: SyllabusSession) => void;
};

export function AddSessionForm({
  syllabusId,
  sessions,
  demo,
  onSessionAdded,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const nextSessionNumber =
    sessions.reduce((max, session) => Math.max(max, session.sessionNumber), 0) +
    1;

  const form = useForm<SyllabusSessionInput>({
    resolver: zodResolver(syllabusSessionSchema),
    defaultValues: {
      sessionNumber: nextSessionNumber,
      sessionDate: "",
      title: "",
      learningObjectives: "",
      preparation: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        sessionNumber: nextSessionNumber,
        sessionDate: "",
        title: "",
        learningObjectives: "",
        preparation: "",
      });
    }
  }, [form, nextSessionNumber, open]);

  const closeForm = () => {
    setOpen(false);
    form.clearErrors();
  };

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      if (demo) {
        const newSession: SyllabusSession = {
          id: `demo-session-${Date.now()}`,
          sessionNumber: values.sessionNumber,
          sessionDate: values.sessionDate?.trim() || null,
          title: values.title,
          learningObjectives: values.learningObjectives?.trim() ?? "",
          preparation: values.preparation?.trim() ?? "",
          scheduleItems: [],
          slides: [],
          references: [],
        };
        onSessionAdded(newSession);
        closeForm();
        return;
      }

      const result = await createSyllabusSession(syllabusId, values);
      if (!result.ok) {
        form.setError("root", { message: result.error });
        return;
      }

      onSessionAdded({
        id: result.data.sessionId,
        sessionNumber: values.sessionNumber,
        sessionDate: values.sessionDate?.trim() || null,
        title: values.title,
        learningObjectives: values.learningObjectives?.trim() ?? "",
        preparation: values.preparation?.trim() ?? "",
        scheduleItems: [],
        slides: [],
        references: [],
      });
      router.refresh();
      closeForm();
    });
  });

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        回を追加
      </Button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-lg border border-border bg-muted/40 p-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">回を追加</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 px-0"
          onClick={closeForm}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sessionNumber" className="text-xs">
          回数
        </Label>
        <Input
          id="sessionNumber"
          type="number"
          min={1}
          {...form.register("sessionNumber", { valueAsNumber: true })}
        />
        {form.formState.errors.sessionNumber && (
          <p className="text-xs text-red-600">
            {form.formState.errors.sessionNumber.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sessionDate" className="text-xs">
          日付
        </Label>
        <Input id="sessionDate" type="date" {...form.register("sessionDate")} />
        {form.formState.errors.sessionDate && (
          <p className="text-xs text-red-600">
            {form.formState.errors.sessionDate.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sessionTitle" className="text-xs">
          タイトル
        </Label>
        <Input id="sessionTitle" {...form.register("title")} />
        {form.formState.errors.title && (
          <p className="text-xs text-red-600">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="learningObjectives" className="text-xs">
          学習目標
        </Label>
        <textarea
          id="learningObjectives"
          className={textareaClassName}
          rows={3}
          {...form.register("learningObjectives")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="preparation" className="text-xs">
          準備物
        </Label>
        <textarea
          id="preparation"
          className={textareaClassName}
          rows={2}
          {...form.register("preparation")}
        />
      </div>

      {form.formState.errors.root && (
        <p className="text-xs text-red-600">{form.formState.errors.root.message}</p>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending} className="flex-1">
          {pending ? "保存中..." : "追加"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={closeForm}>
          キャンセル
        </Button>
      </div>
    </form>
  );
}
