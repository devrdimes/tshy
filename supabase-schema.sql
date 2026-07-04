-- ============================================================
-- Tashyeed — Supabase PostgreSQL Schema
-- ============================================================
-- Execute this in the Supabase SQL Editor
-- Project: https://mpdqzcllhxxxbigcpmtf.supabase.co
-- ============================================================

-- ── Enable UUID extension ────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users Table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL DEFAULT 'Entrepreneur',
  email             TEXT UNIQUE NOT NULL,
  password          TEXT NOT NULL DEFAULT '',
  avatar            TEXT NOT NULL DEFAULT '',
  company           TEXT NOT NULL DEFAULT '',
  role              TEXT NOT NULL DEFAULT 'CEO',
  onboarded         BOOLEAN NOT NULL DEFAULT false,
  email_verified    BOOLEAN NOT NULL DEFAULT false,
  reset_token       TEXT NOT NULL DEFAULT '',
  reset_token_expiry TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Sessions Table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Businesses Table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS businesses (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL DEFAULT '',
  description       TEXT NOT NULL DEFAULT '',
  industry          TEXT NOT NULL DEFAULT '',
  stage             TEXT NOT NULL DEFAULT 'idea',
  target_market     TEXT NOT NULL DEFAULT '',
  revenue_model     TEXT NOT NULL DEFAULT '',
  initial_capital   DOUBLE PRECISION NOT NULL DEFAULT 0,
  monthly_burn_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  current_step      INTEGER NOT NULL DEFAULT 1,
  total_steps       INTEGER NOT NULL DEFAULT 10,
  completed         BOOLEAN NOT NULL DEFAULT false,
  logo_url          TEXT NOT NULL DEFAULT '',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Plan Steps Table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plan_steps (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  step_number     INTEGER NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  category        TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'locked',
  guidance        TEXT NOT NULL DEFAULT '',
  tips            TEXT NOT NULL DEFAULT '',
  checklist       TEXT NOT NULL DEFAULT '[]',
  resources       TEXT NOT NULL DEFAULT '[]',
  estimated_days  INTEGER NOT NULL DEFAULT 7,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Tasks Table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id      UUID REFERENCES businesses(id) ON DELETE SET NULL,
  plan_step_id     UUID REFERENCES plan_steps(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  priority         TEXT NOT NULL DEFAULT 'medium',
  status           TEXT NOT NULL DEFAULT 'pending',
  due_date         TIMESTAMPTZ,
  reminder_at      TIMESTAMPTZ,
  system_generated BOOLEAN NOT NULL DEFAULT false,
  suggestion       TEXT NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Notifications Table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL DEFAULT 'info',
  title        TEXT NOT NULL,
  message      TEXT NOT NULL,
  action_url   TEXT NOT NULL DEFAULT '',
  read         BOOLEAN NOT NULL DEFAULT false,
  dismissed    BOOLEAN NOT NULL DEFAULT false,
  scheduled_at TIMESTAMPTZ,
  sent_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Milestones Table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS milestones (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  target_date   TIMESTAMPTZ,
  achieved_date TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'upcoming',
  category      TEXT NOT NULL DEFAULT '',
  metric        TEXT NOT NULL DEFAULT '',
  target_value  DOUBLE PRECISION NOT NULL DEFAULT 0,
  current_value DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Financials Table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS financials (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  period      TEXT NOT NULL,
  revenue     DOUBLE PRECISION NOT NULL DEFAULT 0,
  expenses    DOUBLE PRECISION NOT NULL DEFAULT 0,
  profit      DOUBLE PRECISION NOT NULL DEFAULT 0,
  customers   INTEGER NOT NULL DEFAULT 0,
  burn_rate   DOUBLE PRECISION NOT NULL DEFAULT 0,
  runway      DOUBLE PRECISION NOT NULL DEFAULT 0,
  projection  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Chat Messages Table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL,
  content    TEXT NOT NULL,
  context    TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Sessions
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- Businesses
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON businesses(created_at DESC);

-- Plan Steps
CREATE INDEX IF NOT EXISTS idx_plan_steps_business_id ON plan_steps(business_id);
CREATE INDEX IF NOT EXISTS idx_plan_steps_step_number ON plan_steps(business_id, step_number ASC);

-- Tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_business_id ON tasks(business_id);
CREATE INDEX IF NOT EXISTS idx_tasks_plan_step_id ON tasks(plan_step_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Milestones
CREATE INDEX IF NOT EXISTS idx_milestones_business_id ON milestones(business_id);

-- Financials
CREATE INDEX IF NOT EXISTS idx_financials_business_id ON financials(business_id);

-- Chat Messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at ASC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- ── Service Role Full Access (for backend API routes using service_role key) ──

-- We use the service_role key in our backend, so RLS is bypassed.
-- These policies are for the anon key (frontend direct access) — we restrict to own data only.

-- ── Users: users can only read/update their own row ──────────
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- ── Sessions: users can only see their own sessions ───────────
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON sessions
  FOR DELETE USING (auth.uid() = user_id);

-- ── Businesses: users can only CRUD their own businesses ─────
CREATE POLICY "Users can view own businesses" ON businesses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own businesses" ON businesses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own businesses" ON businesses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own businesses" ON businesses
  FOR DELETE USING (auth.uid() = user_id);

-- ── Plan Steps: access through business ownership ────────────
CREATE POLICY "Users can view own plan steps" ON plan_steps
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create own plan steps" ON plan_steps
  FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own plan steps" ON plan_steps
  FOR UPDATE USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own plan steps" ON plan_steps
  FOR DELETE USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- ── Tasks: users can only CRUD their own tasks ───────────────
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- ── Notifications: users can only CRUD their own ─────────────
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- ── Milestones: access through business ownership ────────────
CREATE POLICY "Users can view own milestones" ON milestones
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create own milestones" ON milestones
  FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own milestones" ON milestones
  FOR UPDATE USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own milestones" ON milestones
  FOR DELETE USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- ── Financials: access through business ownership ────────────
CREATE POLICY "Users can view own financials" ON financials
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create own financials" ON financials
  FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own financials" ON financials
  FOR UPDATE USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own financials" ON financials
  FOR DELETE USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- ── Chat Messages: users can only CRUD their own ─────────────
CREATE POLICY "Users can view own chat messages" ON chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages" ON chat_messages
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- UPDATED_AT TRIGGER (auto-update updated_at on row change)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_businesses_updated_at
  BEFORE UPDATE ON businesses FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_plan_steps_updated_at
  BEFORE UPDATE ON plan_steps FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON tasks FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_milestones_updated_at
  BEFORE UPDATE ON milestones FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_financials_updated_at
  BEFORE UPDATE ON financials FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- CLEANUP: Delete expired sessions periodically
-- ============================================================

CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;
