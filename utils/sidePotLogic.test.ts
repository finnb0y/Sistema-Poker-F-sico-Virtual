/**
 * Side Pot Logic Tests
 * 
 * Manual test cases for side pot calculation.
 * Run these tests with: npx tsx utils/sidePotLogic.test.ts
 */

import { calculateSidePots, PlayerBetInfo } from './sidePotLogic';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

function testSimpleAllIn() {
  console.log('\n--- Test 1: Simple All-In Scenario ---');
  // Player 1: 1000 chips, bets 1000 (all-in)
  // Player 2: 2000 chips, calls 1000
  // Player 3: 500 chips, calls 500 (all-in)
  
  const playerBets: PlayerBetInfo[] = [
    { playerId: 'p1', totalBet: 1000, isEligible: true },
    { playerId: 'p2', totalBet: 1000, isEligible: true },
    { playerId: 'p3', totalBet: 500, isEligible: true },
  ];
  
  const currentPot = 2500; // Total: 1000 + 1000 + 500
  const pots = calculateSidePots(playerBets, currentPot);
  
  console.log('Pots:', JSON.stringify(pots, null, 2));
  
  assert(pots.length === 2, 'Should have 2 pots (main pot + side pot)');
  
  // Main pot: All 3 players contributed 500 each = 1500
  assert(pots[0].amount === 1500, 'Main pot should be 1500');
  assert(pots[0].eligiblePlayerIds.length === 3, 'Main pot should have 3 eligible players');
  
  // Side pot: P1 and P2 contributed 500 each additional = 1000
  assert(pots[1].amount === 1000, 'Side pot should be 1000');
  assert(pots[1].eligiblePlayerIds.length === 2, 'Side pot should have 2 eligible players');
  assert(!pots[1].eligiblePlayerIds.includes('p3'), 'P3 should not be eligible for side pot');
}

function testMultipleAllIns() {
  console.log('\n--- Test 2: Multiple All-Ins with Different Stacks ---');
  // Scenario from problem statement:
  // Initial pot: 2000 (antes/blinds)
  // P1: all-in 10000
  // P2: calls 10000 (has 15000)
  // P3: all-in 5000
  // P4: calls 10000 (has 50000)
  
  const playerBets: PlayerBetInfo[] = [
    { playerId: 'p1', totalBet: 10000, isEligible: true },
    { playerId: 'p2', totalBet: 10000, isEligible: true },
    { playerId: 'p3', totalBet: 5000, isEligible: true },
    { playerId: 'p4', totalBet: 10000, isEligible: true },
  ];
  
  const currentPot = 10000 + 10000 + 5000 + 10000; // 35000 (bets only, initial pot would be separate)
  const pots = calculateSidePots(playerBets, currentPot);
  
  console.log('Pots:', JSON.stringify(pots, null, 2));
  
  assert(pots.length === 2, 'Should have 2 pots');
  
  // Main pot: All 4 players contributed 5000 each = 20000
  assert(pots[0].amount === 20000, `Main pot should be 20000, got ${pots[0].amount}`);
  assert(pots[0].eligiblePlayerIds.length === 4, 'Main pot should have 4 eligible players');
  
  // Side pot: P1, P2, P4 contributed 5000 each additional = 15000
  assert(pots[1].amount === 15000, `Side pot should be 15000, got ${pots[1].amount}`);
  assert(pots[1].eligiblePlayerIds.length === 3, 'Side pot should have 3 eligible players');
  assert(!pots[1].eligiblePlayerIds.includes('p3'), 'P3 should not be eligible for side pot');
}

function testWithFoldedPlayer() {
  console.log('\n--- Test 3: With Folded Player ---');
  // P1: 500 chips (folded after betting)
  // P2: 2000 chips (all-in)
  // P3: 2000 chips (calls)
  
  const playerBets: PlayerBetInfo[] = [
    { playerId: 'p1', totalBet: 500, isEligible: false }, // folded
    { playerId: 'p2', totalBet: 2000, isEligible: true },
    { playerId: 'p3', totalBet: 2000, isEligible: true },
  ];
  
  const currentPot = 500 + 2000 + 2000; // 4500
  const pots = calculateSidePots(playerBets, currentPot);
  
  console.log('Pots:', JSON.stringify(pots, null, 2));
  
  // Expected behavior: P1's 500 stays in the pot but creates a layer
  // Pot 1: 500 × 3 players = 1500 (only P2 and P3 eligible)
  // Pot 2: 1500 × 2 players = 3000 (only P2 and P3 eligible)
  // Total: 4500
  assert(pots.length === 2, `Should have 2 pots (P1 folded creates a layer), got ${pots.length}`);
  assert(pots[0].amount === 1500, `First pot should be 1500, got ${pots[0].amount}`);
  assert(pots[0].eligiblePlayerIds.length === 2, 'First pot should have 2 eligible players');
  assert(!pots[0].eligiblePlayerIds.includes('p1'), 'P1 should not be eligible');
  assert(pots[1].amount === 3000, `Second pot should be 3000, got ${pots[1].amount}`);
  assert(pots[1].eligiblePlayerIds.length === 2, 'Second pot should have 2 eligible players');
  
  // Verify total amount is correct
  const total = pots.reduce((sum, pot) => sum + pot.amount, 0);
  assert(total === currentPot, `Total should be ${currentPot}, got ${total}`);
}

function testHeadsUpAllIn() {
  console.log('\n--- Test 4: Heads-Up All-In ---');
  // P1: 500 chips (all-in)
  // P2: 1000 chips (calls 500)
  
  const playerBets: PlayerBetInfo[] = [
    { playerId: 'p1', totalBet: 500, isEligible: true },
    { playerId: 'p2', totalBet: 500, isEligible: true },
  ];
  
  const currentPot = 1000;
  const pots = calculateSidePots(playerBets, currentPot);
  
  console.log('Pots:', JSON.stringify(pots, null, 2));
  
  assert(pots.length === 1, 'Should have 1 pot');
  assert(pots[0].amount === 1000, 'Pot should be 1000');
  assert(pots[0].eligiblePlayerIds.length === 2, 'Both players eligible');
}

// Run all tests
console.log('=== Running Side Pot Logic Tests ===');

try {
  testSimpleAllIn();
  testMultipleAllIns();
  testWithFoldedPlayer();
  testHeadsUpAllIn();
  
  console.log('\n✅ All tests passed!');
} catch (error) {
  console.error('\n❌ Test failed with error:', error);
  process.exit(1);
}
