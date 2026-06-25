-- 期限通知の重複送信防止のため、通知済み日付を記録するカラムを追加
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS notified_dates TEXT[] NOT NULL DEFAULT '{}';
