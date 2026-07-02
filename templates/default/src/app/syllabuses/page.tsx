import Link from "next/link";
import { listSyllabuses } from "@/actions/syllabuses";
import { SyllabusTable } from "@/components/syllabuses/syllabus-table";
import { Button } from "@/components/ui/button";
import { demoSyllabuses } from "@/lib/demo-data";
import { isFullyConfigured } from "@/env";

export default async function SyllabusesPage() {
  const rows = isFullyConfigured ? await listSyllabuses() : demoSyllabuses;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">シラバス</h1>
          <p className="text-sm text-muted-foreground">
            {isFullyConfigured ? "組織に紐づくシラバス一覧" : "デモデータを表示中"}
          </p>
        </div>
        {isFullyConfigured && (
          <Button asChild>
            <Link href="/syllabuses/new">新規作成</Link>
          </Button>
        )}
      </div>
      <SyllabusTable data={rows} demo={!isFullyConfigured} />
    </div>
  );
}
