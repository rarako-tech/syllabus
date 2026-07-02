import { AuthenticatedLayout } from "@/components/dashboard/authenticated-layout";

export default function SyllabusesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
