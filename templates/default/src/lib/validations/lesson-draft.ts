import { z } from "zod";
import { scheduleItemSchema } from "@/lib/validations/session-schedule";

export const generatedLessonDraftSchema = z.object({
  sessions: z.array(
    z.object({
      sessionNumber: z.coerce
        .number()
        .int()
        .min(1, "回数は1以上である必要があります"),
      items: z.array(scheduleItemSchema).min(1, "各回に1行以上必要です"),
    }),
  ),
});

export type GeneratedLessonDraft = z.infer<typeof generatedLessonDraftSchema>;
