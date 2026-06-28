"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  sessionScheduleItems,
  syllabusSessions,
  syllabuses,
} from "@/db/schema";
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

async function requireScheduleItemInOrg(
  itemId: string,
  organizationId: string,
) {
  const [row] = await db
    .select({ id: sessionScheduleItems.id })
    .from(sessionScheduleItems)
    .innerJoin(
      syllabusSessions,
      eq(sessionScheduleItems.sessionId, syllabusSessions.id),
    )
    .innerJoin(syllabuses, eq(syllabusSessions.syllabusId, syllabuses.id))
    .where(
      and(
        eq(sessionScheduleItems.id, itemId),
        eq(syllabuses.organizationId, organizationId),
      ),
    )
    .limit(1);

  return row ?? null;
}

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

    const ctx = await requireAuthContext();
    const existing = await requireScheduleItemInOrg(
      parsed.data.itemId,
      ctx.organizationId,
    );
    if (!existing) return failure("スケジュール行が見つかりません");

    const advice = await generateScheduleAdviceWithAnthropic(row);
    return success({ advice });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "アドバイスの取得に失敗しました";
    return failure(message);
  }
}
