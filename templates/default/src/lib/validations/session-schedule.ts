import { z } from "zod";

export const scheduleItemSchema = z.object({
  time: z.string().min(1, "時間は必須です").max(50),
  content: z.string().min(1, "内容は必須です").max(2000),
  teacherAction: z.string().max(2000).optional(),
  studentActivity: z.string().max(2000).optional(),
  materials: z.string().max(2000).optional(),
});

export type ScheduleItemInput = z.infer<typeof scheduleItemSchema>;
