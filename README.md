# ボッチャリーグ姫路 公式サイト

兵庫県姫路市を中心としたボッチャリーグの公式ウェブサイトです。

## アーキテクチャ

```
GitHub
  │
Vercel（無料）
  │
Next.js
  │
管理画面（/admin）
  │
Supabase（無料）
  │
ランキング・試合・お知らせデータ
```

## 機能

### 公開ページ
- トップページ（お知らせ・順位表）
- 順位表・日程・結果・大会レポート・参加チーム

### 管理画面（/admin）
- Supabase Auth による管理者ログイン（メール＋パスワード）
- スコア入力・順位編集・お知らせ・レポートの追加・編集・削除
- すべての変更は Supabase に永続保存

## セットアップ手順

### 1. Supabase プロジェクト作成

1. [Supabase](https://supabase.com) で無料アカウント作成
2. 新規プロジェクトを作成
3. **SQL Editor** で `supabase/schema.sql` の内容を実行
4. **Authentication > Users** で管理者ユーザーを追加（Add user > Create new user）
   - サインアップ画面は公開していないため、ここで手動作成します

### 2. 環境変数

```bash
cp .env.example .env.local
```

`.env.local` に Supabase の値を設定:

| 変数名 | 取得場所 |
|--------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings > API > anon public |

### 3. ローカル開発

```bash
npm install
npm run dev
```

- サイト: http://localhost:3100
- 管理画面: http://localhost:3100/admin

### 4. Vercel デプロイ

1. GitHub にリポジトリをプッシュ
2. [Vercel](https://vercel.com) でインポート
3. 環境変数 `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定
4. Deploy

## 技術スタック

- Next.js 15 (App Router)
- TypeScript + Tailwind CSS
- Supabase (PostgreSQL + Auth + RLS)
- Vercel（ホスティング）

## セキュリティ

- **RLS（Row Level Security）**: 公開データは誰でも読み取り可、書き込みはログイン済み管理者のみ
- **管理者アカウント**: Supabase Dashboard で手動作成（公開サインアップなし）
- `SUPABASE_SERVICE_ROLE_KEY` は使用せず、anon key + 認証済みセッションで操作

## 順位計算ルール

1. 勝数が多いチームが上位
2. 同勝数なら得失点差
3. それでも同じなら得点
4. 管理画面で手動順位の上書きも可能

## ディレクトリ構成

```
├── supabase/
│   └── schema.sql       # DBスキーマ・RLS・初期データ
├── src/
│   ├── app/             # ページとAPI
│   ├── components/      # UIコンポーネント
│   ├── lib/
│   │   ├── supabase/    # Supabaseクライアント
│   │   ├── data.ts      # データアクセス層
│   │   └── standings.ts # 順位計算
│   └── types/
```
