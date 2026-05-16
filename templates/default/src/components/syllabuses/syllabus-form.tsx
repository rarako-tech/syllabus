"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { createSyllabus, updateSyllabus } from "@/actions/syllabuses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  syllabusSchema,
  type SyllabusInput,
} from "@/lib/validations/syllabus";

type Props = {
  mode: "create" | "edit";
  syllabusId?: string;
  defaultValues?: Partial<SyllabusInput>;
};

export function SyllabusForm({ mode, syllabusId, defaultValues }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<SyllabusInput>({
    resolver: zodResolver(syllabusSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "draft",
      ...defaultValues,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createSyllabus(values)
          : await updateSyllabus(syllabusId!, values);

      if (!result.ok) {
        form.setError("root", { message: result.error });
        return;
      }
      router.push("/syllabuses");
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">タイトル</Label>
        <Input id="title" {...form.register("title")} />
        {form.formState.errors.title && (
          <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">説明</Label>
        <Input id="description" {...form.register("description")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">ステータス</Label>
        <select
          id="status"
          className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
          {...form.register("status")}
        >
          <option value="draft">下書き</option>
          <option value="published">公開</option>
          <option value="archived">アーカイブ</option>
        </select>
      </div>
      {form.formState.errors.root && (
        <p className="text-sm text-red-600">{form.formState.errors.root.message}</p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "保存中..." : mode === "create" ? "作成" : "更新"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          キャンセル
        </Button>
      </div>
    </form>
  );
}
