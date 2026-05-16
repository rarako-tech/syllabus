import { notFound, redirect } from "next/navigation";
import { getSyllabus } from "@/actions/syllabuses";
import { SyllabusForm } from "@/components/syllabuses/syllabus-form";
import { isFullyConfigured } from "@/env";

type Props = { params: Promise<{ id: string }> };

export default async function EditSyllabusPage({ params }: Props) {
  if (!isFullyConfigured) redirect("/syllabuses");

  const { id } = await params;
  const syllabus = await getSyllabus(id);
  if (!syllabus) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">シラバスを編集</h1>
      <SyllabusForm
        mode="edit"
        syllabusId={id}
        defaultValues={{
          title: syllabus.title,
          description: syllabus.description ?? "",
          status: syllabus.status,
        }}
      />
    </div>
  );
}
