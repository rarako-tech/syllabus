import { OrganizationList } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SelectOrgPage() {
  const { orgId } = await auth();
  if (orgId) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="max-w-md space-y-2 text-center">
        <h1 className="text-2xl font-bold">組織を選択または作成</h1>
        <p className="text-sm text-muted-foreground">
          Syllabus は組織（Organization）単位でデータを管理します。
          Clerk で組織を作成してからダッシュボードへ進んでください。
        </p>
      </div>
      <OrganizationList
        hidePersonal
        afterCreateOrganizationUrl="/dashboard"
        afterSelectOrganizationUrl="/dashboard"
      />
    </main>
  );
}
