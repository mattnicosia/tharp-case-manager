-- Tharp Case Manager — Supabase Schema
-- Run this in your Supabase project's SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- Key-value store for all app data (reqs, claims, documents, etc.)
CREATE TABLE IF NOT EXISTS app_data (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-update the timestamp on changes
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER app_data_updated
  BEFORE UPDATE ON app_data
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Row Level Security: allow all operations with anon key
-- (The URL itself provides access control — only people with the link can use it)
ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON app_data
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant access to the anon role
GRANT ALL ON app_data TO anon;
GRANT ALL ON app_data TO authenticated;
