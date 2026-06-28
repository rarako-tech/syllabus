import { z } from "zod";

export const syllabusSessionSchema = z.object({
  sessionNumber: z.coerce
    .number({ invalid_type_error: "回数を入力してください" })
    .int("回数は整数で入力してください")
    .min(1, "回数は1以上です"),
  sessionDate: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: "日付を選択してください",
    }),
  title: z.string().min(1, "タイトルは必須です").max(200),
  learningObjectives: z.string().max(5000).optional(),
  preparation: z.string().max(5000).optional(),
});

export type SyllabusSessionInput = z.infer<typeof syllabusSessionSchema>;
