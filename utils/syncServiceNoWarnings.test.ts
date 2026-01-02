/**
 * Sync Service Warning Tests
 * 
 * Tests to verify that sync service no longer produces console warnings
 * when running in local mode or before authentication:
 * 1. sendMessage doesn't log warnings when userId is not set
 * 2. subscribe doesn't log warnings when userId is not set  
 * 3. persistState doesn't log warnings when userId is not set
 * 4. loadState doesn't log warnings when userId is not set
 * 5. All methods gracefully handle missing userId by throwing/returning without warnings
 * 
 * Run with: npx tsx utils/syncServiceNoWarnings.test.ts
 */

// Mock import.meta.env for Node.js testing environment
if (typeof globalThis !== 'undefined') {
  const g = globalThis as any;
  if (typeof g.import === 'undefined') {
    g.import = {};
  }
  if (typeof g.import.meta === 'undefined') {
    g.import.meta = {};
  }
  if (typeof g.import.meta.env === 'undefined') {
    g.import.meta.env = {};
  }
}

import { syncService } from '../services/syncService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

// Capture console output
let consoleWarnings: string[] = [];
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  consoleWarnings.push(args.join(' '));
  originalWarn.apply(console, args);
};

async function testSendMessageNoWarnings() {
  console.log('\n--- Test 1: sendMessage without userId should not log warnings ---');
  
  consoleWarnings = [];
  
  try {
    await syncService.sendMessage({
      type: 'BET',
      payload: { amount: 100 },
      senderId: 'test-player'
    });
  } catch (error) {
    // Expected to throw, that's fine
  }
  
  assert(consoleWarnings.length === 0, 
    'sendMessage should not log warnings when userId is not set');
}

async function testSubscribeNoWarnings() {
  console.log('\n--- Test 2: subscribe without userId should not log warnings ---');
  
  consoleWarnings = [];
  
  const unsubscribe = syncService.subscribe(() => {});
  unsubscribe();
  
  assert(consoleWarnings.length === 0, 
    'subscribe should not log warnings when userId is not set');
}

async function testPersistStateNoWarnings() {
  console.log('\n--- Test 3: persistState without userId should not log warnings ---');
  
  consoleWarnings = [];
  
  await syncService.persistState({
    roomTables: [],
    tournaments: [],
    tableStates: [],
    players: [],
    registry: [],
    smallBlind: 50,
    bigBlind: 100,
    activeTournamentId: null,
    clubs: [],
    activeClubId: null
  });
  
  assert(consoleWarnings.length === 0, 
    'persistState should not log warnings when userId is not set');
}

async function testLoadStateNoWarnings() {
  console.log('\n--- Test 4: loadState without userId should not log warnings ---');
  
  consoleWarnings = [];
  
  const result = await syncService.loadState();
  
  assert(consoleWarnings.length === 0, 
    'loadState should not log warnings when userId is not set');
  assert(result === null, 
    'loadState should return null when userId is not set');
}

async function testGracefulFallback() {
  console.log('\n--- Test 5: All methods gracefully handle missing userId ---');
  
  // Test sendMessage throws error (caught by dispatcher)
  let sendMessageThrew = false;
  try {
    await syncService.sendMessage({
      type: 'BET',
      payload: { amount: 100 },
      senderId: 'test'
    });
  } catch (error) {
    sendMessageThrew = true;
  }
  assert(sendMessageThrew, 
    'sendMessage should throw error when userId not set (for dispatcher to catch)');
  
  // Test subscribe returns no-op cleanup
  const cleanup = syncService.subscribe(() => {});
  assert(typeof cleanup === 'function', 
    'subscribe should return cleanup function even without userId');
  
  // Test persistState returns without error
  let persistStateFailed = false;
  try {
    await syncService.persistState({
      roomTables: [],
      tournaments: [],
      tableStates: [],
      players: [],
      registry: [],
      smallBlind: 50,
      bigBlind: 100,
      activeTournamentId: null,
      clubs: [],
      activeClubId: null
    });
  } catch (error) {
    persistStateFailed = true;
  }
  assert(!persistStateFailed, 
    'persistState should not throw error when userId not set');
  
  // Test loadState returns null
  const state = await syncService.loadState();
  assert(state === null, 
    'loadState should return null when userId not set');
  
  console.log('✅ All methods handle missing userId gracefully');
}

async function testWithUserIdSet() {
  console.log('\n--- Test 6: Methods work correctly with userId set ---');
  
  // Set a guest userId
  syncService.setGuestUserId('test-user-123');
  
  consoleWarnings = [];
  
  // These will still fail (no Supabase), but shouldn't log the "enter access code" warnings
  try {
    await syncService.sendMessage({
      type: 'BET',
      payload: { amount: 100 },
      senderId: 'test'
    });
  } catch (error) {
    // Expected to fail (no Supabase)
  }
  
  // Check that we didn't get "enter access code" warnings
  const hasCodeWarning = consoleWarnings.some(w => 
    w.includes('código de acesso') || w.includes('access code')
  );
  
  assert(!hasCodeWarning, 
    'Should not show "enter access code" warning when userId is set');
  
  // Clean up
  syncService.setGuestUserId(null);
}

// Run all tests
async function runTests() {
  console.log('=== Running Sync Service Warning Tests ===\n');
  console.log('⚠️  Note: These tests verify that sync service does not log misleading warnings');
  console.log('    The system should fail gracefully without confusing console messages\n');
  
  try {
    await testSendMessageNoWarnings();
    await testSubscribeNoWarnings();
    await testPersistStateNoWarnings();
    await testLoadStateNoWarnings();
    await testGracefulFallback();
    await testWithUserIdSet();
    
    console.log('\n✅ All sync service warning tests passed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ sendMessage does not log warnings without userId');
    console.log('   ✅ subscribe does not log warnings without userId');
    console.log('   ✅ persistState does not log warnings without userId');
    console.log('   ✅ loadState does not log warnings without userId');
    console.log('   ✅ All methods handle missing userId gracefully');
    console.log('   ✅ No misleading "enter access code" warnings when userId is set');
    console.log('\n🎯 Key Improvements:');
    console.log('   ✅ Removed confusing console warnings');
    console.log('   ✅ System falls back to local mode without alarming users');
    console.log('   ✅ Error handling is consistent and predictable');
    console.log('   ✅ Users only see warnings for actual problems\n');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  } finally {
    // Restore original console.warn
    console.warn = originalWarn;
  }
}

runTests();
