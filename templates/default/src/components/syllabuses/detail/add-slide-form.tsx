"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createSessionSlide } from "@/actions/syllabus-detail";
import { selectClassName } from "@/components/syllabuses/detail/form-styles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SessionSlide } from "@/lib/types/syllabus-detail";
import {
  sessionSlideSchema,
  type SessionSlideInput,
} from "@/lib/validations/session-slide";

type Props = {
  sessionId: string;
  demo?: boolean;
  onAdded: (slide: SessionSlide) => void;
};

export function AddSlideForm({ sessionId, demo, onAdded }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<SessionSlideInput>({
    resolver: zodResolver(sessionSlideSchema),
    defaultValues: {
      title: "",
      linkUrl: "",
      linkProvider: "google_drive",
    },
  });

  const closeForm = () => {
    setOpen(false);
    form.reset();
    form.clearErrors();
  };

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const slide: SessionSlide = {
        id: `demo-slide-${Date.now()}`,
        title: values.title,
        thumbnailUrl: null,
        linkUrl: values.linkUrl,
        linkProvider: values.linkProvider,
      };

      if (demo) {
        onAdded(slide);
        closeForm();
        return;
      }

      const result = await createSessionSlide(sessionId, values);
      if (!result.ok) {
        form.setError("root", { message: result.error });
        return;
      }

      onAdded({ ...slide, id: result.data.id });
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
        スライドを追加
      </Button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-lg border border-border bg-muted/40 p-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">スライドを追加</p>
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
        <Label htmlFor="slideTitle" className="text-xs">
          タイトル
        </Label>
        <Input id="slideTitle" {...form.register("title")} />
        {form.formState.errors.title && (
          <p className="text-xs text-red-600">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="linkUrl" className="text-xs">
          リンク
        </Label>
        <Input
          id="linkUrl"
          type="url"
          placeholder="https://..."
          {...form.register("linkUrl")}
        />
        {form.formState.errors.linkUrl && (
          <p className="text-xs text-red-600">{form.formState.errors.linkUrl.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="linkProvider" className="text-xs">
          種類
        </Label>
        <select
          id="linkProvider"
          className={selectClassName}
          {...form.register("linkProvider")}
        >
          <option value="google_drive">Google Drive</option>
          <option value="canva">Canva</option>
        </select>
        {form.formState.errors.linkProvider && (
          <p className="text-xs text-red-600">
            {form.formState.errors.linkProvider.message}
          </p>
        )}
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
