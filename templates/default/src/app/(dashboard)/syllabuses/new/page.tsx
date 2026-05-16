import { SyllabusForm } from "@/components/syllabuses/syllabus-form";
import { isFullyConfigured } from "@/env";
import { redirect } from "next/navigation";

export default function NewSyllabusPage() {
  if (!isFullyConfigured) redirect("/syllabuses");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">シラバスを作成</h1>
      <SyllabusForm mode="create" />
    </div>
  );
}
