-- ============================================================
-- My Compass v2 — 初期スキーマ
-- ============================================================
-- 実行方法: Supabase ダッシュボード > SQL Editor に貼り付けて実行
-- ============================================================

-- updated_at 自動更新トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         text        NOT NULL,
  description   text,
  priority      text        NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  due_date      date,
  category      text,
  completed     boolean     NOT NULL DEFAULT false,
  completed_at  timestamptz,
  notion_id     text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own tasks"
  ON tasks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- finance_records
-- ============================================================
CREATE TABLE IF NOT EXISTS finance_records (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount      integer     NOT NULL,
  type        text        NOT NULL CHECK (type IN ('income', 'expense')),
  category    text        NOT NULL,
  date        date        NOT NULL,
  memo        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE finance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own finance_records"
  ON finance_records FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- monthly_budgets
-- ============================================================
CREATE TABLE IF NOT EXISTS monthly_budgets (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year_month     text        NOT NULL,
  budget_amount  integer     NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, year_month)
);

ALTER TABLE monthly_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own monthly_budgets"
  ON monthly_budgets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER monthly_budgets_updated_at
  BEFORE UPDATE ON monthly_budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- research_phases
-- ============================================================
CREATE TABLE IF NOT EXISTS research_phases (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phase_key   text        NOT NULL,
  phase_name  text        NOT NULL,
  progress    integer     NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, phase_key)
);

ALTER TABLE research_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own research_phases"
  ON research_phases FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER research_phases_updated_at
  BEFORE UPDATE ON research_phases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- research_milestones
-- ============================================================
CREATE TABLE IF NOT EXISTS research_milestones (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        text        NOT NULL,
  due_date     date,
  achieved     boolean     NOT NULL DEFAULT false,
  achieved_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE research_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own research_milestones"
  ON research_milestones FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER research_milestones_updated_at
  BEFORE UPDATE ON research_milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- work_shifts
-- ============================================================
CREATE TABLE IF NOT EXISTS work_shifts (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date           date        NOT NULL,
  start_time     time        NOT NULL,
  end_time       time        NOT NULL,
  hourly_rate    integer     NOT NULL,
  transport_fee  integer     NOT NULL DEFAULT 0,
  confirmed      boolean     NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE work_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own work_shifts"
  ON work_shifts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER work_shifts_updated_at
  BEFORE UPDATE ON work_shifts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- daily_reports
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_reports (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_date    date        NOT NULL,
  done_today     text,
  insights       text,
  tomorrow_plan  text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, report_date)
);

ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own daily_reports"
  ON daily_reports FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER daily_reports_updated_at
  BEFORE UPDATE ON daily_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- user_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  obsidian_vault_name text,
  notion_home_url     text,
  custom_apps         jsonb       NOT NULL DEFAULT '[]',
  calendar_ids        jsonb       NOT NULL DEFAULT '[]',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own user_settings"
  ON user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
