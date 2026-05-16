# Syllabus

Next.js 上のメタフレームワーク。CLI + テンプレートで SaaS ダッシュボードを素早く立ち上げます。

## クイックスタート

```bash
# 必ずリポジトリルートで実行（templates/default 単体では install しない）
pnpm install
pnpm dev

# 環境変数（テンプレート）
cd templates/default
cp .env.example .env.local

# 新規プロジェクト生成
node ../../packages/create-syllabus/bin/cli.js my-app
```

## Clerk セットアップ

[docs/CLERK_SETUP.md](docs/CLERK_SETUP.md) を参照してください。

## スタック

- Next.js 15 (App Router)
- Clerk (Organizations)
- Drizzle + Vercel Postgres
- shadcn 風 UI + ダッシュボードレイアウト
- サンプル: `syllabuses` CRUD + DataTable
