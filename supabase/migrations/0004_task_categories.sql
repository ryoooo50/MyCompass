-- tasks: category(単一文字列) → categories(配列)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS categories text[] NOT NULL DEFAULT '{}';

-- 既存データの移行: category が入っていた行を categories に移す
UPDATE tasks
  SET categories = ARRAY[category]
  WHERE category IS NOT NULL AND category <> '';

-- user_settings: ユーザーごとのカテゴリーリストを保存
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS task_categories text[] NOT NULL DEFAULT '{}';
