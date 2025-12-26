/**
 * Integration Test: Complete Side-Pot Scenario from Issue
 * 
 * This test simulates the exact scenario described in the issue to verify
 * that the entire flow works correctly from betting to pot distribution.
 * 
 * Run with: npx tsx utils/integrationTestIssueSce nario.ts
 */

import { calculateSidePots, preparePlayerBetsForPotCalculation, PlayerBetInfo } from './sidePotLogic';
import { Player, PlayerStatus } from '../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('=== Integration Test: Complete Issue Scenario ===\n');

// Simulate the exact scenario from the issue
console.log('Scenario Setup:');
console.log('- Player1 goes all-in with 10k chips');
console.log('- Player2 calls 10k');
console.log('- Player3 raises to 30k');
console.log('- Player4 calls 30k');
console.log('- Player2 folds after calling the 10k\n');

// Create mock players with final state
const players: Player[] = [
  {
    id: 'p1',
    personId: 'person1',
    tournamentId: 'tourney1',
    name: 'Player 1',
    balance: 0, // went all-in
    currentBet: 10000,
    totalContributedThisHand: 10000,
    status: PlayerStatus.ALL_IN,
    tableId: 1,
    seatNumber: 2,
    accessCode: 'P1',
    rebuysCount: 0,
    hasAddon: false,
    totalInvested: 0
  },
  {
    id: 'p2',
    personId: 'person2',
    tournamentId: 'tourney1',
    name: 'Player 2',
    balance: 40000, // called 10k then folded
    currentBet: 10000,
    totalContributedThisHand: 10000,
    status: PlayerStatus.FOLDED,
    tableId: 1,
    seatNumber: 3,
    accessCode: 'P2',
    rebuysCount: 0,
    hasAddon: false,
    totalInvested: 0
  },
  {
    id: 'p3',
    personId: 'person3',
    tournamentId: 'tourney1',
    name: 'Player 3',
    balance: 20000, // raised to 30k
    currentBet: 30000,
    totalContributedThisHand: 30000,
    status: PlayerStatus.ACTIVE,
    tableId: 1,
    seatNumber: 4,
    accessCode: 'P3',
    rebuysCount: 0,
    hasAddon: false,
    totalInvested: 0
  },
  {
    id: 'p4',
    personId: 'person4',
    tournamentId: 'tourney1',
    name: 'Player 4',
    balance: 70000, // called 30k
    currentBet: 30000,
    totalContributedThisHand: 30000,
    status: PlayerStatus.ACTIVE,
    tableId: 1,
    seatNumber: 5,
    accessCode: 'P4',
    rebuysCount: 0,
    hasAddon: false,
    totalInvested: 0
  }
];

// Step 1: Prepare player bets using the helper function
console.log('\n--- Step 1: Prepare Player Bets ---');
const playerBets = preparePlayerBetsForPotCalculation(players, 1);
console.log('Player bets:', JSON.stringify(playerBets, null, 2));

assert(playerBets.length === 4, 'Should have 4 players');
assert(playerBets.find(pb => pb.playerId === 'p1')!.isEligible === true, 'P1 should be eligible');
assert(playerBets.find(pb => pb.playerId === 'p2')!.isEligible === false, 'P2 should NOT be eligible (folded)');
assert(playerBets.find(pb => pb.playerId === 'p3')!.isEligible === true, 'P3 should be eligible');
assert(playerBets.find(pb => pb.playerId === 'p4')!.isEligible === true, 'P4 should be eligible');

// Step 2: Calculate side pots
console.log('\n--- Step 2: Calculate Side Pots ---');
const totalPot = 10000 + 10000 + 30000 + 30000; // 80k
const pots = calculateSidePots(playerBets, totalPot);
console.log('Calculated pots:', JSON.stringify(pots, null, 2));

assert(pots.length === 2, `Should have 2 pots, got ${pots.length}`);

// Main pot validation
console.log('\n--- Step 3: Validate Main Pot ---');
console.log(`Main Pot: ${pots[0].amount} chips`);
console.log(`Eligible players: ${pots[0].eligiblePlayerIds.join(', ')}`);

