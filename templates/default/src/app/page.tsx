import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isClerkConfigured, isFullyConfigured } from "@/env";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 p-6">
      <div className="space-y-3 text-center">
        <p className="text-sm font-medium text-muted-foreground">Syllabus</p>
        <h1 className="text-4xl font-bold tracking-tight">
          Next.js 上の SaaS ダッシュボード基盤
        </h1>
        <p className="text-muted-foreground">
          Clerk · Drizzle · マルチテナント · syllabuses サンプル付き
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>クイックスタート</CardTitle>
          <CardDescription>
            {isClerkConfigured
              ? isFullyConfigured
                ? "Clerk と DB が設定されています。"
                : "Clerk が設定されています。DB 未設定のためシラバスはデモデータです。"
              : "デモモード: UI を確認できます。本番利用は .env.local を設定してください。"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard">ダッシュボードを開く</Link>
          </Button>
          {!isClerkConfigured && (
            <Button variant="outline" asChild>
              <Link href="/syllabuses">シラバス一覧（デモ）</Link>
            </Button>
          )}
          {isClerkConfigured && (
            <>
              <Button variant="outline" asChild>
                <Link href="/sign-in">サインイン</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/sign-up">サインアップ</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {!isClerkConfigured && (
        <Card>
          <CardHeader>
            <CardTitle>セットアップ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. <code className="rounded bg-muted px-1">.env.example</code> を <code className="rounded bg-muted px-1">.env.local</code> にコピー</p>
            <p>2. Clerk（Organizations 有効）と Postgres のキーを設定 — 詳細は <code className="rounded bg-muted px-1">docs/CLERK_SETUP.md</code></p>
            <p>3. <code className="rounded bg-muted px-1">SKIP_ENV_VALIDATION=false</code> に変更</p>
            <p>4. <code className="rounded bg-muted px-1">pnpm db:push</code> でスキーマ反映</p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
