/**
 * Additional Edge Case Tests for Side-Pot Logic
 * 
 * Tests for complex scenarios including:
 * - Multiple folds at different stages
 * - River all-in with side pot resolution
 * - Multiple all-ins with some players folding
 * 
 * Run these tests with: npx tsx utils/additionalSidePotTests.ts
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

function testRiverAllInAfterSidePot() {
  console.log('\n--- Test: River All-In After Side Pot Established ---');
  
  // Scenario from issue:
  // - Earlier rounds: P1 went all-in 10k, P3 raised to 30k, P4 called 30k
  // - River: P4 goes all-in for additional 20k, P3 folds
  // - P1 is still in (all-in from earlier)
  
  // Final contributions:
  // P1: 10k (all-in, eligible)
  // P3: 30k (folded on river, NOT eligible)
  // P4: 50k (eligible)
  
  const playerBets: PlayerBetInfo[] = [
    { playerId: 'p1', totalBet: 10000, isEligible: true },
    { playerId: 'p3', totalBet: 30000, isEligible: false }, // folded on river
    { playerId: 'p4', totalBet: 50000, isEligible: true },
  ];
  
  const totalPot = 90000;
  const pots = calculateSidePots(playerBets, totalPot);
  
  console.log('Calculated pots:', JSON.stringify(pots, null, 2));
  
  // Expected:
  // Pot 1: 10k × 3 = 30k (P1, P4 eligible)
  // Pot 2: 20k × 2 = 40k (P4 only eligible, since P3 folded)
  // Pot 3: 20k × 1 = 20k (P4 only eligible)
  
  assert(pots.length === 3, `Should have 3 pots, got ${pots.length}`);
  
  assert(pots[0].amount === 30000, `Pot 1 should be 30000, got ${pots[0].amount}`);
  assert(pots[0].eligiblePlayerIds.length === 2, `Pot 1 should have 2 eligible (P1, P4), got ${pots[0].eligiblePlayerIds.length}`);
  assert(pots[0].eligiblePlayerIds.includes('p1'), 'P1 should be eligible for pot 1');
  assert(pots[0].eligiblePlayerIds.includes('p4'), 'P4 should be eligible for pot 1');
  assert(!pots[0].eligiblePlayerIds.includes('p3'), 'P3 should NOT be eligible (folded)');
  
  assert(pots[1].amount === 40000, `Pot 2 should be 40000, got ${pots[1].amount}`);
  assert(pots[1].eligiblePlayerIds.length === 1, `Pot 2 should have 1 eligible (P4), got ${pots[1].eligiblePlayerIds.length}`);
  assert(pots[1].eligiblePlayerIds.includes('p4'), 'P4 should be eligible for pot 2');
  
  assert(pots[2].amount === 20000, `Pot 3 should be 20000, got ${pots[2].amount}`);
  assert(pots[2].eligiblePlayerIds.length === 1, `Pot 3 should have 1 eligible (P4), got ${pots[2].eligiblePlayerIds.length}`);
  assert(pots[2].eligiblePlayerIds.includes('p4'), 'P4 should be eligible for pot 3');
  
  console.log('\nResult: P4 wins pots 2 and 3 automatically (only eligible player)');
  console.log('Main pot goes to showdown between P1 and P4');
}

function testMultipleFoldsAtDifferentLevels() {
  console.log('\n--- Test: Multiple Players Folding at Different Levels ---');
  
  // Complex scenario:
  // P1: all-in 5k
  // P2: calls 10k, then folds
  // P3: calls 15k, then folds
  // P4: raises to 20k (active)
  // P5: calls 20k (active)
  
  const playerBets: PlayerBetInfo[] = [
    { playerId: 'p1', totalBet: 5000, isEligible: true },
    { playerId: 'p2', totalBet: 10000, isEligible: false },
    { playerId: 'p3', totalBet: 15000, isEligible: false },
    { playerId: 'p4', totalBet: 20000, isEligible: true },
    { playerId: 'p5', totalBet: 20000, isEligible: true },
  ];
  
  const totalPot = 70000;
  const pots = calculateSidePots(playerBets, totalPot);
  
  console.log('Calculated pots:', JSON.stringify(pots, null, 2));
  
  // Expected:
  // Pot 1: 5k × 5 = 25k (P1, P4, P5 eligible)
  // Pot 2: 5k × 4 = 20k (P4, P5 eligible)
  // Pot 3: 5k × 3 = 15k (P4, P5 eligible)
  // Pot 4: 5k × 2 = 10k (P4, P5 eligible)
  
  assert(pots.length === 4, `Should have 4 pots, got ${pots.length}`);
  
  assert(pots[0].amount === 25000, `Pot 1 should be 25000, got ${pots[0].amount}`);
  assert(pots[0].eligiblePlayerIds.length === 3, 'Pot 1 should have 3 eligible');
  assert(pots[0].eligiblePlayerIds.includes('p1'), 'P1 eligible for pot 1');
  assert(pots[0].eligiblePlayerIds.includes('p4'), 'P4 eligible for pot 1');
  assert(pots[0].eligiblePlayerIds.includes('p5'), 'P5 eligible for pot 1');
  
  // Pots 2, 3, 4 should only have P4 and P5 as eligible
  for (let i = 1; i < 4; i++) {
    assert(pots[i].eligiblePlayerIds.length === 2, `Pot ${i+1} should have 2 eligible`);
    assert(pots[i].eligiblePlayerIds.includes('p4'), `P4 eligible for pot ${i+1}`);
    assert(pots[i].eligiblePlayerIds.includes('p5'), `P5 eligible for pot ${i+1}`);
  }
  
  const total = pots.reduce((sum, pot) => sum + pot.amount, 0);
  assert(total === totalPot, `Total should be ${totalPot}, got ${total}`);
}

function testAllButOnePlayerFold() {
  console.log('\n--- Test: All Players Fold Except One (No Showdown) ---');
  
  // P1: bet 5k, folded
  // P2: bet 10k, folded
  // P3: bet 15k, folded
  // P4: bet 20k (only eligible player - wins by default)
  
  const playerBets: PlayerBetInfo[] = [
    { playerId: 'p1', totalBet: 5000, isEligible: false },
    { playerId: 'p2', totalBet: 10000, isEligible: false },
    { playerId: 'p3', totalBet: 15000, isEligible: false },
    { playerId: 'p4', totalBet: 20000, isEligible: true },
  ];
  
  const totalPot = 50000;
  const pots = calculateSidePots(playerBets, totalPot);
  
  console.log('Calculated pots:', JSON.stringify(pots, null, 2));
  
  // Expected:
  // All money goes to P4 since they're the only eligible player
  // Pots are still created based on bet layers, but only P4 is eligible for all
  
  assert(pots.length === 4, `Should have 4 pots, got ${pots.length}`);
  
  for (let i = 0; i < pots.length; i++) {
    assert(pots[i].eligiblePlayerIds.length === 1, `Pot ${i+1} should have 1 eligible`);
    assert(pots[i].eligiblePlayerIds.includes('p4'), `P4 should be eligible for pot ${i+1}`);
  }
  
  const total = pots.reduce((sum, pot) => sum + pot.amount, 0);
  assert(total === totalPot, `Total should be ${totalPot}, got ${total}`);
  
  console.log('\nResult: P4 wins entire pot automatically (only eligible player)');
}

function testMultipleAllInsWithOneFold() {
  console.log('\n--- Test: Multiple All-Ins with One Fold in Middle ---');
  
  // Scenario similar to issue but with one fold in the middle:
  // P1: all-in 10k
  // P2: all-in 15k
  // P3: calls 20k, then folds
  // P4: calls 20k
  // P5: calls 20k
  
  const playerBets: PlayerBetInfo[] = [
    { playerId: 'p1', totalBet: 10000, isEligible: true },
    { playerId: 'p2', totalBet: 15000, isEligible: true },
    { playerId: 'p3', totalBet: 20000, isEligible: false }, // folded
    { playerId: 'p4', totalBet: 20000, isEligible: true },
    { playerId: 'p5', totalBet: 20000, isEligible: true },
  ];
  
  const totalPot = 85000;
  const pots = calculateSidePots(playerBets, totalPot);
  
  console.log('Calculated pots:', JSON.stringify(pots, null, 2));
  
  // Expected:
  // Pot 1: 10k × 5 = 50k (P1, P2, P4, P5 eligible)
  // Pot 2: 5k × 4 = 20k (P2, P4, P5 eligible)
  // Pot 3: 5k × 3 = 15k (P4, P5 eligible)
  
  assert(pots.length === 3, `Should have 3 pots, got ${pots.length}`);
  
  assert(pots[0].amount === 50000, `Pot 1 should be 50000, got ${pots[0].amount}`);
  assert(pots[0].eligiblePlayerIds.length === 4, 'Pot 1 should have 4 eligible');
  assert(!pots[0].eligiblePlayerIds.includes('p3'), 'P3 should NOT be eligible');
  
  assert(pots[1].amount === 20000, `Pot 2 should be 20000, got ${pots[1].amount}`);
  assert(pots[1].eligiblePlayerIds.length === 3, 'Pot 2 should have 3 eligible');
  assert(!pots[1].eligiblePlayerIds.includes('p1'), 'P1 should NOT be eligible for pot 2');
  assert(!pots[1].eligiblePlayerIds.includes('p3'), 'P3 should NOT be eligible for pot 2');
  
  assert(pots[2].amount === 15000, `Pot 3 should be 15000, got ${pots[2].amount}`);
  assert(pots[2].eligiblePlayerIds.length === 2, 'Pot 3 should have 2 eligible');
  assert(pots[2].eligiblePlayerIds.includes('p4'), 'P4 eligible for pot 3');
  assert(pots[2].eligiblePlayerIds.includes('p5'), 'P5 eligible for pot 3');
  
  const total = pots.reduce((sum, pot) => sum + pot.amount, 0);
  assert(total === totalPot, `Total should be ${totalPot}, got ${total}`);
}

// Run all tests
console.log('=== Running Additional Side-Pot Edge Case Tests ===');

try {
  testRiverAllInAfterSidePot();
  testMultipleFoldsAtDifferentLevels();
  testAllButOnePlayerFold();
  testMultipleAllInsWithOneFold();
  
  console.log('\n✅ All additional edge case tests passed!');
  console.log('\n🎯 Verification: Side-pot logic correctly handles:');
  console.log('  - Folded players\' contributions remain in pots');
  console.log('  - Folded players are excluded from eligibility');
  console.log('  - Complex multi-level all-in scenarios');
  console.log('  - River betting after side-pots established');
  console.log('  - Automatic pot awards when only one player eligible');
} catch (error) {
  console.error('\n❌ Test failed with error:', error);
  process.exit(1);
}
