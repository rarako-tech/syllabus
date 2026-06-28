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

## ツール紹介（公開）

ログイン不要の図解ページ:

- **Surge:** https://syllabus-curriculum-tool.surge.sh
- ローカル（Next.js）: http://localhost:3000/overview

再デプロイ: `pnpm deploy:overview` — 詳細は [docs/OVERVIEW_PUBLIC.md](docs/OVERVIEW_PUBLIC.md)

## データの保存方針

[docs/DATA_STORAGE.md](docs/DATA_STORAGE.md) — DB / リポジトリ / 外部サービスの役割分担

## Clerk セットアップ

[docs/CLERK_SETUP.md](docs/CLERK_SETUP.md) を参照してください。

## スタック

- Next.js 15 (App Router)
- Clerk (Organizations)
- Drizzle + Vercel Postgres
- shadcn 風 UI + ダッシュボードレイアウト
- サンプル: `syllabuses` CRUD + DataTable
