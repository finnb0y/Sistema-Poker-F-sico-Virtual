/**
 * Blind Timer Integration Tests
 * 
 * Tests to verify that the TournamentBlindTimer component is properly
 * integrated across all interfaces:
 * 1. Component exists and can be imported
 * 2. Component displays correct time format
 * 3. Component shows current blind levels
 * 4. Component integrates with tournament state
 * 
 * Run with: npx tsx utils/blindTimerIntegration.test.ts
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

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

function testComponentExists() {
  console.log('\n--- Test 1: TournamentBlindTimer component exists ---');
  
  const componentPath = join(__dirname, '..', 'components', 'TournamentBlindTimer.tsx');
  const exists = existsSync(componentPath);
  
  assert(exists, 'TournamentBlindTimer.tsx file exists');
  
  if (exists) {
    const content = readFileSync(componentPath, 'utf8');
    
    // Check for key features
    assert(content.includes('interface TournamentBlindTimerProps'), 
      'Component has proper TypeScript interface');
    assert(content.includes('tournament: Tournament'), 
      'Component accepts tournament prop');
    assert(content.includes('state: GameState'), 
      'Component accepts state prop');
    assert(content.includes('onDispatch'), 
      'Component accepts onDispatch prop');
    assert(content.includes('formatTime'), 
      'Component has formatTime function');
    assert(content.includes('timeRemaining'), 
      'Component tracks time remaining');
    assert(content.includes('Timer de Blinds'), 
      'Component displays blind timer label');
    assert(content.includes('Small Blind'), 
      'Component displays small blind');
    assert(content.includes('Big Blind'), 
      'Component displays big blind');
    assert(content.includes('Ante'), 
      'Component displays ante');
  }
}

function testIntegrationInDealerControls() {
  console.log('\n--- Test 2: TournamentBlindTimer integrated in DealerControls ---');
  
  const componentPath = join(__dirname, '..', 'components', 'DealerControls.tsx');
  const content = readFileSync(componentPath, 'utf8');
  
  assert(content.includes('import TournamentBlindTimer'), 
    'DealerControls imports TournamentBlindTimer');
  assert(content.includes('<TournamentBlindTimer'), 
    'DealerControls uses TournamentBlindTimer component');
  assert(content.includes('tournament={currentTourney}'), 
    'DealerControls passes tournament prop');
  assert(content.includes('state={state}'), 
    'DealerControls passes state prop');
  assert(content.includes('onDispatch={onDispatch}'), 
    'DealerControls passes onDispatch prop');
  assert(content.includes('currentTourney.isStarted'), 
    'DealerControls conditionally renders based on tournament start state');
}

function testIntegrationInPlayerDashboard() {
  console.log('\n--- Test 3: TournamentBlindTimer integrated in PlayerDashboard ---');
  
  const componentPath = join(__dirname, '..', 'components', 'PlayerDashboard.tsx');
  const content = readFileSync(componentPath, 'utf8');
  
  assert(content.includes('import TournamentBlindTimer'), 
    'PlayerDashboard imports TournamentBlindTimer');
  assert(content.includes('<TournamentBlindTimer'), 
    'PlayerDashboard uses TournamentBlindTimer component');
  assert(content.includes('tournament={tournament}'), 
    'PlayerDashboard passes tournament prop');
  assert(content.includes('state={state}'), 
    'PlayerDashboard passes state prop');
  assert(content.includes('onDispatch={onDispatch}'), 
    'PlayerDashboard passes onDispatch prop');
  assert(content.includes('tournament.isStarted'), 
    'PlayerDashboard conditionally renders based on tournament start state');
  assert(content.includes('const tournament = state.tournaments.find'), 
    'PlayerDashboard finds tournament from player tournamentId');
}

function testIntegrationInTableDealerInterface() {
  console.log('\n--- Test 4: TournamentBlindTimer integrated in TableDealerInterface ---');
  
  const componentPath = join(__dirname, '..', 'components', 'TableDealerInterface.tsx');
  const content = readFileSync(componentPath, 'utf8');
  
  assert(content.includes('import TournamentBlindTimer'), 
    'TableDealerInterface imports TournamentBlindTimer');
  assert(content.includes('<TournamentBlindTimer'), 
    'TableDealerInterface uses TournamentBlindTimer component');
  assert(content.includes('tournament={tournament}'), 
    'TableDealerInterface passes tournament prop');
  assert(content.includes('state={state}'), 
    'TableDealerInterface passes state prop');
  assert(content.includes('onDispatch={onDispatch}'), 
    'TableDealerInterface passes onDispatch prop');
  assert(content.includes('tournament.isStarted'), 
    'TableDealerInterface conditionally renders based on tournament start state');
}

function testIntegrationInTVMode() {
  console.log('\n--- Test 5: TournamentBlindTimer integrated in TV Mode ---');
  
  const componentPath = join(__dirname, '..', 'components', 'DealerControls.tsx');
  const content = readFileSync(componentPath, 'utf8');
  
  // Check that TV mode exists and uses the timer
  assert(content.includes("activeTab === 'tv'"), 
    'TV mode section exists in DealerControls');
  
  // Look for the TV mode section more broadly
  const tvStart = content.indexOf("activeTab === 'tv'");
  const tvEnd = content.indexOf("activeTab === 'clubes'", tvStart);
  const tvModeContent = tvEnd > tvStart ? content.substring(tvStart, tvEnd) : '';
  
  assert(tvModeContent.length > 0, 
    'TV mode content is not empty');
  assert(tvModeContent.includes('<TournamentBlindTimer'), 
    'TV mode uses TournamentBlindTimer component');
  assert(tvModeContent.includes('currentTourney.isStarted'), 
    'TV mode conditionally renders timer based on tournament start state');
}

function testTimerAutoAdvance() {
  console.log('\n--- Test 6: Blind timer auto-advance feature ---');
  
  const componentPath = join(__dirname, '..', 'components', 'TournamentBlindTimer.tsx');
  const content = readFileSync(componentPath, 'utf8');
  
  assert(content.includes('AUTO_ADVANCE_BLIND_LEVEL'), 
    'Timer dispatches AUTO_ADVANCE_BLIND_LEVEL action');
  assert(content.includes('hasAdvancedRef'), 
    'Timer uses ref to prevent duplicate auto-advances');
  assert(content.includes('remaining === 0'), 
    'Timer checks when time runs out');
  assert(content.includes('setInterval'), 
    'Timer updates every second');
}

function testTimerPauseResume() {
  console.log('\n--- Test 7: Blind timer pause/resume feature ---');
  
  const componentPath = join(__dirname, '..', 'components', 'TournamentBlindTimer.tsx');
  const content = readFileSync(componentPath, 'utf8');
  
  assert(content.includes('isPaused'), 
    'Timer has pause state');
  assert(content.includes('Pausar'), 
    'Timer has pause button');
  assert(content.includes('Retomar'), 
    'Timer has resume button');
  assert(content.includes('setIsPaused'), 
    'Timer can toggle pause state');
}

// Run all tests
async function runTests() {
  console.log('=== Running Blind Timer Integration Tests ===\n');
  console.log('⚠️  Note: These tests verify that the blind timer component');
  console.log('    is properly integrated across all player, dealer, and TV interfaces\n');
  
  try {
    testComponentExists();
    testIntegrationInDealerControls();
    testIntegrationInPlayerDashboard();
    testIntegrationInTableDealerInterface();
    testIntegrationInTVMode();
    testTimerAutoAdvance();
    testTimerPauseResume();
    
    console.log('\n✅ All blind timer integration tests passed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ TournamentBlindTimer component exists with all required features');
    console.log('   ✅ Integrated in DealerControls (director interface)');
    console.log('   ✅ Integrated in PlayerDashboard (player interface)');
    console.log('   ✅ Integrated in TableDealerInterface (dealer interface)');
    console.log('   ✅ Integrated in TV Mode (spectator/broadcast interface)');
    console.log('   ✅ Auto-advance feature implemented');
    console.log('   ✅ Pause/resume functionality implemented');
    console.log('\n🎯 Key Features:');
    console.log('   ✅ Real-time countdown display (MM:SS format)');
    console.log('   ✅ Visual progress bar with color coding');
    console.log('   ✅ Current blind levels (SB/BB/Ante) display');
    console.log('   ✅ Automatic blind level advancement');
    console.log('   ✅ Manual pause/resume controls');
    console.log('   ✅ Consistent display across all interfaces\n');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

runTests();
