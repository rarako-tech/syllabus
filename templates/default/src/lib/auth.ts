import { auth, clerkClient } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  organizationMembers,
  organizations,
  users,
} from "@/db/schema";
import { isFullyConfigured } from "@/env";
import { failure } from "@/lib/action-result";

export type AuthContext = {
  userId: string;
  organizationId: string;
  clerkOrgId: string;
  role: "admin" | "member";
};

export async function syncIdentity(): Promise<AuthContext | null> {
  if (!isFullyConfigured) return null;

  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) return null;

  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(userId);
  const clerkOrg = await clerk.organizations.getOrganization({
    organizationId: orgId,
  });

  const email =
    clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    "";

  const name = [clerkUser.firstName, clerkUser.lastName]
    .filter(Boolean)
    .join(" ");

  let dbUser = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  });

  if (dbUser) {
    [dbUser] = await db
      .update(users)
      .set({ email, name })
      .where(eq(users.id, dbUser.id))
      .returning();
  } else {
    [dbUser] = await db
      .insert(users)
      .values({ clerkUserId: userId, email, name })
      .returning();
  }

  if (!dbUser) {
    throw new Error("ユーザー情報の保存に失敗しました");
  }

  let dbOrg = await db.query.organizations.findFirst({
    where: eq(organizations.clerkOrgId, orgId),
  });

  if (dbOrg) {
    [dbOrg] = await db
      .update(organizations)
      .set({ name: clerkOrg.name })
      .where(eq(organizations.id, dbOrg.id))
      .returning();
  } else {
    [dbOrg] = await db
      .insert(organizations)
      .values({ clerkOrgId: orgId, name: clerkOrg.name })
      .returning();
  }

  if (!dbOrg) {
    throw new Error("組織情報の保存に失敗しました");
  }

  const role: "admin" | "member" =
    orgRole === "org:admin" ? "admin" : "member";

  const existingMember = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.organizationId, dbOrg.id),
      eq(organizationMembers.userId, dbUser.id),
    ),
  });

  if (existingMember) {
    await db
      .update(organizationMembers)
      .set({ role })
      .where(eq(organizationMembers.id, existingMember.id));
  } else {
    await db.insert(organizationMembers).values({
      organizationId: dbOrg.id,
      userId: dbUser.id,
      role,
    });
  }

  return {
    userId: dbUser.id,
    organizationId: dbOrg.id,
    clerkOrgId: orgId,
    role,
  };
}

export async function requireAuthContext(): Promise<AuthContext> {
  const ctx = await syncIdentity();
  if (!ctx) throw new Error("Unauthorized");
  return ctx;
}

export function requireOrgRole(
  ctx: AuthContext,
  allowed: Array<"admin" | "member">,
) {
  if (!allowed.includes(ctx.role)) {
    return failure("この操作を行う権限がありません");
  }
  return null;
}
