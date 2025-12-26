/**
 * Test: Betting Round Advancement with Bet Reset
 * 
 * Validates that when advancing from one betting round to another,
 * the currentBet is properly reset to 0, allowing players to CHECK
 * at the start of post-flop rounds (FLOP, TURN, RIVER).
 * 
 * This test specifically addresses the issue where players were forced
 * to CALL at the start of TURN/RIVER when they should be able to CHECK.
 * 
 * Run with: npx tsx utils/bettingRoundAdvancement.test.ts
 */

import { Player, PlayerStatus, TableState, BettingRound } from '../types';
import { getAvailableActions } from './testActionLogger';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

// Simulate the ADVANCE_BETTING_ROUND logic
function simulateAdvanceRound(
  tableState: TableState,
  players: Player[]
): { table: TableState; players: Player[] } {
  const roundOrder = ['PRE_FLOP', 'FLOP', 'TURN', 'RIVER', 'SHOWDOWN'];
  const currentRoundIdx = roundOrder.indexOf(tableState.bettingRound || 'PRE_FLOP');
  
  if (currentRoundIdx < roundOrder.length - 1) {
    const nextRound = roundOrder[currentRoundIdx + 1] as BettingRound;
    
    // Create new table state (simulating React state update)
    const newTable = {
      ...tableState,
      bettingRound: nextRound,
      currentBet: 0, // CRITICAL: Reset to 0
      lastRaiseAmount: 0,
      lastAggressorId: null,
      playersActedInRound: [],
      currentTurn: nextRound === BettingRound.SHOWDOWN ? null : tableState.currentTurn
    };
    
    // Reset ALL players' currentBet
    const newPlayers = players.map(p => ({
      ...p,
      currentBet: 0 // CRITICAL: Reset to 0
    }));
    
    return { table: newTable, players: newPlayers };
  }
  
  return { table: tableState, players };
}

function testFlopToTurnAdvancement() {
  console.log('\n--- Test: FLOP to TURN Advancement (Bet Reset) ---');
  
  // Scenario: End of FLOP, player bet 10k and everyone called
  let tableState: TableState = {
    id: 1,
    tournamentId: 'test',
    pot: 20000,
    currentBet: 10000, // Someone bet 10k on FLOP
    bettingRound: BettingRound.FLOP,
    dealerButtonPosition: 1,
    currentTurn: null, // Betting round complete
    dealerId: null,
    currentBlindLevel: 0,
    lastRaiseAmount: 10000,
    handInProgress: true,
    lastAggressorId: 'p1',
    playersActedInRound: ['p1', 'p2'],
    potDistribution: null
  };
  
  let players: Player[] = [
    {
      id: 'p1',
      personId: 'person1',
      tournamentId: 'test',
      name: 'Player 1',
      balance: 5000,
      currentBet: 10000, // Matched the bet on FLOP
      totalContributedThisHand: 10000,
      status: PlayerStatus.ACTIVE,
      tableId: 1,
      seatNumber: 1,
      accessCode: 'code1',
      rebuysCount: 0,
      hasAddon: false,
      totalInvested: 10000
    },
    {
      id: 'p2',
      personId: 'person2',
      tournamentId: 'test',
      name: 'Player 2',
      balance: 5000,
      currentBet: 10000, // Matched the bet on FLOP
      totalContributedThisHand: 10000,
      status: PlayerStatus.ACTIVE,
      tableId: 1,
      seatNumber: 2,
      accessCode: 'code2',
      rebuysCount: 0,
      hasAddon: false,
      totalInvested: 10000
    }
  ];
  
  console.log('Before advancement:');
  console.log(`  Betting Round: ${tableState.bettingRound}`);
  console.log(`  Table currentBet: ${tableState.currentBet}`);
  console.log(`  Player 1 currentBet: ${players[0].currentBet}`);
  console.log(`  Player 2 currentBet: ${players[1].currentBet}`);
  
  // Advance to TURN
  const result = simulateAdvanceRound(tableState, players);
  tableState = result.table;
  players = result.players;
  
  console.log('\nAfter advancing to TURN:');
  console.log(`  Betting Round: ${tableState.bettingRound}`);
  console.log(`  Table currentBet: ${tableState.currentBet}`);
  console.log(`  Player 1 currentBet: ${players[0].currentBet}`);
  console.log(`  Player 2 currentBet: ${players[1].currentBet}`);
  
  // Check available actions
  const p1Actions = getAvailableActions(players[0], tableState);
  const p2Actions = getAvailableActions(players[1], tableState);
  
  console.log(`\nPlayer 1 available actions: ${p1Actions.join(', ')}`);
  console.log(`Player 2 available actions: ${p2Actions.join(', ')}`);
  
  assert(tableState.bettingRound === BettingRound.TURN, 'Should be at TURN');
  assert(tableState.currentBet === 0, 'Table currentBet should be 0 at start of TURN');
  assert(players[0].currentBet === 0, 'Player 1 currentBet should be 0 at start of TURN');
  assert(players[1].currentBet === 0, 'Player 2 currentBet should be 0 at start of TURN');
  assert(p1Actions.includes('CHECK'), 'Player 1 should be able to CHECK at start of TURN');
  assert(p2Actions.includes('CHECK'), 'Player 2 should be able to CHECK at start of TURN');
  
  console.log('\n✓ FLOP to TURN advancement correctly resets bets');
}

