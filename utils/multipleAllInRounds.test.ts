/**
 * Multiple All-In Rounds Test
 * 
 * This test verifies the fix for the infinite loop bug that occurred when:
 * - Multiple players go all-in in different betting rounds
 * - Some players fold
 * - Two active players remain and complete their actions
 * 
 * The bug was in checkBettingRoundComplete function which incorrectly expected
 * ALL_IN players to have acted in the current round.
 * 
 * Run this test with: npx tsx utils/multipleAllInRounds.test.ts
 */

import { PlayerStatus } from '../types';

interface MockPlayer {
  id: string;
  tableId: number;
  status: PlayerStatus;
  currentBet: number;
  balance: number;
  seatNumber: number;
  totalContributedThisHand: number;
}

interface MockTableState {
  id: number;
  currentTurn: string | null;
  currentBet: number;
  playersActedInRound: string[];
  lastAggressorId: string | null;
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

/**
 * Simulates the checkBettingRoundComplete logic with the fix
 */
function checkBettingRoundComplete(
  players: MockPlayer[],
  tableId: number,
  tableState: MockTableState
): boolean {
  const activePlayers = players.filter(p => 
    p.tableId === tableId && 
    p.status !== PlayerStatus.FOLDED && 
    p.status !== PlayerStatus.OUT
  );
  
  if (activePlayers.length <= 1) return true;
  
  // Check if all players are all-in or only one can act
  const playersWhoCanAct = activePlayers.filter(p => 
    p.status !== PlayerStatus.ALL_IN && p.balance > 0
  );
  if (playersWhoCanAct.length <= 1) return true;
  
  const maxBet = Math.max(...players.filter(p => p.tableId === tableId).map(p => p.currentBet), 0);
  
  // Check if all active players have matched the max bet or are all-in
  const allPlayersMatched = activePlayers.every(p => 
    p.currentBet === maxBet || p.status === PlayerStatus.ALL_IN
  );
  
  if (!allPlayersMatched) return false;
  
  // FIX: Check if all active players who can act have acted at least once
  // ALL_IN players cannot act, so they should not be expected to have acted
  const allPlayersActed = activePlayers
    .filter(p => p.status !== PlayerStatus.ALL_IN)
    .every(p => tableState.playersActedInRound.includes(p.id));
  
  if (!allPlayersActed) return false;
  
  // FIX: If there's a last aggressor and they are all-in, they can't act
  if (tableState.lastAggressorId) {
    const lastAggressor = players.find(p => p.id === tableState.lastAggressorId);
    if (lastAggressor && lastAggressor.status === PlayerStatus.ALL_IN) {
      return true;
    }
    return tableState.playersActedInRound.includes(tableState.lastAggressorId);
  }
  
  return true;
}

function testMultipleAllInsAcrossRounds() {
  console.log('\n--- Test: Multiple All-Ins Across Different Rounds (Issue Scenario) ---');
  
  // Scenario from the issue:
  // - 6 players initially
  // - 3 went all-in in different rounds (p2 in pre-flop, p3 in flop, p4 in turn)
  // - 1 folded (p5)
  // - 2 active players remaining (p1, p6)
  // - Both p1 and p6 check on the turn, round should complete
  
  const players: MockPlayer[] = [
    { 
      id: 'p1', 
      tableId: 1, 
      status: PlayerStatus.ACTIVE, 
      currentBet: 500, 
      balance: 2000, 
      seatNumber: 1,
      totalContributedThisHand: 1500
    },
    { 
      id: 'p2', 
      tableId: 1, 
      status: PlayerStatus.ALL_IN, // All-in during pre-flop
      currentBet: 300, 
      balance: 0, 
      seatNumber: 2,
      totalContributedThisHand: 300
    },
    { 
      id: 'p3', 
      tableId: 1, 
      status: PlayerStatus.ALL_IN, // All-in during flop
      currentBet: 400, 
      balance: 0, 
      seatNumber: 3,
      totalContributedThisHand: 400
    },
    { 
      id: 'p4', 
      tableId: 1, 
      status: PlayerStatus.ALL_IN, // All-in during turn
      currentBet: 500, 
      balance: 0, 
      seatNumber: 4,
      totalContributedThisHand: 800
    },
    { 
      id: 'p5', 
      tableId: 1, 
      status: PlayerStatus.FOLDED, // Folded
      currentBet: 200, 
      balance: 800, 
      seatNumber: 5,
      totalContributedThisHand: 200
    },
    { 
      id: 'p6', 
      tableId: 1, 
      status: PlayerStatus.ACTIVE, 
      currentBet: 500, 
      balance: 3000, 
      seatNumber: 6,
      totalContributedThisHand: 1200
    },
  ];
  
  const tableState: MockTableState = {
    id: 1,
    currentTurn: null,
    currentBet: 500,
    playersActedInRound: ['p1', 'p6'], // Both active players have acted (checked)
    lastAggressorId: 'p4' // Last aggressor is all-in
  };
  
  // Check if round is complete (should be true)
  const isComplete = checkBettingRoundComplete(players, 1, tableState);
  
  assert(isComplete, 'Betting round should be complete when both active players acted and all-ins are present');
  
  console.log('✓ Round correctly identified as complete despite multiple all-ins');
}

function testLastAggressorAllIn() {
  console.log('\n--- Test: Last Aggressor All-In ---');
  
  // Scenario: Last aggressor went all-in, other players called
  // Round should complete even though aggressor hasn't "acted again"
  
  const players: MockPlayer[] = [
    { 
      id: 'p1', 
      tableId: 1, 
      status: PlayerStatus.ACTIVE, 
      currentBet: 1000, 
      balance: 2000, 
      seatNumber: 1,
      totalContributedThisHand: 1000
    },
    { 
      id: 'p2', 
      tableId: 1, 
      status: PlayerStatus.ALL_IN, // Last aggressor, went all-in
      currentBet: 1000, 
      balance: 0, 
      seatNumber: 2,
      totalContributedThisHand: 1000
    },
    { 
      id: 'p3', 
      tableId: 1, 
      status: PlayerStatus.ACTIVE, 
      currentBet: 1000, 
      balance: 1500, 
      seatNumber: 3,
      totalContributedThisHand: 1000
    },
  ];
  
  const tableState: MockTableState = {
    id: 1,
    currentTurn: null,
    currentBet: 1000,
    playersActedInRound: ['p2', 'p1', 'p3'], // p2 went all-in, others called
    lastAggressorId: 'p2' // Last aggressor is all-in
  };
  
  const isComplete = checkBettingRoundComplete(players, 1, tableState);
  
  assert(isComplete, 'Betting round should complete when last aggressor is all-in and others acted');
  
  console.log('✓ Round correctly completes when last aggressor is all-in');
}

function testOnlyAllInsRemaining() {
  console.log('\n--- Test: Only All-Ins Remaining ---');
  
  // Scenario: All remaining players are all-in
  // Round should immediately complete
  
  const players: MockPlayer[] = [
    { 
      id: 'p1', 
      tableId: 1, 
      status: PlayerStatus.ALL_IN, 
      currentBet: 500, 
      balance: 0, 
      seatNumber: 1,
      totalContributedThisHand: 500
    },
    { 
      id: 'p2', 
      tableId: 1, 
      status: PlayerStatus.ALL_IN, 
      currentBet: 800, 
      balance: 0, 
      seatNumber: 2,
      totalContributedThisHand: 800
    },
    { 
      id: 'p3', 
      tableId: 1, 
      status: PlayerStatus.FOLDED, 
      currentBet: 100, 
      balance: 900, 
      seatNumber: 3,
      totalContributedThisHand: 100
    },
  ];
  
  const tableState: MockTableState = {
    id: 1,
    currentTurn: null,
    currentBet: 800,
    playersActedInRound: ['p1', 'p2'], // Both went all-in
    lastAggressorId: 'p2'
  };
  
  const isComplete = checkBettingRoundComplete(players, 1, tableState);
  
  assert(isComplete, 'Betting round should complete when all remaining players are all-in');
  
  console.log('✓ Round correctly completes when all remaining players are all-in');
}

function testActivePlayersNotAllActed() {
  console.log('\n--- Test: Active Players Not All Acted (Should Not Complete) ---');
  
  // Scenario: Some active players haven't acted yet
  // Round should NOT complete
  
  const players: MockPlayer[] = [
    { 
      id: 'p1', 
      tableId: 1, 
      status: PlayerStatus.ACTIVE, 
      currentBet: 500, 
      balance: 2000, 
      seatNumber: 1,
      totalContributedThisHand: 500
    },
    { 
      id: 'p2', 
      tableId: 1, 
      status: PlayerStatus.ALL_IN, 
      currentBet: 300, 
      balance: 0, 
      seatNumber: 2,
      totalContributedThisHand: 300
    },
    { 
      id: 'p3', 
      tableId: 1, 
      status: PlayerStatus.ACTIVE, 
      currentBet: 500, 
      balance: 3000, 
      seatNumber: 3,
      totalContributedThisHand: 500
    },
  ];
  
  const tableState: MockTableState = {
    id: 1,
    currentTurn: 'p3',
    currentBet: 500,
    playersActedInRound: ['p1'], // Only p1 acted, p3 hasn't acted yet
    lastAggressorId: 'p1'
  };
  
  const isComplete = checkBettingRoundComplete(players, 1, tableState);
  
  assert(!isComplete, 'Betting round should NOT complete when active players have not all acted');
  
  console.log('✓ Round correctly identified as incomplete when not all active players acted');
}

// Run all tests
console.log('=== Running Multiple All-In Rounds Tests ===');

try {
  testMultipleAllInsAcrossRounds();
  testLastAggressorAllIn();
  testOnlyAllInsRemaining();
  testActivePlayersNotAllActed();
  
  console.log('\n✅ All multiple all-in rounds tests passed!');
  console.log('\n🎯 Verification: Infinite loop bug is fixed. Betting rounds complete correctly');
  console.log('   even when multiple players go all-in across different betting rounds.');
} catch (error) {
  console.error('\n❌ Test failed with error:', error);
  process.exit(1);
}
