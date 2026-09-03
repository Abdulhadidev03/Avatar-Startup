-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- 1. Agents table — the "saved configurations" for each avatar persona
CREATE TABLE IF NOT EXISTS agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Sales concierge',
  website TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Draft',
  avatar_id TEXT NOT NULL DEFAULT 'aria',
  anam_avatar_id TEXT,
  anam_voice_id TEXT,
  greeting TEXT NOT NULL DEFAULT 'Hi! I''m here if you''d like help finding the right option.',
  tone TEXT NOT NULL DEFAULT 'Warm and professional',
  response_length TEXT NOT NULL DEFAULT 'Balanced',
  instructions TEXT,
  language TEXT NOT NULL DEFAULT 'English',
  purpose TEXT NOT NULL DEFAULT 'sales',
  profile_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Custom avatar image URL (uploaded to Supabase Storage)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS avatar_image_url TEXT;

-- 3. Link sessions to agents
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agents(id);

-- 4. Knowledge sources per agent
CREATE TABLE IF NOT EXISTS knowledge_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT '',
  file_url TEXT,
  content_text TEXT,
  item_count TEXT NOT NULL DEFAULT '0 items',
  status TEXT NOT NULL DEFAULT 'Processing',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on knowledge_sources" ON knowledge_sources FOR ALL USING (true) WITH CHECK (true);

-- 5. Agent action toggles (persisted enable/disable per action per agent)
CREATE TABLE IF NOT EXISTS agent_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  action_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (agent_id, action_key)
);

ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on agent_actions" ON agent_actions FOR ALL USING (true) WITH CHECK (true);

-- 6. RLS policies so the browser client (anon key) can read/write agents
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on agents" ON agents FOR ALL USING (true) WITH CHECK (true);