assert(pots[0].amount === 40000, `Main pot should be 40000, got ${pots[0].amount}`);
assert(pots[0].eligiblePlayerIds.length === 3, 'Main pot should have 3 eligible players');
assert(pots[0].eligiblePlayerIds.includes('p1'), 'P1 should be eligible for main pot');
assert(!pots[0].eligiblePlayerIds.includes('p2'), 'P2 should NOT be eligible (folded)');
assert(pots[0].eligiblePlayerIds.includes('p3'), 'P3 should be eligible for main pot');
assert(pots[0].eligiblePlayerIds.includes('p4'), 'P4 should be eligible for main pot');

// Side pot validation
console.log('\n--- Step 4: Validate Side Pot ---');
console.log(`Side Pot: ${pots[1].amount} chips`);
console.log(`Eligible players: ${pots[1].eligiblePlayerIds.join(', ')}`);

assert(pots[1].amount === 40000, `Side pot should be 40000, got ${pots[1].amount}`);
assert(pots[1].eligiblePlayerIds.length === 2, 'Side pot should have 2 eligible players');
assert(!pots[1].eligiblePlayerIds.includes('p1'), 'P1 should NOT be eligible (all-in at 10k)');
assert(!pots[1].eligiblePlayerIds.includes('p2'), 'P2 should NOT be eligible (folded)');
assert(pots[1].eligiblePlayerIds.includes('p3'), 'P3 should be eligible for side pot');
assert(pots[1].eligiblePlayerIds.includes('p4'), 'P4 should be eligible for side pot');

// Step 5: Simulate showdown scenarios
console.log('\n--- Step 5: Simulate Showdown Scenarios ---');

// Scenario A: Player1 wins (has best hand but all-in)
console.log('\nScenario A: Player1 has best hand');
console.log('  - Player1 wins main pot: 40000 chips');
console.log('  - Player3 or Player4 must win side pot: 40000 chips');
console.log('  - Player2 wins nothing (folded)');

// Validate that P1 is eligible for main pot only
assert(pots[0].eligiblePlayerIds.includes('p1'), 'P1 can win main pot');
assert(!pots[1].eligiblePlayerIds.includes('p1'), 'P1 cannot win side pot');

// Scenario B: Player3 wins (has best hand and played all)
console.log('\nScenario B: Player3 has best hand');
console.log('  - Player3 wins main pot: 40000 chips');
console.log('  - Player3 wins side pot: 40000 chips');
console.log('  - Total: 80000 chips to Player3');
console.log('  - Player2 wins nothing (folded)');

// Validate that P3 is eligible for both pots
assert(pots[0].eligiblePlayerIds.includes('p3'), 'P3 can win main pot');
assert(pots[1].eligiblePlayerIds.includes('p3'), 'P3 can win side pot');

// Scenario C: Player4 wins (has best hand and played all)
console.log('\nScenario C: Player4 has best hand');
console.log('  - Player4 wins main pot: 40000 chips');
console.log('  - Player4 wins side pot: 40000 chips');
console.log('  - Total: 80000 chips to Player4');
console.log('  - Player2 wins nothing (folded)');

// Validate that P4 is eligible for both pots
assert(pots[0].eligiblePlayerIds.includes('p4'), 'P4 can win main pot');
assert(pots[1].eligiblePlayerIds.includes('p4'), 'P4 can win side pot');

// Final verification
console.log('\n--- Step 6: Final Verification ---');
const totalDistributed = pots.reduce((sum, pot) => sum + pot.amount, 0);
assert(totalDistributed === totalPot, `Total distributed (${totalDistributed}) should equal total pot (${totalPot})`);

console.log('\n✅ All integration tests passed!');
console.log('\n🎯 Summary:');
console.log('  ✓ Player bets correctly prepared from game state');
console.log('  ✓ Side pots correctly calculated with folded player contributions');
console.log('  ✓ Folded players excluded from eligibility');
console.log('  ✓ All-in players only eligible for pots they contributed to');
console.log('  ✓ Active players eligible for all pots they contributed to');
console.log('  ✓ Total pot amount correctly preserved');
console.log('\n✨ The system now correctly implements poker side-pot rules!');
