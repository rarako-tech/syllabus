import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSyllabus } from "@/actions/syllabuses";
import { SyllabusForm } from "@/components/syllabuses/syllabus-form";
import { Button } from "@/components/ui/button";
import { isFullyConfigured } from "@/env";

type Props = { params: Promise<{ id: string }> };

export default async function EditSyllabusPage({ params }: Props) {
  if (!isFullyConfigured) redirect("/syllabuses");

  const { id } = await params;
  let syllabus;
  try {
    syllabus = await getSyllabus(id);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      redirect("/sign-in");
    }

    const message =
      error instanceof Error
        ? error.message
        : "データベースへの接続に失敗しました";

    return (
      <div className="mx-auto max-w-lg space-y-4 py-8">
        <h1 className="text-xl font-bold">接続エラー</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        <p className="text-xs text-muted-foreground">
          Neon データベースへの接続がタイムアウトした可能性があります。少し待ってから再読み込みしてください。
        </p>
        <Button variant="outline" asChild>
          <Link href="/syllabuses">シラバス一覧へ</Link>
        </Button>
      </div>
    );
  }

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
