# Google Search Console 完全ガイド
## 〜Webサイト作成からGSC活用まで〜

---

## 📋 目次

1. [前提条件](#1-前提条件)
2. [GitHub Pagesでサイトを公開する](#2-github-pagesでサイトを公開する)
3. [Google Search Consoleに登録する](#3-google-search-consoleに登録する)
4. [所有権を確認する](#4-所有権を確認する)
5. [サイトマップを送信する](#5-サイトマップを送信する)
6. [Google Search Consoleの主要機能](#6-google-search-consoleの主要機能)
7. [よくある質問（FAQ）](#7-よくある質問faq)

---

## 1. 前提条件

以下のアカウントが必要です（いずれも無料）：

| 必要なもの | 用途 | 取得先 |
|-----------|------|--------|
| **Google アカウント** | GSC利用 | [accounts.google.com](https://accounts.google.com) |
| **GitHub アカウント** | サイト公開 | [github.com/signup](https://github.com/signup) |
| **Git** | ファイルアップロード | [git-scm.com](https://git-scm.com/downloads) |

---

## 2. GitHub Pagesでサイトを公開する

### Step 1: GitHubにリポジトリを作成

1. [github.com/new](https://github.com/new) にアクセス
2. 以下の設定でリポジトリを作成：
   - **Repository name**: `techpulse`（任意の名前でOK）
   - **Public** を選択（GitHub Pages無料版はPublicが必要）
   - 「Create repository」をクリック

### Step 2: ファイルをアップロード

ターミナル（PowerShell）で以下のコマンドを実行：

```powershell
# 作業ディレクトリに移動
cd c:\Users\tosh\.antigravity\work\googleSearchConsole

# Gitリポジトリを初期化
git init
git add .
git commit -m "Initial commit: TechPulse website"

# GitHubリポジトリに接続してプッシュ
# ※ studioinstance を自分のGitHubユーザー名に置き換えてください
git remote add origin https://github.com/studioinstance/techpulse.git
git branch -M main
git push -u origin main
```

### Step 3: GitHub Pagesを有効化

1. GitHubのリポジトリページを開く
2. **Settings** → **Pages** に移動
3. **Source** で「Deploy from a branch」を選択
4. **Branch** で「main」、フォルダで「/ (root)」を選択
5. **Save** をクリック
6. 数分後、サイトが `https://studioinstance.github.io/techpulse/` で公開される

> ⚠️ **重要**: 公開後、各HTMLファイルの `studioinstance` 部分を自分のユーザー名に置き換えてください（canonical URL、OGタグ等）。`sitemap.xml` と `robots.txt` のURLも同様に更新が必要です。

---

## 3. Google Search Consoleに登録する

### Step 1: GSCにアクセス

1. [Google Search Console](https://search.google.com/search-console) にアクセス
2. Googleアカウントでログイン

### Step 2: プロパティを追加

ログイン後、「プロパティを追加」画面が表示されます。**2つの方法**があります：

| 方法 | 説明 | おすすめ度 |
|------|------|-----------|
| **ドメイン** | ドメイン全体（DNS確認が必要） | ❌ GitHub Pagesでは不可 |
| **URLプレフィックス** | 特定のURLパス配下 | ✅ こちらを使用 |

**「URLプレフィックス」を選択**し、以下のURLを入力：
```
https://studioinstance.github.io/techpulse/
```

---

## 4. 所有権を確認する

URLプレフィックスを入力すると、所有権の確認方法が表示されます。**HTMLファイル方式**が最も簡単です。

### 方法: HTMLファイルをアップロード

1. GSCが提供するHTMLファイル（例: `googleXXXXXXXX.html`）をダウンロード
2. ダウンロードしたファイルをプロジェクトフォルダにコピー：
   ```powershell
   # ダウンロードしたファイルをプロジェクトフォルダにコピー
   copy ~/Downloads/googleXXXXXXXX.html c:\Users\tosh\.antigravity\work\googleSearchConsole\
   ```
3. GitHubにアップロード：
   ```powershell
   cd c:\Users\tosh\.antigravity\work\googleSearchConsole
   git add .
   git commit -m "Add Google Search Console verification file"
   git push
   ```
4. GSC画面に戻り「確認」ボタンをクリック
5. 「所有権を確認しました」と表示されれば成功 🎉

### 代替方法: HTMLメタタグ

HTMLファイルが面倒な場合は、`<head>`内にメタタグを追加することもできます：
```html
<meta name="google-site-verification" content="GSCから提供される値" />
```

---

## 5. サイトマップを送信する

所有権確認後、サイトマップを送信してGoogleにページ構成を伝えます。

1. GSC左メニューから **「サイトマップ」** を選択
2. 「新しいサイトマップの追加」に以下を入力：
   ```
   sitemap.xml
   ```
3. **「送信」** をクリック
4. ステータスが「成功しました」になれば完了 ✅

> 💡 サイトマップを送信すると、Googleのクローラーがサイトの構造を理解し、効率的にインデックス登録を行います。

---

## 6. Google Search Consoleの主要機能

### 📊 検索パフォーマンス
GSCの最も重要な機能。サイトがGoogle検索でどのように表示されているかを確認できます。

| 指標 | 意味 |
|------|------|
| **クリック数** | 検索結果からサイトがクリックされた回数 |
| **表示回数** | 検索結果にサイトが表示された回数 |
| **CTR（クリック率）** | 表示回数に対するクリック率 |
| **掲載順位** | 検索結果での平均掲載順位 |

**活用方法**：
- どのキーワードで検索されているかを確認
- CTRが低いページのタイトルやメタディスクリプションを改善
- 掲載順位の変動をモニタリング

---

### 🔍 URL検査
特定のURLのインデックス状況を確認・リクエストできます。

**使い方**：
1. 上部の検索バーにURLを入力
2. 「URLがGoogleに登録されています」→ 正常
3. 「URLがGoogleに登録されていません」→ 「インデックス登録をリクエスト」をクリック

**活用場面**：
- 新しいページを公開した時 → すぐにインデックスをリクエスト
- ページを更新した時 → 再クロールをリクエスト
- インデックスされない原因を調査

---

### 📑 ページ（インデックス カバレッジ）
サイト全体のインデックス状況を一覧で確認できます。

| ステータス | 意味 |
|-----------|------|
| ✅ 有効 | 正常にインデックスされている |
| ⚠️ 有効（警告あり） | インデックスされているが改善の余地あり |
| ❌ エラー | インデックスされていない（修正が必要） |
| ⛔ 除外 | 意図的にまたは自動的に除外 |

---

### 📱 モバイル ユーザビリティ
モバイルでの表示問題をチェックできます。

**確認される項目**：
- テキストが小さすぎないか
- タップ要素の間隔が狭すぎないか
- ビューポートが設定されているか
- コンテンツが画面幅に収まっているか

> 今回作成したTechPulseサイトはレスポンシブ対応済みなので、問題なく通過するはずです。

---

### 🔗 リンク
外部サイトや内部リンクの状況を確認できます。

| 項目 | 説明 |
|------|------|
| **外部リンク** | 他サイトからのリンク（被リンク） |
| **内部リンク** | サイト内のページ間リンク |
| **上位のリンク元サイト** | どのサイトからリンクされているか |

---

### ⚡ ウェブに関する主な指標（Core Web Vitals）
ページの読み込み速度とユーザー体験を測定します。

| 指標 | 意味 | 良好な値 |
|------|------|----------|
| **LCP** | 最大コンテンツの描画 | 2.5秒以下 |
| **INP** | 次の描画へのインタラクション | 200ms以下 |
| **CLS** | レイアウトの累積シフト | 0.1以下 |

---

## 7. よくある質問（FAQ）

### Q: インデックスされるまでどれくらいかかる？
**A:** 数日〜数週間かかることがあります。サイトマップを送信し、URL検査でインデックス登録をリクエストすると早くなります。

### Q: 検索パフォーマンスのデータが表示されない
**A:** データの反映には2〜3日かかります。新規サイトの場合、検索トラフィックが発生するまでデータは表示されません。

### Q: 「クロール済み - インデックス未登録」と表示される
**A:** Googleがページをクロールしたが、インデックスする価値がないと判断した可能性があります。コンテンツの品質・量を改善してください。

### Q: サイトマップの送信でエラーが出る
**A:** `sitemap.xml` のURL形式が正しいか確認してください。サイトのルートディレクトリに配置されている必要があります。

---

## 📌 まとめ：やることチェックリスト

- [ ] GitHub アカウントを作成
- [ ] リポジトリ `techpulse` を作成
- [ ] サイトファイルをプッシュ
- [ ] GitHub Pages を有効化
- [ ] HTMLファイル内の `studioinstance` を自分のユーザー名に置換
- [ ] `sitemap.xml` と `robots.txt` のURLを更新
- [ ] Google Search Console にアクセス
- [ ] URLプレフィックスでプロパティを追加
- [ ] 所有権を確認（HTMLファイル方式）
- [ ] サイトマップを送信
- [ ] URL検査でインデックス登録をリクエスト
