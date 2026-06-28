"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createSessionReference } from "@/actions/syllabus-detail";
import { textareaClassName } from "@/components/syllabuses/detail/form-styles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SessionReference } from "@/lib/types/syllabus-detail";
import {
  sessionReferenceSchema,
  type SessionReferenceInput,
} from "@/lib/validations/session-reference";

type Props = {
  sessionId: string;
  demo?: boolean;
  onAdded: (reference: SessionReference) => void;
};

export function AddReferenceForm({ sessionId, demo, onAdded }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<SessionReferenceInput>({
    resolver: zodResolver(sessionReferenceSchema),
    defaultValues: {
      title: "",
      url: "",
      type: "",
      memo: "",
    },
  });

  const closeForm = () => {
    setOpen(false);
    form.reset();
    form.clearErrors();
  };

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const reference: SessionReference = {
        id: `demo-reference-${Date.now()}`,
        title: values.title,
        url: values.url,
        type: values.type?.trim() ?? "",
        memo: values.memo?.trim() ?? "",
      };

      if (demo) {
        onAdded(reference);
        closeForm();
        return;
      }

      const result = await createSessionReference(sessionId, values);
      if (!result.ok) {
        form.setError("root", { message: result.error });
        return;
      }

      onAdded({ ...reference, id: result.data.id });
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
        リンクを追加
      </Button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-lg border border-border bg-muted/40 p-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">リンクを追加</p>
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
        <Label htmlFor="referenceTitle" className="text-xs">
          リンクタイトル
        </Label>
        <Input id="referenceTitle" {...form.register("title")} />
        {form.formState.errors.title && (
          <p className="text-xs text-red-600">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="referenceUrl" className="text-xs">
          URL
        </Label>
        <Input
          id="referenceUrl"
          type="url"
          placeholder="https://..."
          {...form.register("url")}
        />
        {form.formState.errors.url && (
          <p className="text-xs text-red-600">{form.formState.errors.url.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="referenceType" className="text-xs">
          種類
        </Label>
        <Input id="referenceType" placeholder="資料・動画など" {...form.register("type")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="referenceMemo" className="text-xs">
          メモ
        </Label>
        <textarea
          id="referenceMemo"
          className={textareaClassName}
          rows={3}
          {...form.register("memo")}
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
