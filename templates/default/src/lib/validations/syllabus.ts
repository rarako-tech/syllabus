import { z } from "zod";

export const syllabusStatusSchema = z.enum(["draft", "published", "archived"]);

export const syllabusSchema = z.object({
  title: z.string().min(1, "タイトルは必須です").max(200),
  description: z.string().max(2000).optional(),
  status: syllabusStatusSchema,
});

export type SyllabusInput = z.infer<typeof syllabusSchema>;
