/**
 * Multi-Round Side Pot Logic Tests
 * 
 * Tests for side pot calculation with multiple betting rounds (pre-flop, flop, turn, river).
 * This tests the critical functionality of tracking totalContributedThisHand across rounds.
 * 
 * Run these tests with: npx tsx utils/multiRoundSidePot.test.ts
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

function testMultipleRoundsWithAllIns() {
  console.log('\n--- Test: Multiple Betting Rounds with All-Ins ---');
  
  // Scenario: 4 players, betting across multiple rounds
  // PRE_FLOP:
  //   - Player 1: bets 100 (goes all-in with 100 total)
  //   - Player 2: calls 100
  //   - Player 3: calls 100
  //   - Player 4: calls 100
  // FLOP:
  //   - Player 2: bets 200 (now has 300 total)
  //   - Player 3: goes all-in with 150 more (now has 250 total)
  //   - Player 4: calls 200 (now has 300 total)
  // TURN:
  //   - Player 2: bets 300 (now has 600 total)
  //   - Player 4: calls 300 (now has 600 total)
  // RIVER:
  //   - Player 2: bets 400 (now has 1000 total)
  //   - Player 4: goes all-in with 300 (now has 900 total)
  
  const playerBets: PlayerBetInfo[] = [
    { playerId: 'p1', totalBet: 100, isEligible: true },   // all-in pre-flop
    { playerId: 'p2', totalBet: 1000, isEligible: true },  // winner with most chips
    { playerId: 'p3', totalBet: 250, isEligible: true },   // all-in on flop
    { playerId: 'p4', totalBet: 900, isEligible: true },   // all-in on river
  ];
  
  const totalPot = 100 + 1000 + 250 + 900; // 2250
  const pots = calculateSidePots(playerBets, totalPot);
  
  console.log('Pots:', JSON.stringify(pots, null, 2));
  
  // Expected pots:
  // Pot 1: 100 × 4 players = 400 (all 4 players eligible)
  // Pot 2: (250 - 100) × 3 players = 150 × 3 = 450 (p2, p3, p4)
  // Pot 3: (900 - 250) × 2 players = 650 × 2 = 1300 (p2, p4)
  // Pot 4: (1000 - 900) × 1 player = 100 × 1 = 100 (p2)
  
  assert(pots.length === 4, `Should have 4 pots, got ${pots.length}`);
  
  assert(pots[0].amount === 400, `Pot 1 should be 400, got ${pots[0].amount}`);
  assert(pots[0].eligiblePlayerIds.length === 4, 'Pot 1 should have 4 eligible players');
  
  assert(pots[1].amount === 450, `Pot 2 should be 450, got ${pots[1].amount}`);
  assert(pots[1].eligiblePlayerIds.length === 3, 'Pot 2 should have 3 eligible players');
  assert(!pots[1].eligiblePlayerIds.includes('p1'), 'P1 should not be eligible for pot 2');
  
  assert(pots[2].amount === 1300, `Pot 3 should be 1300, got ${pots[2].amount}`);
  assert(pots[2].eligiblePlayerIds.length === 2, 'Pot 3 should have 2 eligible players');
  assert(!pots[2].eligiblePlayerIds.includes('p1'), 'P1 should not be eligible for pot 3');
  assert(!pots[2].eligiblePlayerIds.includes('p3'), 'P3 should not be eligible for pot 3');
  
  assert(pots[3].amount === 100, `Pot 4 should be 100, got ${pots[3].amount}`);
  assert(pots[3].eligiblePlayerIds.length === 1, 'Pot 4 should have 1 eligible player');
  assert(pots[3].eligiblePlayerIds.includes('p2'), 'Only P2 should be eligible for pot 4');
  
  // Verify total
  const totalCalculated = pots.reduce((sum, pot) => sum + pot.amount, 0);
  assert(totalCalculated === totalPot, `Total should match: ${totalCalculated} === ${totalPot}`);
}

function testProblemStatementExample() {
  console.log('\n--- Test: Problem Statement Example (6 players) ---');
  
  // Example from the problem statement
  const playerBets: PlayerBetInfo[] = [
    { playerId: 'j1', totalBet: 10000, isEligible: true },
    { playerId: 'j2', totalBet: 20000, isEligible: true },
    { playerId: 'j3', totalBet: 5000, isEligible: true },
    { playerId: 'j4', totalBet: 20000, isEligible: true },
    { playerId: 'j6', totalBet: 40000, isEligible: true },
    { playerId: 'j8', totalBet: 500, isEligible: true },
  ];
  
  const totalPot = 95500;
  const pots = calculateSidePots(playerBets, totalPot);
  
  console.log('Pots:', JSON.stringify(pots, null, 2));
  
  // Expected from problem statement:
  // 1. 3000 (500 × 6) - all 6 players
  // 2. 22500 ((5000-500) × 5) - j1, j2, j3, j4, j6
  // 3. 20000 ((10000-5000) × 4) - j1, j2, j4, j6
  // 4. 30000 ((20000-10000) × 3) - j2, j4, j6
  // 5. 20000 ((40000-20000) × 1) - j6
  
  assert(pots.length === 5, `Should have 5 pots, got ${pots.length}`);
  
  assert(pots[0].amount === 3000, `Pot 1 should be 3000, got ${pots[0].amount}`);
  assert(pots[0].eligiblePlayerIds.length === 6, 'Pot 1 should have 6 eligible players');
  
  assert(pots[1].amount === 22500, `Pot 2 should be 22500, got ${pots[1].amount}`);
  assert(pots[1].eligiblePlayerIds.length === 5, 'Pot 2 should have 5 eligible players');
  
  assert(pots[2].amount === 20000, `Pot 3 should be 20000, got ${pots[2].amount}`);
  assert(pots[2].eligiblePlayerIds.length === 4, 'Pot 3 should have 4 eligible players');
  
  assert(pots[3].amount === 30000, `Pot 4 should be 30000, got ${pots[3].amount}`);
  assert(pots[3].eligiblePlayerIds.length === 3, 'Pot 4 should have 3 eligible players');
  
  assert(pots[4].amount === 20000, `Pot 5 should be 20000, got ${pots[4].amount}`);
  assert(pots[4].eligiblePlayerIds.length === 1, 'Pot 5 should have 1 eligible player');
  assert(pots[4].eligiblePlayerIds[0] === 'j6', 'Only j6 should be eligible for pot 5');
  
  // Verify total
  const totalCalculated = pots.reduce((sum, pot) => sum + pot.amount, 0);
  assert(totalCalculated === totalPot, `Total should match: ${totalCalculated} === ${totalPot}`);
}

function testOrderIndependence() {
  console.log('\n--- Test: Order Independence ---');
  
  // Test that the order of all-ins doesn't affect the result
  // Same scenario, different order in the array
  const scenario1: PlayerBetInfo[] = [
    { playerId: 'p1', totalBet: 500, isEligible: true },
    { playerId: 'p2', totalBet: 1000, isEligible: true },
    { playerId: 'p3', totalBet: 2000, isEligible: true },
  ];
  
  const scenario2: PlayerBetInfo[] = [
    { playerId: 'p3', totalBet: 2000, isEligible: true },
    { playerId: 'p1', totalBet: 500, isEligible: true },
    { playerId: 'p2', totalBet: 1000, isEligible: true },
  ];
  
  const totalPot = 3500;
  const pots1 = calculateSidePots(scenario1, totalPot);
  const pots2 = calculateSidePots(scenario2, totalPot);
  
  console.log('Scenario 1 pots:', JSON.stringify(pots1, null, 2));
  console.log('Scenario 2 pots:', JSON.stringify(pots2, null, 2));
  
  assert(pots1.length === pots2.length, 'Both scenarios should produce same number of pots');
  
  for (let i = 0; i < pots1.length; i++) {
    assert(pots1[i].amount === pots2[i].amount, 
      `Pot ${i + 1} amounts should match: ${pots1[i].amount} === ${pots2[i].amount}`);
    assert(pots1[i].eligiblePlayerIds.length === pots2[i].eligiblePlayerIds.length,
      `Pot ${i + 1} eligible player counts should match`);
  }
}

// Run all tests
console.log('=== Running Multi-Round Side Pot Logic Tests ===');

try {
  testMultipleRoundsWithAllIns();
  testProblemStatementExample();
  testOrderIndependence();
  
  console.log('\n✅ All multi-round tests passed!');
} catch (error) {
  console.error('\n❌ Test failed with error:', error);
  process.exit(1);
}
