-- Google OAuth トークンを user_settings に保存するカラムを追加
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS google_provider_token       text,
  ADD COLUMN IF NOT EXISTS google_provider_refresh_token text,
  ADD COLUMN IF NOT EXISTS google_token_updated_at     timestamptz;
