-- app_documents: LeagueData / SiteConfig / SeasonArchive を JSONB 1ドキュメントで保存
-- Supabase Dashboard > SQL Editor で実行してください
--
-- document_key 例:
--   league
--   site
--   archive_2025
--   archive_2026

CREATE TABLE IF NOT EXISTS app_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_key  TEXT NOT NULL UNIQUE,
  document_type TEXT NOT NULL
                CHECK (document_type IN ('league', 'site', 'archive')),
  season        TEXT NULL,
  payload       JSONB NOT NULL,
  version       INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_documents_type_idx ON app_documents (document_type);
CREATE INDEX IF NOT EXISTS app_documents_season_idx ON app_documents (season)
  WHERE season IS NOT NULL;

ALTER TABLE app_documents ENABLE ROW LEVEL SECURITY;

-- 公開サイトはサーバ（service role）経由で読む想定のため、anon の直接アクセスは閉じる。
-- 必要なら後から public_read ポリシーを追加してください。
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.app_documents TO service_role;

-- 楽観ロック付き更新用 RPC（version 不一致時は 0 行）
CREATE OR REPLACE FUNCTION save_app_document(
  p_document_key TEXT,
  p_document_type TEXT,
  p_season TEXT,
  p_payload JSONB,
  p_expected_version INTEGER
)
RETURNS TABLE (new_version INTEGER, new_updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE app_documents AS d
  SET
    payload = p_payload,
    version = d.version + 1,
    updated_at = now(),
    document_type = p_document_type,
    season = p_season
  WHERE d.document_key = p_document_key
    AND d.version = p_expected_version
  RETURNING d.version, d.updated_at;

  IF NOT FOUND THEN
    -- 行が無い場合は新規挿入（expected_version は 0 を想定）
    IF p_expected_version = 0 THEN
      BEGIN
        INSERT INTO app_documents (document_key, document_type, season, payload, version)
        VALUES (p_document_key, p_document_type, p_season, p_payload, 1);
        RETURN QUERY
        SELECT 1::INTEGER, now();
      EXCEPTION WHEN unique_violation THEN
        -- 同時作成で競合
        RETURN;
      END;
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION save_app_document FROM PUBLIC;
GRANT EXECUTE ON FUNCTION save_app_document TO service_role;
