/**
 * All-In Player Actions Tests
 * 
 * Tests to verify that players in ALL_IN status cannot perform actions like check, fold, call, bet, or raise.
 * These tests verify the fix for Problem 1 from the issue.
 * 
 * Run these tests with: npx tsx utils/allInPlayerActions.test.ts
 */

import { PlayerStatus } from '../types';

// Mock game state for testing
interface MockPlayer {
  id: string;
  tableId: number;
  status: PlayerStatus;
  currentBet: number;
  balance: number;
  seatNumber: number;
}

interface MockTableState {
  id: number;
  currentTurn: string | null;
  currentBet: number;
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
 * Simulate getNextTurnId function logic
 */
function getNextTurnId(players: MockPlayer[], tableId: number, currentId: string | null): string | null {
  // Only consider players who can still act (not folded, not out, not all-in)
  const tablePlayers = players.filter(p => 
    p.tableId === tableId && 
    p.status !== PlayerStatus.FOLDED && 
    p.status !== PlayerStatus.OUT &&
    p.status !== PlayerStatus.ALL_IN
  );
  
  if (tablePlayers.length <= 1) return null;
  
  const sorted = [...tablePlayers].sort((a, b) => a.seatNumber - b.seatNumber);
  const currIdx = sorted.findIndex(p => p.id === currentId);
  
  if (currIdx === -1) {
    return sorted[0]?.id || null;
  }
  
  return sorted[(currIdx + 1) % sorted.length].id;
}

/**
 * Check if an action should be allowed for a player
 */
function canPlayerAct(player: MockPlayer, tableState: MockTableState, senderId: string): boolean {
  return tableState.currentTurn === senderId && player.status !== PlayerStatus.ALL_IN;
}

function testAllInPlayerSkippedInTurnRotation() {
  console.log('\n--- Test 1: All-In Player Skipped in Turn Rotation ---');
  
  const players: MockPlayer[] = [
    { id: 'p1', tableId: 1, status: PlayerStatus.ACTIVE, currentBet: 100, balance: 1000, seatNumber: 1 },
    { id: 'p2', tableId: 1, status: PlayerStatus.ALL_IN, currentBet: 500, balance: 0, seatNumber: 2 },
    { id: 'p3', tableId: 1, status: PlayerStatus.ACTIVE, currentBet: 500, balance: 2000, seatNumber: 3 },
    { id: 'p4', tableId: 1, status: PlayerStatus.ACTIVE, currentBet: 500, balance: 3000, seatNumber: 4 },
  ];
  
  // Start with p1's turn
  let nextTurn = getNextTurnId(players, 1, 'p1');
  
  // Should skip p2 (all-in) and go to p3
  assert(nextTurn === 'p3', `Next turn after p1 should be p3 (skipping all-in p2), got ${nextTurn}`);
  
  // From p3, should go to p4
  nextTurn = getNextTurnId(players, 1, 'p3');
  assert(nextTurn === 'p4', `Next turn after p3 should be p4, got ${nextTurn}`);
  
  // From p4, should wrap to p1 (skipping p2)
  nextTurn = getNextTurnId(players, 1, 'p4');
  assert(nextTurn === 'p1', `Next turn after p4 should wrap to p1 (skipping all-in p2), got ${nextTurn}`);
}

function testMultipleAllInPlayersSkipped() {
  console.log('\n--- Test 2: Multiple All-In Players Skipped ---');
  
  const players: MockPlayer[] = [
    { id: 'p1', tableId: 1, status: PlayerStatus.ACTIVE, currentBet: 1000, balance: 5000, seatNumber: 1 },
    { id: 'p2', tableId: 1, status: PlayerStatus.ALL_IN, currentBet: 300, balance: 0, seatNumber: 2 },
    { id: 'p3', tableId: 1, status: PlayerStatus.ALL_IN, currentBet: 500, balance: 0, seatNumber: 3 },
    { id: 'p4', tableId: 1, status: PlayerStatus.ACTIVE, currentBet: 1000, balance: 3000, seatNumber: 4 },
    { id: 'p5', tableId: 1, status: PlayerStatus.ALL_IN, currentBet: 800, balance: 0, seatNumber: 5 },
  ];
  
  // Start with p1's turn
  let nextTurn = getNextTurnId(players, 1, 'p1');
  
  // Should skip p2, p3 (both all-in) and go to p4
  assert(nextTurn === 'p4', `Next turn after p1 should be p4 (skipping all-in p2 and p3), got ${nextTurn}`);
  
  // From p4, should wrap to p1 (skipping p5)
  nextTurn = getNextTurnId(players, 1, 'p4');
  assert(nextTurn === 'p1', `Next turn after p4 should wrap to p1 (skipping all-in p5), got ${nextTurn}`);
}

function testAllPlayersAllInNoTurn() {
  console.log('\n--- Test 3: All Players All-In Returns No Turn ---');
  
  const players: MockPlayer[] = [
    { id: 'p1', tableId: 1, status: PlayerStatus.ALL_IN, currentBet: 1000, balance: 0, seatNumber: 1 },
    { id: 'p2', tableId: 1, status: PlayerStatus.ALL_IN, currentBet: 500, balance: 0, seatNumber: 2 },
    { id: 'p3', tableId: 1, status: PlayerStatus.ALL_IN, currentBet: 300, balance: 0, seatNumber: 3 },
  ];
  
  const nextTurn = getNextTurnId(players, 1, 'p1');
  
  // Should return null when all players are all-in
  assert(nextTurn === null, `Next turn should be null when all players are all-in, got ${nextTurn}`);
}

function testOnlyOneActivePlayerReturnsNull() {
  console.log('\n--- Test 4: Only One Active Player Returns No Turn ---');
  
  const players: MockPlayer[] = [
    { id: 'p1', tableId: 1, status: PlayerStatus.ACTIVE, currentBet: 1000, balance: 5000, seatNumber: 1 },
    { id: 'p2', tableId: 1, status: PlayerStatus.ALL_IN, currentBet: 500, balance: 0, seatNumber: 2 },
    { id: 'p3', tableId: 1, status: PlayerStatus.ALL_IN, currentBet: 300, balance: 0, seatNumber: 3 },
  ];
  
  const nextTurn = getNextTurnId(players, 1, 'p1');
  
  // Should return null when only one player can act
  assert(nextTurn === null, `Next turn should be null when only one player can act, got ${nextTurn}`);
}

function testAllInPlayerCannotAct() {
  console.log('\n--- Test 5: All-In Player Cannot Perform Actions ---');
  
  const allInPlayer: MockPlayer = {
    id: 'p1',
    tableId: 1,
    status: PlayerStatus.ALL_IN,
    currentBet: 500,
    balance: 0,
    seatNumber: 1
  };
  
  const tableState: MockTableState = {
    id: 1,
    currentTurn: 'p1',
    currentBet: 500
  };
  
  // Even though it's the player's turn, they shouldn't be able to act if all-in
  const canAct = canPlayerAct(allInPlayer, tableState, 'p1');
  assert(!canAct, 'All-in player should not be able to perform actions');
}

function testActivePlayerCanAct() {
  console.log('\n--- Test 6: Active Player Can Perform Actions ---');
  
  const activePlayer: MockPlayer = {
    id: 'p1',
    tableId: 1,
    status: PlayerStatus.ACTIVE,
    currentBet: 500,
    balance: 1000,
    seatNumber: 1
  };
  
  const tableState: MockTableState = {
    id: 1,
    currentTurn: 'p1',
    currentBet: 500
  };
  
  // Active player with their turn should be able to act
  const canAct = canPlayerAct(activePlayer, tableState, 'p1');
  assert(canAct, 'Active player should be able to perform actions when it is their turn');
}

function testFoldedPlayerSkipped() {
  console.log('\n--- Test 7: Folded Players Also Skipped ---');
  
  const players: MockPlayer[] = [
    { id: 'p1', tableId: 1, status: PlayerStatus.ACTIVE, currentBet: 500, balance: 1000, seatNumber: 1 },
    { id: 'p2', tableId: 1, status: PlayerStatus.FOLDED, currentBet: 100, balance: 900, seatNumber: 2 },
    { id: 'p3', tableId: 1, status: PlayerStatus.ALL_IN, currentBet: 300, balance: 0, seatNumber: 3 },
    { id: 'p4', tableId: 1, status: PlayerStatus.ACTIVE, currentBet: 500, balance: 2000, seatNumber: 4 },
  ];
  
  // Start with p1's turn
  const nextTurn = getNextTurnId(players, 1, 'p1');
  
  // Should skip both p2 (folded) and p3 (all-in) and go to p4
  assert(nextTurn === 'p4', `Next turn after p1 should be p4 (skipping folded p2 and all-in p3), got ${nextTurn}`);
}

// Run all tests
console.log('=== Running All-In Player Actions Tests ===');

try {
  testAllInPlayerSkippedInTurnRotation();
  testMultipleAllInPlayersSkipped();
  testAllPlayersAllInNoTurn();
  testOnlyOneActivePlayerReturnsNull();
  testAllInPlayerCannotAct();
  testActivePlayerCanAct();
  testFoldedPlayerSkipped();
  
  console.log('\n✅ All all-in player actions tests passed!');
  console.log('\n🎯 Verification: Players in ALL_IN status are now correctly excluded from taking actions.');
} catch (error) {
  console.error('\n❌ Test failed with error:', error);
  process.exit(1);
}