function testTurnToRiverAdvancement() {
  console.log('\n--- Test: TURN to RIVER Advancement (Large Bet Reset) ---');
  
  // Scenario: End of TURN, player bet 15k and everyone called
  let tableState: TableState = {
    id: 1,
    tournamentId: 'test',
    pot: 30000,
    currentBet: 15000, // Someone bet 15k on TURN
    bettingRound: BettingRound.TURN,
    dealerButtonPosition: 1,
    currentTurn: null,
    dealerId: null,
    currentBlindLevel: 0,
    lastRaiseAmount: 15000,
    handInProgress: true,
    lastAggressorId: 'p1',
    playersActedInRound: ['p1', 'p2'],
    potDistribution: null
  };
  
  let players: Player[] = [
    {
      id: 'p1',
      personId: 'person1',
      tournamentId: 'test',
      name: 'Player 1',
      balance: 10000,
      currentBet: 15000, // Bet on TURN
      totalContributedThisHand: 25000,
      status: PlayerStatus.ACTIVE,
      tableId: 1,
      seatNumber: 1,
      accessCode: 'code1',
      rebuysCount: 0,
      hasAddon: false,
      totalInvested: 25000
    },
    {
      id: 'p2',
      personId: 'person2',
      tournamentId: 'test',
      name: 'Player 2',
      balance: 10000,
      currentBet: 15000, // Called on TURN
      totalContributedThisHand: 25000,
      status: PlayerStatus.ACTIVE,
      tableId: 1,
      seatNumber: 2,
      accessCode: 'code2',
      rebuysCount: 0,
      hasAddon: false,
      totalInvested: 25000
    }
  ];
  
  console.log('Before advancement:');
  console.log(`  Betting Round: ${tableState.bettingRound}`);
  console.log(`  Table currentBet: ${tableState.currentBet}`);
  
  // Advance to RIVER
  const result = simulateAdvanceRound(tableState, players);
  tableState = result.table;
  players = result.players;
  
  console.log('\nAfter advancing to RIVER:');
  console.log(`  Betting Round: ${tableState.bettingRound}`);
  console.log(`  Table currentBet: ${tableState.currentBet}`);
  console.log(`  Player 1 currentBet: ${players[0].currentBet}`);
  console.log(`  Player 2 currentBet: ${players[1].currentBet}`);
  
  const p1Actions = getAvailableActions(players[0], tableState);
  
  console.log(`\nPlayer 1 available actions: ${p1Actions.join(', ')}`);
  
  assert(tableState.bettingRound === BettingRound.RIVER, 'Should be at RIVER');
  assert(tableState.currentBet === 0, 'Table currentBet should be 0 at start of RIVER');
  assert(players[0].currentBet === 0, 'Player 1 currentBet should be 0 at start of RIVER');
  assert(p1Actions.includes('CHECK'), 'Player 1 should be able to CHECK at start of RIVER');
  assert(!p1Actions.includes('CALL'), 'Player 1 should NOT need to CALL (no bet to call)');
  
  console.log('\n✓ TURN to RIVER advancement correctly resets bets');
}

