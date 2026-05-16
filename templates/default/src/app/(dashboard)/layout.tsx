import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { syncIdentity } from "@/lib/auth";
import { isFullyConfigured } from "@/env";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isFullyConfigured) {
    await syncIdentity();
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <DashboardSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
