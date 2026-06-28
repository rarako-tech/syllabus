import { z } from "zod";

export const slideLinkProviderSchema = z.enum(["google_drive", "canva"]);

export const sessionSlideSchema = z.object({
  title: z.string().min(1, "タイトルは必須です").max(200),
  linkUrl: z.string().url("有効なURLを入力してください"),
  linkProvider: slideLinkProviderSchema,
});

export type SessionSlideInput = z.infer<typeof sessionSlideSchema>;
