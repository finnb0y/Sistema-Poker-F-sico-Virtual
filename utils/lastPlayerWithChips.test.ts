/**
 * Test: Last Player with Chips Should Get Action After Multiple All-Ins
 * 
 * This test verifies that when multiple players go all-in across different rounds,
 * the last player with chips still gets the opportunity to call/fold before showdown.
 * 
 * Issue: When 5 players go all-in, the 6th player with chips should still get action,
 * but the system was incorrectly thinking everyone was all-in.
 */

import { Player, PlayerStatus } from '../types';
import { areAllPlayersAllInOrCapped } from '../utils/sidePotLogic';

// Test helper to create a player
function createPlayer(id: string, balance: number, status: PlayerStatus, tableId: number): Player {
  return {
    id,
    personId: `person-${id}`,
    tournamentId: 'test-tournament',
    name: `Player ${id}`,
    balance,
    currentBet: 0,
    totalContributedThisHand: 0,
    status,
    tableId,
    seatNumber: parseInt(id),
    accessCode: 'TEST',
    rebuysCount: 0,
    hasAddon: false,
    totalInvested: 0
  };
}

console.log('🧪 Testing: Last Player with Chips Should Get Action');

// Test 1: Five players all-in, one player with chips - should still allow action
console.log('\n📋 Test 1: Five all-in, one with chips should get action');
{
  const players: Player[] = [
    createPlayer('1', 0, PlayerStatus.ALL_IN, 1),
    createPlayer('2', 0, PlayerStatus.ALL_IN, 1),
    createPlayer('3', 0, PlayerStatus.ALL_IN, 1),
    createPlayer('4', 0, PlayerStatus.ALL_IN, 1),
    createPlayer('5', 0, PlayerStatus.ALL_IN, 1),
    createPlayer('6', 1000, PlayerStatus.ACTIVE, 1), // Has chips and can act
  ];
  
  const result = areAllPlayersAllInOrCapped(players, 1);
  const expected = false; // Should be false - Player 6 can still act
  
  if (result === expected) {
    console.log('✅ PASS: areAllPlayersAllInOrCapped returned false (Player 6 can act)');
  } else {
    console.log(`❌ FAIL: Expected ${expected}, got ${result}`);
    process.exit(1);
  }
}

// Test 2: Four players all-in, one folded, one with chips - should still allow action
console.log('\n📋 Test 2: Four all-in, one folded, one with chips');
{
  const players: Player[] = [
    createPlayer('1', 0, PlayerStatus.ALL_IN, 1),
    createPlayer('2', 0, PlayerStatus.ALL_IN, 1),
    createPlayer('3', 0, PlayerStatus.ALL_IN, 1),
    createPlayer('4', 0, PlayerStatus.ALL_IN, 1),
    createPlayer('5', 500, PlayerStatus.FOLDED, 1),
    createPlayer('6', 2000, PlayerStatus.ACTIVE, 1), // Has chips and can act
  ];
  
  const result = areAllPlayersAllInOrCapped(players, 1);
  const expected = false;
  
  if (result === expected) {
    console.log('✅ PASS: Player 6 can still act despite folded player');
  } else {
    console.log(`❌ FAIL: Expected ${expected}, got ${result}`);
    process.exit(1);
  }
}

// Test 3: All players all-in, none with chips - should return true
console.log('\n📋 Test 3: All players all-in, no one can act');
{
  const players: Player[] = [
    createPlayer('1', 0, PlayerStatus.ALL_IN, 1),
    createPlayer('2', 0, PlayerStatus.ALL_IN, 1),
    createPlayer('3', 0, PlayerStatus.ALL_IN, 1),
    createPlayer('4', 0, PlayerStatus.ALL_IN, 1),
  ];
  
  const result = areAllPlayersAllInOrCapped(players, 1);
  const expected = true; // Should be true - no one can act
  
  if (result === expected) {
    console.log('✅ PASS: Correctly identified no players can act');
  } else {
    console.log(`❌ FAIL: Expected ${expected}, got ${result}`);
    process.exit(1);
  }
}

// Test 4: Two players with chips - should return false (normal betting)
console.log('\n📋 Test 4: Two players with chips, normal betting');
{
  const players: Player[] = [
    createPlayer('1', 1000, PlayerStatus.ACTIVE, 1),
    createPlayer('2', 2000, PlayerStatus.ACTIVE, 1),
    createPlayer('3', 0, PlayerStatus.ALL_IN, 1),
  ];
  
  const result = areAllPlayersAllInOrCapped(players, 1);
  const expected = false;
  
  if (result === expected) {
    console.log('✅ PASS: Two players can still bet normally');
  } else {
    console.log(`❌ FAIL: Expected ${expected}, got ${result}`);
    process.exit(1);
  }
}

// Test 5: One player remaining after others folded - should return true
console.log('\n📋 Test 5: One player remaining, others folded/out');
{
  const players: Player[] = [
    createPlayer('1', 1000, PlayerStatus.ACTIVE, 1),
    createPlayer('2', 0, PlayerStatus.FOLDED, 1),
    createPlayer('3', 0, PlayerStatus.FOLDED, 1),
  ];
  
  const result = areAllPlayersAllInOrCapped(players, 1);
  const expected = true; // Only one player left
  
  if (result === expected) {
    console.log('✅ PASS: Correctly identified only one player remaining');
  } else {
    console.log(`❌ FAIL: Expected ${expected}, got ${result}`);
    process.exit(1);
  }
}

console.log('\n🎉 All tests passed! Last player with chips will now get action before showdown.\n');
