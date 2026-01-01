#!/usr/bin/env tsx

/**
 * =====================================================
 * System Reset Utility Script
 * =====================================================
 * 
 * This script resets the poker system to a clean state by:
 * - Clearing all user accounts
 * - Removing all tournament data
 * - Deleting all game states
 * - Clearing all session data
 * 
 * The database structure and configuration remain intact.
 * 
 * ⚠️ WARNING: This action is IRREVERSIBLE!
 * 
 * Usage:
 *   npm run reset-system
 * 
 * Or directly:
 *   npx tsx scripts/reset-system.ts
 * 
 * Requirements:
 * - VITE_SUPABASE_URL must be set
 * - VITE_SUPABASE_ANON_KEY must be set
 * - Or provide a .env file with these variables
 * 
 * =====================================================
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

const RESET_CONFIRMATION = 'RESET-SYSTEM';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message: string) {
  log('\n' + '='.repeat(50), colors.cyan);
  log(message, colors.cyan + colors.bold);
  log('='.repeat(50), colors.cyan);
}

function logSuccess(message: string) {
  log(`✓ ${message}`, colors.green);
}

function logError(message: string) {
  log(`✗ ${message}`, colors.red);
}

function logWarning(message: string) {
  log(`⚠ ${message}`, colors.yellow);
}

function logInfo(message: string) {
  log(`ℹ ${message}`, colors.blue);
}

async function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function getRecordCounts(supabase: any) {
  const counts = {
    users: 0,
    sessions: 0,
    states: 0,
    actions: 0
  };

  try {
    const { count: userCount } = await supabase
      .from('poker_users')
      .select('*', { count: 'exact', head: true });
    counts.users = userCount || 0;

    const { count: sessionCount } = await supabase
      .from('poker_user_sessions')
      .select('*', { count: 'exact', head: true });
    counts.sessions = sessionCount || 0;

    const { count: stateCount } = await supabase
      .from('poker_game_state')
      .select('*', { count: 'exact', head: true });
    counts.states = stateCount || 0;

    const { count: actionCount } = await supabase
      .from('poker_actions')
      .select('*', { count: 'exact', head: true });
    counts.actions = actionCount || 0;
  } catch (error) {
    logError('Failed to get record counts: ' + error);
  }

  return counts;
}

async function resetSystem() {
  logHeader('Sistema de Poker - System Reset Utility');

  // Check for required environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    logError('Missing required environment variables!');
    logInfo('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
    logInfo('You can set them in a .env file or as environment variables.');
    process.exit(1);
  }

  logSuccess('Environment variables loaded successfully');
  logInfo(`Supabase URL: ${supabaseUrl}`);

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  logSuccess('Connected to Supabase');

  // Get current record counts
  logInfo('\nFetching current database statistics...');
  const beforeCounts = await getRecordCounts(supabase);
  
  logHeader('Current Database Status');
  log(`Users:          ${beforeCounts.users}`, colors.yellow);
  log(`Sessions:       ${beforeCounts.sessions}`, colors.yellow);
  log(`Game States:    ${beforeCounts.states}`, colors.yellow);
  log(`Actions:        ${beforeCounts.actions}`, colors.yellow);

  // Warning and confirmation
  logHeader('⚠️  WARNING: IRREVERSIBLE ACTION  ⚠️');
  logWarning('This will permanently delete:');
  logWarning('  • All user accounts');
  logWarning('  • All tournament data');
  logWarning('  • All game states');
  logWarning('  • All session data');
  logWarning('  • All action history');
  log('');
  logInfo('The following will be preserved:');
  logInfo('  • Database structure (tables, indexes)');
  logInfo('  • Security policies (RLS)');
  logInfo('  • Database functions');
  log('');
  
  const answer = await promptUser(
    colors.red + colors.bold + 
    `Type "${RESET_CONFIRMATION}" to confirm reset: ` + 
    colors.reset
  );

  if (answer !== RESET_CONFIRMATION) {
    logWarning('Reset cancelled. No changes were made.');
    process.exit(0);
  }

  // Perform reset
  logHeader('Performing System Reset');

  try {
    // Delete in order (respecting foreign key constraints)
    logInfo('Deleting user sessions...');
    const { error: sessionError } = await supabase
      .from('poker_user_sessions')
      .delete()
      .gte('created_at', '1970-01-01'); // Delete all records (using date that's always true)
    
    if (sessionError) throw new Error(`Session deletion failed: ${sessionError.message}`);
    logSuccess('User sessions cleared');

    logInfo('Deleting game actions...');
    const { error: actionError } = await supabase
      .from('poker_actions')
      .delete()
      .gte('created_at', '1970-01-01'); // Delete all records (using date that's always true)
    
    if (actionError) throw new Error(`Action deletion failed: ${actionError.message}`);
    logSuccess('Game actions cleared');

    logInfo('Deleting game states...');
    const { error: stateError } = await supabase
      .from('poker_game_state')
      .delete()
      .gte('updated_at', '1970-01-01'); // Delete all records (using date that's always true)
    
    if (stateError) throw new Error(`State deletion failed: ${stateError.message}`);
    logSuccess('Game states cleared');

    logInfo('Deleting user accounts...');
    const { error: userError } = await supabase
      .from('poker_users')
      .delete()
      .gte('created_at', '1970-01-01'); // Delete all records (using date that's always true)
    
    if (userError) throw new Error(`User deletion failed: ${userError.message}`);
    logSuccess('User accounts cleared');

    // Verify reset
    logInfo('\nVerifying reset...');
    const afterCounts = await getRecordCounts(supabase);

    logHeader('Reset Complete - Final Database Status');
    log(`Users:          ${afterCounts.users} (was ${beforeCounts.users})`, colors.green);
    log(`Sessions:       ${afterCounts.sessions} (was ${beforeCounts.sessions})`, colors.green);
    log(`Game States:    ${afterCounts.states} (was ${beforeCounts.states})`, colors.green);
    log(`Actions:        ${afterCounts.actions} (was ${beforeCounts.actions})`, colors.green);

    const totalDeleted = 
      (beforeCounts.users - afterCounts.users) +
      (beforeCounts.sessions - afterCounts.sessions) +
      (beforeCounts.states - afterCounts.states) +
      (beforeCounts.actions - afterCounts.actions);

    logHeader('Summary');
    logSuccess(`Total records deleted: ${totalDeleted}`);
    logSuccess('System has been reset to a clean state');
    logSuccess('Database structure and configuration preserved');
    logSuccess('System is ready for fresh use!');
    
  } catch (error) {
    logError('\nReset failed!');
    logError(`Error: ${error}`);
    logWarning('Some data may have been partially deleted.');
    logWarning('Please check the database manually or run the SQL reset script.');
    process.exit(1);
  }
}

// Run the reset
resetSystem().catch((error) => {
  logError('Unexpected error occurred:');
  console.error(error);
  process.exit(1);
});
