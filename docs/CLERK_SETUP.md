# Clerk セットアップ（Syllabus）

## 1. Clerk でアプリケーションを作成

1. [Clerk Dashboard](https://dashboard.clerk.com/) にログイン
2. **Create application** をクリック
3. アプリ名: `Syllabus`（任意）
4. 認証方式: **Email**（必要なら Google 等も追加）

## 2. Organizations を有効化

Syllabus はマルチテナント（`organizationId`）前提です。

1. 左メニュー **Configure** → **Organizations**
2. **Enable organizations** を ON
3. ロールはデフォルトの **admin** / **member** を使用（カスタム不要）

## 3. 環境変数をコピー

1. **Configure** → **API Keys**
2. `templates/default/.env.example` を `.env.local` にコピー
3. 次の値を貼り付け:

```env
SKIP_ENV_VALIDATION=false

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

## 4. ローカル URL を許可

**Configure** → **Paths**（または **Domains**）で以下を設定:

| 項目 | 値 |
|------|-----|
| Sign-in URL | `/sign-in` |
| Sign-up URL | `/sign-up` |
| After sign-in | `/dashboard` |
| After sign-up | `/dashboard` |

**Development** では `http://localhost:3000` が自動許可されます。  
別ポートを使う場合は **Allowed redirect URLs** に追加してください。

## 5. 初回ログイン後の Organization

1. `pnpm dev` で起動 → http://localhost:3000
2. **サインアップ** 後、Clerk の Organization 作成 UI が表示されます
3. 組織を 1 つ作成すると、ダッシュボードと `syllabuses` が org スコープで動作します

ヘッダーの **Organization Switcher** で組織を切り替えられます。

## 6. Postgres と合わせる（任意・本番データ）

Clerk だけでも UI は動きますが、DB 保存には Postgres が必要です。

1. Vercel で Storage（Postgres / Neon）を作成
2. `POSTGRES_URL` を `.env.local` に追加
3. リポジトリルートで:

```bash
pnpm db:push
```

## トラブルシュート

| 症状 | 対処 |
|------|------|
| サインイン後にループ | `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard` を確認 |
| Organization がない | Dashboard で Organizations が有効か確認 |
| 403 / Unauthorized | 組織を作成し、ヘッダーで org が選択されているか確認 |
| ビルドで env エラー | `SKIP_ENV_VALIDATION=true` で一時回避（本番は false） |
