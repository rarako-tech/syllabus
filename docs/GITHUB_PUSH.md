# GitHub へ push する手順

リポジトリ: **https://github.com/rarako-tech/syllabus**

## 前提（済んでいること）

- 初回コミット済み（`main` ブランチ）
- リモート設定済み: `origin` → `https://github.com/rarako-tech/syllabus.git`
- `.env.local` は `.gitignore` 対象（秘密情報は含まれません）

## 1. GitHub で空リポジトリを作成（未作成の場合）

1. https://github.com/new を開く
2. Repository name: `syllabus`
3. **Add a README** 等は付けず、空のまま **Create repository**

## 2. GitHub にログイン（初回のみ）

PowerShell で次のいずれかを実行します。

### 方法 A: GitHub CLI（推奨）

```powershell
gh auth login
```

- GitHub.com → HTTPS → Login with a web browser

### 方法 B: Personal Access Token

1. https://github.com/settings/tokens で classic token を作成（`repo` 権限）
2. push 時にパスワード欄へ **トークン** を貼り付け

## 3. push

```powershell
cd C:\Users\ASUS\dev\syllabus
git push -u origin main
```

成功すると: https://github.com/rarako-tech/syllabus でコードが見えます。

## リモート確認

```powershell
git remote -v
```

`origin  https://github.com/rarako-tech/syllabus.git` になっていれば OK です。
