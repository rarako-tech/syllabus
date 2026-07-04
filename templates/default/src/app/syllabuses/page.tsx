import Link from "next/link";
import { redirect } from "next/navigation";
import { listSyllabuses } from "@/actions/syllabuses";
import { SyllabusTable } from "@/components/syllabuses/syllabus-table";
import { Button } from "@/components/ui/button";
import { demoSyllabuses } from "@/lib/demo-data";
import { isFullyConfigured } from "@/env";

export default async function SyllabusesPage() {
  if (!isFullyConfigured) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">シラバス</h1>
            <p className="text-sm text-muted-foreground">デモデータを表示中</p>
          </div>
        </div>
        <SyllabusTable data={demoSyllabuses} demo />
      </div>
    );
  }

  let rows;
  try {
    rows = await listSyllabuses();
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      redirect("/sign-in");
    }

    return (
      <div className="mx-auto max-w-lg space-y-4 py-8">
        <h1 className="text-xl font-bold">接続エラー</h1>
        <p className="text-sm text-muted-foreground">
          データベースへの接続に失敗しました。
        </p>
        <p className="text-xs text-muted-foreground">
          Neon データベースへの接続がタイムアウトした可能性があります。少し待ってから再読み込みしてください。
        </p>
        <Button variant="outline" asChild>
          <Link href="/dashboard">ダッシュボードへ戻る</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">シラバス</h1>
          <p className="text-sm text-muted-foreground">組織に紐づくシラバス一覧</p>
        </div>
        <Button asChild>
          <Link href="/syllabuses/new">新規作成</Link>
        </Button>
      </div>
      <SyllabusTable data={rows} demo={false} />
    </div>
  );
}