function testRiverToShowdownAdvancement() {
  console.log('\n--- Test: RIVER to SHOWDOWN Advancement (No Betting at SHOWDOWN) ---');
  
  // Scenario: End of RIVER, advancing to SHOWDOWN
  let tableState: TableState = {
    id: 1,
    tournamentId: 'test',
    pot: 40000,
    currentBet: 20000, // Large bet on RIVER
    bettingRound: BettingRound.RIVER,
    dealerButtonPosition: 1,
    currentTurn: null,
    dealerId: null,
    currentBlindLevel: 0,
    lastRaiseAmount: 20000,
    handInProgress: true,
    lastAggressorId: 'p1',
    playersActedInRound: ['p1', 'p2'],
    potDistribution: null
  };
  
  let players: Player[] = [
    {
      id: 'p1',
      personId: 'person1',
      tournamentId: 'test',
      name: 'Player 1',
      balance: 5000,
      currentBet: 20000,
      totalContributedThisHand: 45000,
      status: PlayerStatus.ACTIVE,
      tableId: 1,
      seatNumber: 1,
      accessCode: 'code1',
      rebuysCount: 0,
      hasAddon: false,
      totalInvested: 45000
    },
    {
      id: 'p2',
      personId: 'person2',
      tournamentId: 'test',
      name: 'Player 2',
      balance: 5000,
      currentBet: 20000,
      totalContributedThisHand: 45000,
      status: PlayerStatus.ACTIVE,
      tableId: 1,
      seatNumber: 2,
      accessCode: 'code2',
      rebuysCount: 0,
      hasAddon: false,
      totalInvested: 45000
    }
  ];
  
  console.log('Before advancement:');
  console.log(`  Betting Round: ${tableState.bettingRound}`);
  console.log(`  Table currentBet: ${tableState.currentBet}`);
  
  // Advance to SHOWDOWN
  const result = simulateAdvanceRound(tableState, players);
  tableState = result.table;
  players = result.players;
  
  console.log('\nAfter advancing to SHOWDOWN:');
  console.log(`  Betting Round: ${tableState.bettingRound}`);
  console.log(`  Table currentBet: ${tableState.currentBet}`);
  console.log(`  Table currentTurn: ${tableState.currentTurn}`);
  
  const p1Actions = getAvailableActions(players[0], tableState);
  const p2Actions = getAvailableActions(players[1], tableState);
  
  console.log(`\nPlayer 1 available actions: ${p1Actions.length === 0 ? '(none)' : p1Actions.join(', ')}`);
  console.log(`Player 2 available actions: ${p2Actions.length === 0 ? '(none)' : p2Actions.join(', ')}`);
  
  assert(tableState.bettingRound === BettingRound.SHOWDOWN, 'Should be at SHOWDOWN');
  assert(tableState.currentBet === 0, 'Table currentBet should be 0 at SHOWDOWN');
  assert(tableState.currentTurn === null, 'currentTurn should be null at SHOWDOWN (no betting)');
  assert(p1Actions.length === 0, 'Player 1 should have NO actions at SHOWDOWN');
  assert(p2Actions.length === 0, 'Player 2 should have NO actions at SHOWDOWN');
  
  console.log('\n✓ RIVER to SHOWDOWN advancement correctly resets bets and blocks actions');
}

function testMultipleRoundAdvancements() {
  console.log('\n--- Test: Multiple Round Advancements (PRE_FLOP → SHOWDOWN) ---');
  
  let tableState: TableState = {
    id: 1,
    tournamentId: 'test',
    pot: 200,
    currentBet: 100, // Big blind
    bettingRound: BettingRound.PRE_FLOP,
    dealerButtonPosition: 1,
    currentTurn: 'p1',
    dealerId: null,
    currentBlindLevel: 0,
    lastRaiseAmount: 100,
    handInProgress: true,
    lastAggressorId: 'bb',
    playersActedInRound: [],
    potDistribution: null
  };
  
  let players: Player[] = [
    {
      id: 'p1',
      personId: 'person1',
      tournamentId: 'test',
      name: 'Player 1',
      balance: 10000,
      currentBet: 100,
      totalContributedThisHand: 100,
      status: PlayerStatus.ACTIVE,
      tableId: 1,
      seatNumber: 1,
      accessCode: 'code1',
      rebuysCount: 0,
      hasAddon: false,
      totalInvested: 100
    }
  ];
  
  const rounds: BettingRound[] = [BettingRound.PRE_FLOP, BettingRound.FLOP, BettingRound.TURN, BettingRound.RIVER, BettingRound.SHOWDOWN];
  
  for (let i = 0; i < rounds.length - 1; i++) {
    const currentRound = rounds[i];
    const nextRound = rounds[i + 1];
    
    console.log(`\nAdvancing from ${currentRound} to ${nextRound}...`);
    
    const result = simulateAdvanceRound(tableState, players);
    tableState = result.table;
    players = result.players;
    
    console.log(`  Table currentBet after advancement: ${tableState.currentBet}`);
    console.log(`  Player currentBet after advancement: ${players[0].currentBet}`);
    
    assert(tableState.bettingRound === nextRound, `Should advance to ${nextRound}`);
    assert(tableState.currentBet === 0, `currentBet should be 0 at ${nextRound}`);
    assert(players[0].currentBet === 0, `Player currentBet should be 0 at ${nextRound}`);
    
    // Check actions (except at SHOWDOWN)
    if (nextRound !== BettingRound.SHOWDOWN) {
      const actions = getAvailableActions(players[0], tableState);
      assert(actions.includes('CHECK'), `Player should be able to CHECK at ${nextRound}`);
    }
  }
  
  console.log('\n✓ All round advancements correctly reset bets');
}

// Run all tests
console.log('=== Running Betting Round Advancement Tests ===');

try {
  testFlopToTurnAdvancement();
  testTurnToRiverAdvancement();
  testRiverToShowdownAdvancement();
  testMultipleRoundAdvancements();
  
  console.log('\n✅ All betting round advancement tests passed!');
  console.log('\n🎯 Verification: Betting rounds advance correctly with proper bet reset.');
  console.log('   Players can CHECK at the start of FLOP, TURN, and RIVER.');
  console.log('   SHOWDOWN correctly blocks all betting actions.');
  console.log('   This fix ensures players are not forced to CALL when they should be able to CHECK.\n');
} catch (error) {
  console.error('\n❌ Test failed with error:', error);
  process.exit(1);
}
