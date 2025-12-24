/**
 * Test: Players with Zero Balance Should Be Marked as OUT
 * 
 * This test verifies that players with zero or negative balance are marked as OUT
 * and cannot participate in hands, preventing negative balances from blind posting.
 */

import { Player, PlayerStatus } from '../types';

console.log('🧪 Testing: Zero Balance Players Marked as OUT');

// Test helper to simulate the START_HAND logic for marking zero-balance players
function markZeroBalancePlayersAsOut(players: Player[]): Player[] {
  return players.map(p => {
    if (p.balance <= 0 && p.status !== PlayerStatus.OUT) {
      return { ...p, status: PlayerStatus.OUT };
    }
    return p;
  });
}

// Test 1: Player with zero balance should be marked as OUT
console.log('\n📋 Test 1: Player with zero balance marked as OUT');
{
  const players: Player[] = [
    {
      id: '1',
      personId: 'person-1',
      tournamentId: 'test',
      name: 'Player 1',
      balance: 0, // Zero balance
      currentBet: 0,
      totalContributedThisHand: 0,
      status: PlayerStatus.SITTING,
      tableId: 1,
      seatNumber: 2,
      accessCode: 'TEST',
      rebuysCount: 0,
      hasAddon: false,
      totalInvested: 0
    }
  ];
  
  const result = markZeroBalancePlayersAsOut(players);
  
  if (result[0].status === PlayerStatus.OUT) {
    console.log('✅ PASS: Zero balance player marked as OUT');
  } else {
    console.log(`❌ FAIL: Expected OUT, got ${result[0].status}`);
    process.exit(1);
  }
}

// Test 2: Player with negative balance should be marked as OUT
console.log('\n📋 Test 2: Player with negative balance marked as OUT');
{
  const players: Player[] = [
    {
      id: '1',
      personId: 'person-1',
      tournamentId: 'test',
      name: 'Player 1',
      balance: -100, // Negative balance
      currentBet: 0,
      totalContributedThisHand: 0,
      status: PlayerStatus.ACTIVE,
      tableId: 1,
      seatNumber: 2,
      accessCode: 'TEST',
      rebuysCount: 0,
      hasAddon: false,
      totalInvested: 0
    }
  ];
  
  const result = markZeroBalancePlayersAsOut(players);
  
  if (result[0].status === PlayerStatus.OUT) {
    console.log('✅ PASS: Negative balance player marked as OUT');
  } else {
    console.log(`❌ FAIL: Expected OUT, got ${result[0].status}`);
    process.exit(1);
  }
}

// Test 3: Player with positive balance should remain active
console.log('\n📋 Test 3: Player with positive balance remains in play');
{
  const players: Player[] = [
    {
      id: '1',
      personId: 'person-1',
      tournamentId: 'test',
      name: 'Player 1',
      balance: 1000, // Positive balance
      currentBet: 0,
      totalContributedThisHand: 0,
      status: PlayerStatus.SITTING,
      tableId: 1,
      seatNumber: 2,
      accessCode: 'TEST',
      rebuysCount: 0,
      hasAddon: false,
      totalInvested: 0
    }
  ];
  
  const result = markZeroBalancePlayersAsOut(players);
  
  if (result[0].status === PlayerStatus.SITTING) {
    console.log('✅ PASS: Player with chips remains in original status');
  } else {
    console.log(`❌ FAIL: Expected SITTING, got ${result[0].status}`);
    process.exit(1);
  }
}

// Test 4: Already OUT player stays OUT
console.log('\n📋 Test 4: Already OUT player stays OUT');
{
  const players: Player[] = [
    {
      id: '1',
      personId: 'person-1',
      tournamentId: 'test',
      name: 'Player 1',
      balance: 0,
      currentBet: 0,
      totalContributedThisHand: 0,
      status: PlayerStatus.OUT, // Already OUT
      tableId: 1,
      seatNumber: 2,
      accessCode: 'TEST',
      rebuysCount: 0,
      hasAddon: false,
      totalInvested: 0
    }
  ];
  
  const result = markZeroBalancePlayersAsOut(players);
  
  if (result[0].status === PlayerStatus.OUT) {
    console.log('✅ PASS: OUT player remains OUT');
  } else {
    console.log(`❌ FAIL: Expected OUT, got ${result[0].status}`);
    process.exit(1);
  }
}

// Test 5: Blind posting with insufficient balance
console.log('\n📋 Test 5: Blind posting with insufficient balance');
{
  const smallBlind = 50;
  const bigBlind = 100;
  
  // Player with only 30 chips trying to post 50 SB
  let playerBalance = 30;
  const sbAmount = Math.min(smallBlind, playerBalance);
  playerBalance -= sbAmount;
  
  if (sbAmount === 30 && playerBalance === 0) {
    console.log('✅ PASS: Player posts partial blind (30 instead of 50) and goes all-in');
  } else {
    console.log(`❌ FAIL: Expected sbAmount=30, balance=0, got sbAmount=${sbAmount}, balance=${playerBalance}`);
    process.exit(1);
  }
  
  // Player with 70 chips trying to post 100 BB
  playerBalance = 70;
  const bbAmount = Math.min(bigBlind, playerBalance);
  playerBalance -= bbAmount;
  
  if (bbAmount === 70 && playerBalance === 0) {
    console.log('✅ PASS: Player posts partial blind (70 instead of 100) and goes all-in');
  } else {
    console.log(`❌ FAIL: Expected bbAmount=70, balance=0, got bbAmount=${bbAmount}, balance=${playerBalance}`);
    process.exit(1);
  }
}

console.log('\n🎉 All tests passed! Zero balance players will be marked as OUT.\n');
