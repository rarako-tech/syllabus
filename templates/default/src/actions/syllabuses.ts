"use server";

import { and, desc, eq, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { syllabuses } from "@/db/schema";
import { failure, success, type ActionResult } from "@/lib/action-result";
import { requireAuthContext, requireOrgRole } from "@/lib/auth";
import { syllabusSchema } from "@/lib/validations/syllabus";

export type SyllabusRow = {
  id: string;
  title: string;
  description: string | null;
  status: "draft" | "published" | "archived";
  createdAt: Date;
  updatedAt: Date;
};

export async function listSyllabuses(query?: {
  search?: string;
  status?: "draft" | "published" | "archived" | "all";
}): Promise<SyllabusRow[]> {
  const ctx = await requireAuthContext();
  const conditions = [eq(syllabuses.organizationId, ctx.organizationId)];

  if (query?.status && query.status !== "all") {
    conditions.push(eq(syllabuses.status, query.status));
  }

  if (query?.search?.trim()) {
    const term = `%${query.search.trim()}%`;
    conditions.push(
      or(ilike(syllabuses.title, term), ilike(syllabuses.description, term))!,
    );
  }

  return db
    .select()
    .from(syllabuses)
    .where(and(...conditions))
    .orderBy(desc(syllabuses.updatedAt));
}

export async function getSyllabus(id: string) {
  const ctx = await requireAuthContext();
  const [row] = await db
    .select()
    .from(syllabuses)
    .where(
      and(
        eq(syllabuses.id, id),
        eq(syllabuses.organizationId, ctx.organizationId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function createSyllabus(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireAuthContext();
  const parsed = syllabusSchema.safeParse(input);
  if (!parsed.success) {
    return failure("入力内容を確認してください", parsed.error.flatten().fieldErrors);
  }

  const [row] = await db
    .insert(syllabuses)
    .values({
      organizationId: ctx.organizationId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      status: parsed.data.status,
    })
    .returning({ id: syllabuses.id });

  revalidatePath("/syllabuses");
  return success({ id: row.id });
}

export async function updateSyllabus(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireAuthContext();
  const parsed = syllabusSchema.safeParse(input);
  if (!parsed.success) {
    return failure("入力内容を確認してください", parsed.error.flatten().fieldErrors);
  }

  const [row] = await db
    .update(syllabuses)
    .set({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      status: parsed.data.status,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(syllabuses.id, id),
        eq(syllabuses.organizationId, ctx.organizationId),
      ),
    )
    .returning({ id: syllabuses.id });

  if (!row) return failure("シラバスが見つかりません");
  revalidatePath("/syllabuses");
  revalidatePath(`/syllabuses/${id}/edit`);
  return success({ id: row.id });
}

export async function deleteSyllabus(id: string): Promise<ActionResult<null>> {
  const ctx = await requireAuthContext();
  const denied = requireOrgRole(ctx, ["admin"]);
  if (denied) return denied;

  const result = await db
    .delete(syllabuses)
    .where(
      and(
        eq(syllabuses.id, id),
        eq(syllabuses.organizationId, ctx.organizationId),
      ),
    )
    .returning({ id: syllabuses.id });

  if (!result.length) return failure("シラバスが見つかりません");
  revalidatePath("/syllabuses");
  return success(null);
}
