import { z } from "zod";

export const sessionReferenceSchema = z.object({
  title: z.string().min(1, "リンクタイトルは必須です").max(200),
  url: z.string().url("有効なURLを入力してください"),
  type: z.string().max(100).optional(),
  memo: z.string().max(5000).optional(),
});

export type SessionReferenceInput = z.infer<typeof sessionReferenceSchema>;
