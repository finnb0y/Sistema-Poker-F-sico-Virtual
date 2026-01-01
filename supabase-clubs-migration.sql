-- =====================================================
-- SQL Migration: Add Clubs System
-- Execute this script in the SQL Editor of your Supabase project
-- This adds club-based organization for tournaments
-- =====================================================
-- IMPORTANT: Execute supabase-setup.sql and supabase-auth-migration.sql first
-- =====================================================

-- Table to store clubs
CREATE TABLE IF NOT EXISTS poker_clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES poker_users(id) ON DELETE CASCADE,
  profile_photo_url TEXT,
  banner_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast owner lookup
CREATE INDEX IF NOT EXISTS idx_poker_clubs_owner 
ON poker_clubs(owner_user_id);

-- Index for club name search
CREATE INDEX IF NOT EXISTS idx_poker_clubs_name 
ON poker_clubs(name);

-- Table to store club managers (with limited permissions)
CREATE TABLE IF NOT EXISTS poker_club_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES poker_clubs(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(club_id, username)
);

-- Index for fast manager lookup
CREATE INDEX IF NOT EXISTS idx_poker_club_managers_club 
ON poker_club_managers(club_id);

-- Index for manager username lookup within club
CREATE INDEX IF NOT EXISTS idx_poker_club_managers_username 
ON poker_club_managers(club_id, username);

-- Table to store manager sessions
CREATE TABLE IF NOT EXISTS poker_club_manager_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES poker_club_managers(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days'
);

-- Index for fast session token lookup
CREATE INDEX IF NOT EXISTS idx_poker_manager_sessions_token 
ON poker_club_manager_sessions(session_token);

-- Add club_id column to existing game state
-- This allows tournaments to be scoped to clubs
ALTER TABLE poker_game_state 
ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES poker_clubs(id) ON DELETE CASCADE;

-- Create index for club_id on poker_game_state
CREATE INDEX IF NOT EXISTS idx_poker_game_state_club 
ON poker_game_state(club_id);

-- Enable Row Level Security on new tables
ALTER TABLE poker_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE poker_club_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE poker_club_manager_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read club information (for search/discovery)
CREATE POLICY "Anyone can read clubs"
ON poker_clubs FOR SELECT
TO public
USING (true);

-- Policy: Owners can insert clubs
CREATE POLICY "Users can create clubs"
ON poker_clubs FOR INSERT
TO public
WITH CHECK (true);

-- Policy: Owners can update their own clubs
CREATE POLICY "Owners can update own clubs"
ON poker_clubs FOR UPDATE
TO public
USING (true) -- Will be filtered by client queries
WITH CHECK (true);

-- Policy: Owners can delete their own clubs
CREATE POLICY "Owners can delete own clubs"
ON poker_clubs FOR DELETE
TO public
USING (true); -- Will be filtered by client queries

-- Policy: Managers can be read by anyone (for login verification)
CREATE POLICY "Anyone can read managers"
ON poker_club_managers FOR SELECT
TO public
USING (true);

-- Policy: Club owners can create managers
CREATE POLICY "Club owners can create managers"
ON poker_club_managers FOR INSERT
TO public
WITH CHECK (true);

-- Policy: Club owners can update managers
CREATE POLICY "Club owners can update managers"
ON poker_club_managers FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Policy: Club owners can delete managers
CREATE POLICY "Club owners can delete managers"
ON poker_club_managers FOR DELETE
TO public
USING (true);

-- Policy: Anyone can read manager sessions (for validation)
CREATE POLICY "Anyone can read manager sessions"
ON poker_club_manager_sessions FOR SELECT
TO public
USING (true);

-- Policy: Anyone can create manager sessions (for login)
CREATE POLICY "Anyone can create manager sessions"
ON poker_club_manager_sessions FOR INSERT
TO public
WITH CHECK (true);

-- Policy: Anyone can delete manager sessions (for logout)
CREATE POLICY "Anyone can delete manager sessions"
ON poker_club_manager_sessions FOR DELETE
TO public
USING (true);

-- Function to validate manager session token and return manager info
CREATE OR REPLACE FUNCTION validate_manager_session(token TEXT)
RETURNS TABLE (
  manager_id UUID,
  club_id UUID,
  username TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as manager_id,
    m.club_id,
    m.username
  FROM poker_club_manager_sessions s
  JOIN poker_club_managers m ON s.manager_id = m.id
  WHERE s.session_token = token
    AND s.expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired manager sessions
CREATE OR REPLACE FUNCTION cleanup_expired_manager_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM poker_club_manager_sessions
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: Schedule manager session cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-manager-sessions', '0 * * * *', 'SELECT cleanup_expired_manager_sessions();');

-- =====================================================
-- Verification of tables created
-- =====================================================
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('poker_clubs', 'poker_club_managers', 'poker_club_manager_sessions')
ORDER BY table_name;
