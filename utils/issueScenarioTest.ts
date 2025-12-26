/**
 * Test for the specific scenario from the issue
 * 
 * Scenario from issue:
 * - Player1 goes all-in with 10k chips
 * - Player2 calls 10k
 * - Player3 raises to 30k
 * - Player4 calls 30k
 * - Player2 folds after calling the initial 10k
 * 
 * Expected:
 * - Main pot: 10k × 4 = 40k (Players 1, 2, 3, 4 contributed)
 * - Side pot: 20k × 2 = 40k (Players 3 and 4 only, as 10k from each already went to main pot)
 * - Player1 can only win main pot
 * - Player3 and Player4 can win both pots
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

console.log('=== Testing Issue Scenario ===\n');

console.log('--- Scenario: Player1 all-in 10k, Player2 calls then folds, Player3 raises to 30k, Player4 calls 30k ---');

// Player contributions:
// P1: 10k (all-in, eligible)
// P2: 10k (folded, NOT eligible)
// P3: 30k (eligible)
// P4: 30k (eligible)
const playerBets: PlayerBetInfo[] = [
  { playerId: 'p1', totalBet: 10000, isEligible: true },   // all-in at 10k
  { playerId: 'p2', totalBet: 10000, isEligible: false },  // called 10k but then folded
  { playerId: 'p3', totalBet: 30000, isEligible: true },   // raised to 30k
  { playerId: 'p4', totalBet: 30000, isEligible: true },   // called 30k
];

const totalPot = 10000 + 10000 + 30000 + 30000; // 80k total
const pots = calculateSidePots(playerBets, totalPot);

console.log('Calculated pots:', JSON.stringify(pots, null, 2));
console.log('');

// Expected:
// Main pot: 10k × 4 players = 40k (but P2 is not eligible since folded)
// Actually, since P2 is not eligible, the main pot should still include P2's money
// but P2 cannot win it. The main pot is where all 4 players contributed up to P1's all-in amount.
// Side pot: 20k × 2 players (P3 and P4) = 40k

// Let's verify:
// Layer 1: 10k from each of 4 players = 40k (eligible: P1, P3, P4 - NOT P2 as they folded)
// Layer 2: 20k from P3 and P4 = 40k (eligible: P3, P4)

assert(pots.length === 2, `Should have 2 pots, got ${pots.length}`);

// Main pot: 40k with P1, P3, P4 eligible (P2 folded so not eligible)
assert(pots[0].amount === 40000, `Main pot should be 40000, got ${pots[0].amount}`);
assert(pots[0].eligiblePlayerIds.length === 3, `Main pot should have 3 eligible players (P1, P3, P4), got ${pots[0].eligiblePlayerIds.length}`);
assert(pots[0].eligiblePlayerIds.includes('p1'), 'P1 should be eligible for main pot');
assert(!pots[0].eligiblePlayerIds.includes('p2'), 'P2 should NOT be eligible for main pot (folded)');
assert(pots[0].eligiblePlayerIds.includes('p3'), 'P3 should be eligible for main pot');
assert(pots[0].eligiblePlayerIds.includes('p4'), 'P4 should be eligible for main pot');

// Side pot: 40k with only P3 and P4 eligible
assert(pots[1].amount === 40000, `Side pot should be 40000, got ${pots[1].amount}`);
assert(pots[1].eligiblePlayerIds.length === 2, `Side pot should have 2 eligible players (P3, P4), got ${pots[1].eligiblePlayerIds.length}`);
assert(!pots[1].eligiblePlayerIds.includes('p1'), 'P1 should NOT be eligible for side pot (all-in at 10k)');
assert(!pots[1].eligiblePlayerIds.includes('p2'), 'P2 should NOT be eligible for side pot (folded)');
assert(pots[1].eligiblePlayerIds.includes('p3'), 'P3 should be eligible for side pot');
assert(pots[1].eligiblePlayerIds.includes('p4'), 'P4 should be eligible for side pot');

console.log('\n✅ All issue scenario tests passed!');
console.log('\nSummary:');
console.log('- Main pot: 40k (P1, P3, P4 can win)');
console.log('- Side pot: 40k (P3, P4 can win)');
console.log('- P1 can only win main pot');
console.log('- P2 cannot win any pot (folded)');
console.log('- P3 and P4 can win both pots');
