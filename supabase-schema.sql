-- ============================================================
-- Mapping Tool - Supabase 建表脚本
-- 请在 Supabase SQL Editor 中执行本脚本
-- ============================================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------
-- 1. 岗位表 (positions)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS positions (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  department      TEXT NOT NULL DEFAULT '',
  type            TEXT NOT NULL DEFAULT '一线执行岗',
  priority        TEXT NOT NULL DEFAULT 'P2',
  hiring_manager  TEXT NOT NULL DEFAULT '',
  target_count    INTEGER NOT NULL DEFAULT 1,
  expected_date   TEXT NOT NULL DEFAULT '',
  salary_range    TEXT NOT NULL DEFAULT '',
  city            TEXT NOT NULL DEFAULT '',
  keywords        TEXT NOT NULL DEFAULT '',
  core_requirements TEXT NOT NULL DEFAULT '',
  industry_requirement TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'Mapping中',
  risk            TEXT NOT NULL DEFAULT '',
  notes           TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at      TEXT NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);

-- -----------------------------------------------------------
-- 2. 目标公司表 (companies)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT '其他',
  industry_tags   TEXT NOT NULL DEFAULT '',
  region          TEXT NOT NULL DEFAULT '',
  city            TEXT NOT NULL DEFAULT '',
  linked_positions JSONB NOT NULL DEFAULT '[]'::jsonb,
  talent_quality  TEXT NOT NULL DEFAULT '中',
  hunt_priority   TEXT NOT NULL DEFAULT 'C',
  identified_candidates INTEGER NOT NULL DEFAULT 0,
  notes           TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at      TEXT NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);

-- -----------------------------------------------------------
-- 3. 候选人表 (candidates)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS candidates (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  current_company TEXT NOT NULL DEFAULT '',
  current_position TEXT NOT NULL DEFAULT '',
  city            TEXT NOT NULL DEFAULT '',
  contact         TEXT NOT NULL DEFAULT '',
  source          TEXT NOT NULL DEFAULT '其他',
  linked_position_id TEXT NOT NULL DEFAULT '',
  linked_company_id TEXT NOT NULL DEFAULT '',
  experience_years INTEGER NOT NULL DEFAULT 0,
  current_salary  TEXT NOT NULL DEFAULT '',
  expected_salary TEXT NOT NULL DEFAULT '',
  has_management_exp BOOLEAN NOT NULL DEFAULT false,
  management_count INTEGER NOT NULL DEFAULT 0,
  english_level   TEXT NOT NULL DEFAULT '',
  industry_tags   TEXT NOT NULL DEFAULT '',
  skill_tags      TEXT NOT NULL DEFAULT '',
  position_tendency TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT '未触达',
  match_level     TEXT NOT NULL DEFAULT '',
  risk_points     TEXT NOT NULL DEFAULT '',
  notes           TEXT NOT NULL DEFAULT '',
  scores          JSONB NOT NULL DEFAULT '{"industryMatch":3,"positionExp":3,"performanceResults":3,"abilityMatch":3,"growthPotential":3}'::jsonb,
  total_score     INTEGER NOT NULL DEFAULT 15,
  candidate_level TEXT NOT NULL DEFAULT 'C',
  manual_judgment TEXT NOT NULL DEFAULT '',
  last_follow_up  TEXT NOT NULL DEFAULT '',
  next_action     TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at      TEXT NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);

-- -----------------------------------------------------------
-- 4. 面试反馈表 (feedbacks)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS feedbacks (
  id              TEXT PRIMARY KEY,
  candidate_id    TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  position_id     TEXT NOT NULL DEFAULT '',
  round           TEXT NOT NULL DEFAULT '初面',
  interviewer     TEXT NOT NULL DEFAULT '',
  interview_time  TEXT NOT NULL DEFAULT '',
  result          TEXT NOT NULL DEFAULT '待定',
  highlights      TEXT NOT NULL DEFAULT '',
  risks           TEXT NOT NULL DEFAULT '',
  fit_judgment    TEXT NOT NULL DEFAULT '',
  suggestion      TEXT NOT NULL DEFAULT '',
  add_to_talent_pool BOOLEAN NOT NULL DEFAULT false,
  follow_up       TEXT NOT NULL DEFAULT '',
  detailed_evaluation TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);

-- -----------------------------------------------------------
-- 索引
-- -----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_candidates_position ON candidates(linked_position_id);
CREATE INDEX IF NOT EXISTS idx_candidates_company ON candidates(linked_company_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_candidate ON feedbacks(candidate_id);
CREATE INDEX IF NOT EXISTS idx_companies_positions ON companies USING GIN (linked_positions);

-- -----------------------------------------------------------
-- updated_at 自动更新触发器
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now() AT TIME ZONE 'utc';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_positions_updated_at') THEN
    CREATE TRIGGER set_positions_updated_at BEFORE UPDATE ON positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_companies_updated_at') THEN
    CREATE TRIGGER set_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_candidates_updated_at') THEN
    CREATE TRIGGER set_candidates_updated_at BEFORE UPDATE ON candidates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

-- -----------------------------------------------------------
-- RLS 策略 (允许认证用户读写自己的数据)
-- -----------------------------------------------------------
-- 为简化多用户协作场景，启用 RLS 但允许所有认证用户访问所有记录
-- 如需按用户隔离，可添加 user_id 列并使用 auth.uid() 过滤
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- 所有认证用户可读
CREATE POLICY "Allow all read" ON positions FOR SELECT USING (true);
CREATE POLICY "Allow all read" ON companies FOR SELECT USING (true);
CREATE POLICY "Allow all read" ON candidates FOR SELECT USING (true);
CREATE POLICY "Allow all read" ON feedbacks FOR SELECT USING (true);

-- 所有认证用户可写
CREATE POLICY "Allow all insert" ON positions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all insert" ON companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all insert" ON candidates FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all insert" ON feedbacks FOR INSERT WITH CHECK (true);

-- 所有认证用户可更新
CREATE POLICY "Allow all update" ON positions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all update" ON companies FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all update" ON candidates FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all update" ON feedbacks FOR UPDATE USING (true) WITH CHECK (true);

-- 所有认证用户可删除
CREATE POLICY "Allow all delete" ON positions FOR DELETE USING (true);
CREATE POLICY "Allow all delete" ON companies FOR DELETE USING (true);
CREATE POLICY "Allow all delete" ON candidates FOR DELETE USING (true);
CREATE POLICY "Allow all delete" ON feedbacks FOR DELETE USING (true);

-- -----------------------------------------------------------
-- 授予 anon 和 authenticated 角色表级权限（RLS 生效的必要前提）
-- -----------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
