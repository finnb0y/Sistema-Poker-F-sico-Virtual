-- =====================================================
-- Quick Fix Migration: Code Sync Function
-- Execute this in Supabase SQL Editor to fix code synchronization
-- =====================================================
-- This migration adds a database function to find users by access codes
-- Fixes: Tournament codes not found across devices
-- Date: January 2026
-- =====================================================
-- NOTE: This is a standalone version of the function also included in
-- supabase-auth-migration.sql. You can run this file independently if
-- you've already run the base migrations and just need to add this fix.
-- If you're setting up from scratch, run supabase-auth-migration.sql
-- instead (it includes this function).
-- =====================================================

-- Function to find user by access code (player or dealer)
-- Uses SECURITY DEFINER to bypass RLS and search across all users
CREATE OR REPLACE FUNCTION find_user_by_access_code(access_code TEXT)
RETURNS UUID AS $$
DECLARE
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

-- =====================================================
-- Verification
-- =====================================================
-- Run this to confirm the function was created:
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_name = 'find_user_by_access_code';
--
-- Expected output:
-- routine_name              | routine_type
-- --------------------------+-------------
-- find_user_by_access_code  | FUNCTION
-- =====================================================
