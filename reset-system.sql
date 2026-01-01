-- =====================================================
-- SQL Script: Reset System to Clean State
-- =====================================================
-- This script clears all user data, tournaments, and game state
-- while preserving the database structure and configurations.
-- 
-- ⚠️ WARNING: This action is IRREVERSIBLE!
-- All user accounts, tournaments, game states, and sessions will be permanently deleted.
-- 
-- Usage:
-- 1. Go to your Supabase project's SQL Editor
-- 2. Copy and paste this entire script
-- 3. Review the warning above
-- 4. Execute the script
-- 
-- What this script does:
-- ✓ Deletes all user sessions (logs out all users)
-- ✓ Deletes all game actions (clears action history)
-- ✓ Deletes all game states (clears tournament data)
-- ✓ Deletes all user accounts (removes all registered users)
-- ✓ Resets auto-increment sequences
-- ✗ PRESERVES table structure and indexes
-- ✗ PRESERVES Row Level Security policies
-- ✗ PRESERVES database functions
-- =====================================================

BEGIN;

-- Step 1: Clear all user sessions (CASCADE will handle this, but explicit for clarity)
DELETE FROM poker_user_sessions;
RAISE NOTICE 'Cleared all user sessions';

-- Step 2: Clear all game actions
DELETE FROM poker_actions;
RAISE NOTICE 'Cleared all game actions';

-- Step 3: Clear all game states
DELETE FROM poker_game_state;
RAISE NOTICE 'Cleared all game states';

-- Step 4: Clear all users (this will CASCADE delete related data due to foreign keys)
DELETE FROM poker_users;
RAISE NOTICE 'Cleared all user accounts';

-- Step 5: Reset sequences if any exist (for auto-increment columns)
-- Note: poker_actions uses BIGSERIAL, so we reset its sequence
SELECT setval(pg_get_serial_sequence('poker_actions', 'id'), 1, false);
RAISE NOTICE 'Reset auto-increment sequences';

-- Verify cleanup
DO $$
DECLARE
    user_count INTEGER;
    session_count INTEGER;
    state_count INTEGER;
    action_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM poker_users;
    SELECT COUNT(*) INTO session_count FROM poker_user_sessions;
    SELECT COUNT(*) INTO state_count FROM poker_game_state;
    SELECT COUNT(*) INTO action_count FROM poker_actions;
    
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'RESET COMPLETE - System is now clean';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Users: % (should be 0)', user_count;
    RAISE NOTICE 'Sessions: % (should be 0)', session_count;
    RAISE NOTICE 'Game States: % (should be 0)', state_count;
    RAISE NOTICE 'Actions: % (should be 0)', action_count;
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Database structure: PRESERVED';
    RAISE NOTICE 'Security policies: PRESERVED';
    RAISE NOTICE 'System is ready for fresh use!';
    RAISE NOTICE '===========================================';
END $$;

COMMIT;

-- =====================================================
-- Post-Reset Verification Query
-- =====================================================
-- Run this separately to verify the reset was successful:
/*
SELECT 
    'poker_users' as table_name, 
    COUNT(*) as record_count 
FROM poker_users
UNION ALL
SELECT 
    'poker_user_sessions' as table_name, 
    COUNT(*) as record_count 
FROM poker_user_sessions
UNION ALL
SELECT 
    'poker_game_state' as table_name, 
    COUNT(*) as record_count 
FROM poker_game_state
UNION ALL
SELECT 
    'poker_actions' as table_name, 
    COUNT(*) as record_count 
FROM poker_actions;
*/
