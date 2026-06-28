import { z } from "zod";

const fourChoiceQuestionSchema = z.object({
  question: z.string().min(1),
  pattern: z.string().min(1),
  choices: z.tuple([
    z.string().min(1),
    z.string().min(1),
    z.string().min(1),
    z.string().min(1),
  ]),
  answer: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
  ]),
});

export const generatedWorksheetSchema = z.object({
  patterns: z.array(z.string().min(1)).min(1),
  fourChoice: z.array(fourChoiceQuestionSchema).length(10),
});

export type GeneratedWorksheet = z.infer<typeof generatedWorksheetSchema>;
export type FourChoiceQuestion = z.infer<typeof fourChoiceQuestionSchema>;
