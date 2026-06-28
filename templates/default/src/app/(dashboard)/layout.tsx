import { DashboardHeader } from "@/components/dashboard/header";
import { syncIdentity } from "@/lib/auth";
import { isFullyConfigured } from "@/env";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isFullyConfigured) {
    try {
      await syncIdentity();
    } catch (error) {
      console.error("syncIdentity failed:", error);
      const message =
        error instanceof Error
          ? error.message
          : "データベースへの接続に失敗しました";

      return (
        <div className="flex min-h-screen flex-col">
          <DashboardHeader />
          <main className="flex flex-1 items-center justify-center p-6">
            <div className="max-w-md space-y-3 text-center">
              <h1 className="text-lg font-semibold">接続エラー</h1>
              <p className="text-sm text-muted-foreground">{message}</p>
              <p className="text-xs text-muted-foreground">
                .env.local の POSTGRES_URL を確認し、開発サーバーを再起動してください。
              </p>
            </div>
          </main>
        </div>
      );
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 p-3 md:p-4">{children}</main>
    </div>
  );
}
