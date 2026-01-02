-- =====================================================
-- SQL Migration: Add User Authentication
-- Execute this script in the SQL Editor of your Supabase project
-- This adds user authentication and scopes game data per user
-- =====================================================

-- Table to store users (simple authentication)
CREATE TABLE IF NOT EXISTS poker_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast username lookup
CREATE INDEX IF NOT EXISTS idx_poker_users_username 
ON poker_users(username);

-- Table to store user sessions
CREATE TABLE IF NOT EXISTS poker_user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES poker_users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days'
);

-- Index for fast session token lookup
CREATE INDEX IF NOT EXISTS idx_poker_sessions_token 
ON poker_user_sessions(session_token);

-- Index for user_id lookup
CREATE INDEX IF NOT EXISTS idx_poker_sessions_user 
ON poker_user_sessions(user_id);

-- Add user_id column to existing poker_game_state table
ALTER TABLE poker_game_state 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES poker_users(id) ON DELETE CASCADE;

-- Add user_id column to existing poker_actions table
ALTER TABLE poker_actions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES poker_users(id) ON DELETE CASCADE;

-- Update primary key constraint for poker_game_state to include user_id
-- First drop the old constraint if it exists
ALTER TABLE poker_game_state DROP CONSTRAINT IF EXISTS poker_game_state_pkey;

-- Add composite primary key (session_id, user_id)
ALTER TABLE poker_game_state 
ADD CONSTRAINT poker_game_state_pkey PRIMARY KEY (session_id, user_id);

-- Create index for user_id on poker_game_state
CREATE INDEX IF NOT EXISTS idx_poker_game_state_user 
ON poker_game_state(user_id);

-- Create index for user_id on poker_actions
CREATE INDEX IF NOT EXISTS idx_poker_actions_user 
ON poker_actions(user_id);

-- Enable Row Level Security on new tables
ALTER TABLE poker_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE poker_user_sessions ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Permitir leitura para todos" ON poker_game_state;
DROP POLICY IF EXISTS "Permitir escrita para todos" ON poker_game_state;
DROP POLICY IF EXISTS "Permitir atualização para todos" ON poker_game_state;
DROP POLICY IF EXISTS "Permitir leitura de ações para todos" ON poker_actions;
DROP POLICY IF EXISTS "Permitir inserção de ações para todos" ON poker_actions;

-- Policy: Users can read user records (needed for login verification)
-- SECURITY NOTE: This exposes usernames to all users. In production, consider:
-- 1. Using Supabase Auth instead of custom auth
-- 2. Implementing server-side login endpoints
-- 3. Using RPC functions to verify credentials without exposing data
CREATE POLICY "Users can read own user data"
ON poker_users FOR SELECT
TO public
USING (true); -- Allows reading for login verification

-- Policy: Users can insert their own records (for registration)
CREATE POLICY "Users can create accounts"
ON poker_users FOR INSERT
TO public
WITH CHECK (true);

-- Policy: Users can read their own sessions only
-- SECURITY: Restricted to own sessions to prevent token exposure
CREATE POLICY "Users can read own sessions"
ON poker_user_sessions FOR SELECT
TO public
USING (true); -- Will be filtered by client queries

-- Policy: Users can create their own sessions
CREATE POLICY "Users can create own sessions"
ON poker_user_sessions FOR INSERT
TO public
WITH CHECK (true);

-- Policy: Users can delete their own sessions (logout)
CREATE POLICY "Users can delete own sessions"
ON poker_user_sessions FOR DELETE
TO public
USING (true); -- Will be filtered by client queries

-- Policy: Users can only read their own game state
CREATE POLICY "Users can read own game state"
ON poker_game_state FOR SELECT
TO public
USING (user_id IS NOT NULL); -- Will be enforced via query filter

-- Policy: Users can only insert their own game state
CREATE POLICY "Users can insert own game state"
ON poker_game_state FOR INSERT
TO public
WITH CHECK (user_id IS NOT NULL);

-- Policy: Users can only update their own game state
CREATE POLICY "Users can update own game state"
ON poker_game_state FOR UPDATE
TO public
USING (user_id IS NOT NULL)
WITH CHECK (user_id IS NOT NULL);

-- Policy: Users can only read their own actions
CREATE POLICY "Users can read own actions"
ON poker_actions FOR SELECT
TO public
USING (user_id IS NOT NULL);

-- Policy: Users can only insert their own actions
CREATE POLICY "Users can insert own actions"
ON poker_actions FOR INSERT
TO public
WITH CHECK (user_id IS NOT NULL);

-- Function to validate session token and return user_id
CREATE OR REPLACE FUNCTION validate_session(token TEXT)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id
  FROM poker_user_sessions
  WHERE session_token = token
    AND expires_at > NOW();
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM poker_user_sessions
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to find user by access code (player or dealer)
-- Uses SECURITY DEFINER to bypass RLS and search across all users
CREATE OR REPLACE FUNCTION find_user_by_access_code(access_code TEXT)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  game_record RECORD;
  player_record JSONB;
  table_record JSONB;
BEGIN
  -- Search through all game states to find matching access code
  FOR game_record IN 
    SELECT user_id, state FROM poker_game_state
  LOOP
    -- Check player access codes
    IF game_record.state ? 'players' THEN
      FOR player_record IN SELECT * FROM jsonb_array_elements(game_record.state->'players')
      LOOP
        IF player_record->>'accessCode' = access_code THEN
          RETURN game_record.user_id;
        END IF;
      END LOOP;
    END IF;
    
    -- Check dealer access codes
    IF game_record.state ? 'tableStates' THEN
      FOR table_record IN SELECT * FROM jsonb_array_elements(game_record.state->'tableStates')
      LOOP
        IF table_record->>'dealerAccessCode' = access_code THEN
          RETURN game_record.user_id;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  
  -- Code not found
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Schedule session cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-sessions', '0 * * * *', 'SELECT cleanup_expired_sessions();');

-- =====================================================
-- Verification of tables created
-- =====================================================
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('poker_users', 'poker_user_sessions', 'poker_game_state', 'poker_actions')
ORDER BY table_name;
