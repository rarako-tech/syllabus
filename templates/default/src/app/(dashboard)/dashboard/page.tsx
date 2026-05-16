import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isFullyConfigured } from "@/env";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <p className="text-sm text-muted-foreground">
          {isFullyConfigured
            ? "組織スコープでデータを管理します。"
            : "デモモード — 環境変数を設定すると本番データに接続できます。"}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>シラバス</CardTitle>
            <CardDescription>一覧・作成・編集・削除のサンプル CRUD</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/syllabuses">シラバス一覧へ</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>権限</CardTitle>
            <CardDescription>Clerk org ロール: admin / member</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            削除操作は admin のみ（本番接続時）
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
