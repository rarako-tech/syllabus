# 図解ページの公開

ツール紹介の図解は **ログイン不要** で閲覧できます。

## URL

| 環境 | URL |
|------|-----|
| **Surge（一般公開）** | **https://syllabus-curriculum-tool.surge.sh** |
| ローカル（Next.js） | http://localhost:3000/overview |
| 本番（Vercel デプロイ後） | `https://<あなたのドメイン>/overview` |

## ファイルの場所

- Surge デプロイ用: `surge-overview/`（ルート）
- Next.js 公開用: `templates/default/public/overview/`
- 編集用の元ファイル: `docs/curriculum-tool-overview.html` と `docs/images/`

`docs/` を編集したあと、公開用に同期する例:

```powershell
Copy-Item docs/curriculum-tool-overview.html templates/default/public/overview/index.html
Copy-Item docs/curriculum-tool-overview.html surge-overview/index.html
Copy-Item docs/images/* templates/default/public/overview/images/
Copy-Item docs/images/* surge-overview/images/
```

Surge 用 `index.html` の `og:image` は絶対 URL（`https://syllabus-curriculum-tool.surge.sh/...`）のままにしてください。

## Surge へ再デプロイ

```bash
pnpm deploy:overview
```

初回のみ [Surge](https://surge.sh) へのログインが必要です（`surge login`）。

## 共有

- 上記 URL をそのまま共有できます
- SNS 用の OGP 画像は `tool-screenshot.png` を参照しています
