"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createScheduleItem } from "@/actions/syllabus-detail";
import { textareaClassName } from "@/components/syllabuses/detail/form-styles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ScheduleItem } from "@/lib/types/syllabus-detail";
import {
  scheduleItemSchema,
  type ScheduleItemInput,
} from "@/lib/validations/session-schedule";

type Props = {
  sessionId: string;
  demo?: boolean;
  onAdded: (item: ScheduleItem) => void;
};

export function AddScheduleForm({ sessionId, demo, onAdded }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<ScheduleItemInput>({
    resolver: zodResolver(scheduleItemSchema),
    defaultValues: {
      time: "",
      content: "",
      teacherAction: "",
      studentActivity: "",
      materials: "",
    },
  });

  const closeForm = () => {
    setOpen(false);
    form.reset();
    form.clearErrors();
  };

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const item: ScheduleItem = {
        id: `demo-schedule-${Date.now()}`,
        time: values.time,
        content: values.content,
        teacherAction: values.teacherAction?.trim() ?? "",
        studentActivity: values.studentActivity?.trim() ?? "",
        materials: values.materials?.trim() ?? "",
      };

      if (demo) {
        onAdded(item);
        closeForm();
        return;
      }

      const result = await createScheduleItem(sessionId, values);
      if (!result.ok) {
        form.setError("root", { message: result.error });
        return;
      }

      onAdded({ ...item, id: result.data.id });
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
        スケジュールを追加
      </Button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-lg border border-border bg-muted/40 p-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">スケジュールを追加</p>
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
        <Label htmlFor="scheduleTime" className="text-xs">
          開始時刻
        </Label>
        <Input
          id="scheduleTime"
          placeholder="0:00 または 0:00-0:15"
          {...form.register("time")}
        />
        <p className="text-xs text-muted-foreground">
          授業開始を 0:00 とした開始時刻。所要時間は表で自動計算されます。
        </p>
        {form.formState.errors.time && (
          <p className="text-xs text-red-600">{form.formState.errors.time.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="scheduleContent" className="text-xs">
          内容
        </Label>
        <Input id="scheduleContent" {...form.register("content")} />
        {form.formState.errors.content && (
          <p className="text-xs text-red-600">{form.formState.errors.content.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="teacherAction" className="text-xs">
          教師の動き
        </Label>
        <textarea
          id="teacherAction"
          className={textareaClassName}
          rows={2}
          {...form.register("teacherAction")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="studentActivity" className="text-xs">
          生徒の活動
        </Label>
        <textarea
          id="studentActivity"
          className={textareaClassName}
          rows={2}
          {...form.register("studentActivity")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="materials" className="text-xs">
          使用教材
        </Label>
        <Input id="materials" {...form.register("materials")} />
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
