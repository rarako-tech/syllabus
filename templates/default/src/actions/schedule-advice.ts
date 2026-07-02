"use server";

import { failure, success, type ActionResult } from "@/lib/action-result";
import { requireAuthContext } from "@/lib/auth";
import {
  buildDemoScheduleAdvice,
  generateScheduleAdviceWithAnthropic,
  type ScheduleAdviceInput,
} from "@/lib/schedule-advice-generator";
import { z } from "zod";

const scheduleAdviceInputSchema = z.object({
  itemId: z.string().min(1),
  demo: z.boolean().optional(),
  time: z.string(),
  content: z.string(),
  teacherAction: z.string(),
  studentActivity: z.string(),
  materials: z.string(),
});

export async function getScheduleAdvice(
  input: unknown,
): Promise<ActionResult<{ advice: string }>> {
  try {
    const parsed = scheduleAdviceInputSchema.safeParse(input);
    if (!parsed.success) {
      return failure("入力内容を確認してください");
    }

    const row: ScheduleAdviceInput = {
      time: parsed.data.time,
      content: parsed.data.content,
      teacherAction: parsed.data.teacherAction,
      studentActivity: parsed.data.studentActivity,
      materials: parsed.data.materials,
    };

    if (parsed.data.demo) {
      return success({ advice: buildDemoScheduleAdvice(row) });
    }

    await requireAuthContext();

    const advice = await generateScheduleAdviceWithAnthropic(row);
    return success({ advice });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "アドバイスの取得に失敗しました";
    return failure(message);
  }
}
