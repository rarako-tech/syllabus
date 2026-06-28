import { z } from "zod";

export const overviewSlideInputSchema = z.object({
  title: z.string().max(200),
  content: z.string().max(10000),
});

export const syllabusOverviewFormSchema = z.object({
  textbookName: z.string().max(500),
  courseGoals: z.string().max(5000),
  targetStudentLevel: z.string().max(500),
  plannedSessionCount: z.string(),
  slides: z.array(overviewSlideInputSchema),
});

export const syllabusOverviewSchema = syllabusOverviewFormSchema
  .extend({
    plannedSessionCount: z
      .union([
        z.literal(""),
        z.coerce
          .number({ invalid_type_error: "授業回数を入力してください" })
          .int("授業回数は整数で入力してください")
          .min(1, "授業回数は1以上です"),
      ])
      .transform((val) => (val === "" ? null : val)),
  })
  .transform((data) => ({
    ...data,
    slides: data.slides.filter(
      (slide) => slide.title.trim() || slide.content.trim(),
    ),
  }))
  .refine((data) => data.slides.length > 0, {
    message: "各回の概要を1件以上入力してください",
    path: ["slides"],
  })
  .refine(
    (data) =>
      data.slides.every(
        (slide) => slide.title.trim().length > 0 && slide.content.trim().length > 0,
      ),
    {
      message: "入力済みの各行にタイトルと内容を両方入力してください",
      path: ["slides"],
    },
  );

export type SyllabusOverviewFormInput = z.infer<typeof syllabusOverviewFormSchema>;
export type SyllabusOverviewInput = z.infer<typeof syllabusOverviewSchema>;
