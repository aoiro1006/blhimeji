-- ボッチャリーグ姫路 Supabase スキーマ（正規化案）
-- ※ 現行アプリでは未使用。永続化は supabase/app_documents.sql（JSONB 1ドキュメント）を使うこと。
-- Supabase Dashboard > SQL Editor で実行してください

-- リーグ設定（1行のみ）
CREATE TABLE IF NOT EXISTS league_settings (
  id          INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  season      TEXT NOT NULL DEFAULT '2026',
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- チーム
CREATE TABLE IF NOT EXISTS teams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  short_name  TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#1a4d8f',
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 試合
CREATE TABLE IF NOT EXISTS matches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round         INT NOT NULL,
  date          DATE NOT NULL,
  home_team_id  UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id  UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  home_score    INT,
  away_score    INT,
  status        TEXT NOT NULL DEFAULT 'scheduled'
                CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  venue         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- お知らせ
CREATE TABLE IF NOT EXISTS news (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE NOT NULL,
  category    TEXT NOT NULL,
  title       TEXT NOT NULL,
  excerpt     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 大会レポート
CREATE TABLE IF NOT EXISTS reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE NOT NULL,
  title       TEXT NOT NULL,
  excerpt     TEXT NOT NULL DEFAULT '',
  content     TEXT NOT NULL DEFAULT '',
  image_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 順位手動上書き
CREATE TABLE IF NOT EXISTS standings_overrides (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       UUID NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  rank_override INT,
  note          TEXT
);

-- RLS 有効化
ALTER TABLE league_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams                ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches              ENABLE ROW LEVEL SECURITY;
ALTER TABLE news                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports              ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings_overrides  ENABLE ROW LEVEL SECURITY;

-- 公開読み取り（誰でも閲覧可）
CREATE POLICY "public_read_league_settings"     ON league_settings     FOR SELECT USING (true);
CREATE POLICY "public_read_teams"               ON teams               FOR SELECT USING (true);
CREATE POLICY "public_read_matches"             ON matches             FOR SELECT USING (true);
CREATE POLICY "public_read_news"                ON news                FOR SELECT USING (true);
CREATE POLICY "public_read_reports"             ON reports             FOR SELECT USING (true);
CREATE POLICY "public_read_standings_overrides" ON standings_overrides FOR SELECT USING (true);

-- 管理者のみ書き込み（Supabase Auth でログインしたユーザーのみ）
CREATE POLICY "admin_write_league_settings"     ON league_settings     FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_write_teams"               ON teams               FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_write_matches"             ON matches             FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_write_news"                ON news                FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_write_reports"             ON reports             FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_write_standings_overrides" ON standings_overrides FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 初期データ
INSERT INTO league_settings (id, season) VALUES (1, '2026')
ON CONFLICT (id) DO NOTHING;

INSERT INTO teams (id, name, short_name, color, sort_order) VALUES
  ('a0000001-0000-4000-8000-000000000001', '姫路ボッチャクラブ', '姫路', '#1a4d8f', 1),
  ('a0000001-0000-4000-8000-000000000002', '播磨ボッチャ会',     '播磨', '#e63946', 2),
  ('a0000001-0000-4000-8000-000000000003', 'たつのボッチャ',     'たつの', '#2a9d8f', 3),
  ('a0000001-0000-4000-8000-000000000004', '赤穂ボッチャ',       '赤穂', '#f4a261', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO matches (id, round, date, home_team_id, away_team_id, home_score, away_score, status, venue) VALUES
  ('b0000001-0000-4000-8000-000000000001', 1, '2026-04-12', 'a0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000002', 5, 3, 'completed', '姫路市立体育館'),
  ('b0000001-0000-4000-8000-000000000002', 1, '2026-04-12', 'a0000001-0000-4000-8000-000000000003', 'a0000001-0000-4000-8000-000000000004', 4, 4, 'completed', '姫路市立体育館'),
  ('b0000001-0000-4000-8000-000000000003', 2, '2026-05-17', 'a0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000003', NULL, NULL, 'scheduled', 'たつの市総合体育館'),
  ('b0000001-0000-4000-8000-000000000004', 2, '2026-05-17', 'a0000001-0000-4000-8000-000000000002', 'a0000001-0000-4000-8000-000000000004', NULL, NULL, 'scheduled', 'たつの市総合体育館')
ON CONFLICT (id) DO NOTHING;

INSERT INTO news (id, date, category, title, excerpt) VALUES
  ('c0000001-0000-4000-8000-000000000001', '2026-06-01', 'お知らせ', 'ボッチャリーグ姫路 2026シーズン開幕のお知らせ', '4月より2026シーズンが開幕します。'),
  ('c0000001-0000-4000-8000-000000000002', '2026-05-20', '試合結果', '第1節 試合結果を更新しました', NULL),
  ('c0000001-0000-4000-8000-000000000003', '2026-04-01', 'お知らせ', '参加チーム・日程が決定しました', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO reports (id, date, title, excerpt, content) VALUES
  ('d0000001-0000-4000-8000-000000000001', '2026-04-15', '第1節 大会レポート',
   '姫路市立体育館で開催された第1節の様子をお届けします。',
   '2026年4月12日、姫路市立体育館にてボッチャリーグ姫路第1節が開催されました。

第1試合は姫路ボッチャクラブ対播磨ボッチャ会。序盤から接戦を繰り広げ、最終的に姫路が5-3で勝利しました。

第2試合はたつのボッチャ対赤穂ボッチャ。両チーム互いに譲らず、4-4の引き分けとなりました。

次節は5月17日、たつの市総合体育館で開催予定です。')
ON CONFLICT (id) DO NOTHING;
