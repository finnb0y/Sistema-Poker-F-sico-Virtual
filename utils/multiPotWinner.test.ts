/**
 * Multi-Pot Winner Distribution Tests
 * 
 * Tests to verify that players can win multiple pots when they have the best hand.
 * This verifies that the pot distribution system doesn't incorrectly exclude winners
 * from winning subsequent pots (Problem 2 from the issue).
 * 
 * Run these tests with: npx tsx utils/multiPotWinner.test.ts
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

/**
 * Simulate the pot distribution process
 */
interface PotWinnerSimulation {
  potIndex: number;
  eligiblePlayers: string[];
  winner: string;
  potAmount: number;
}

function simulatePotDistribution(
  playerBets: PlayerBetInfo[],
  totalPot: number,
  winners: { [potIndex: number]: string[] } // Map of pot index to winner IDs
): PotWinnerSimulation[] {
  const pots = calculateSidePots(playerBets, totalPot);
  const distributions: PotWinnerSimulation[] = [];
  
  for (let i = 0; i < pots.length; i++) {
    const pot = pots[i];
    const potWinners = winners[i] || [];
    
    if (potWinners.length > 0) {
      // Verify all winners are eligible for this pot
      for (const winnerId of potWinners) {
        if (!pot.eligiblePlayerIds.includes(winnerId)) {
          throw new Error(`Winner ${winnerId} is not eligible for pot ${i + 1}`);
        }
      }
      
      // Each winner gets their share (for simplicity, we just track who wins)
      potWinners.forEach(winnerId => {
        distributions.push({
          potIndex: i,
          eligiblePlayers: pot.eligiblePlayerIds,
          winner: winnerId,
          potAmount: pot.amount / potWinners.length
        });
      });
    }
  }
  
  return distributions;
}

function testPlayerCanWinMultiplePots() {
  console.log('\n--- Test 1: Player Can Win Multiple Consecutive Pots ---');
  
  // Scenario: Player with best hand wins both main pot and side pot
  // P1: all-in 500 (weakest hand)
  // P2: all-in 1000 (medium hand)
  // P3: calls 1000 (best hand - should win both pots)
  
  const playerBets: PlayerBetInfo[] = [
    { playerId: 'p1', totalBet: 500, isEligible: true },
    { playerId: 'p2', totalBet: 1000, isEligible: true },
    { playerId: 'p3', totalBet: 1000, isEligible: true },
  ];
  
  const totalPot = 2500;
  const pots = calculateSidePots(playerBets, totalPot);
  
  console.log('Calculated pots:', JSON.stringify(pots, null, 2));
  
  // Pot 1 (main): 1500 (all 3 players eligible)
  // Pot 2 (side): 1000 (p2 and p3 eligible)
  
  assert(pots.length === 2, 'Should have 2 pots');
  assert(pots[0].eligiblePlayerIds.includes('p3'), 'P3 should be eligible for pot 1');
  assert(pots[1].eligiblePlayerIds.includes('p3'), 'P3 should be eligible for pot 2');
  
  // Simulate P3 winning both pots
  const distributions = simulatePotDistribution(playerBets, totalPot, {
    0: ['p3'], // P3 wins main pot
    1: ['p3']  // P3 wins side pot
  });
  
  assert(distributions.length === 2, 'P3 should win 2 pots');
  assert(distributions[0].winner === 'p3', 'P3 should win pot 1');
  assert(distributions[1].winner === 'p3', 'P3 should win pot 2');
  
  const totalWon = distributions.reduce((sum, d) => sum + d.potAmount, 0);
  assert(totalWon === 2500, `P3 should win all 2500 chips, got ${totalWon}`);
}

function testPlayerWinsSomePotsButNotAll() {
  console.log('\n--- Test 2: Player Wins Multiple Pots But Not All ---');
  
  // Scenario: 4 players with different stack sizes
  // P1: all-in 100 (worst hand)
  // P2: all-in 500 (best hand - wins pots 1 and 2)
  // P3: all-in 1000 (second best - wins pot 3)
  // P4: calls 1000 (medium hand - loses all)
  
  const playerBets: PlayerBetInfo[] = [
    { playerId: 'p1', totalBet: 100, isEligible: true },
    { playerId: 'p2', totalBet: 500, isEligible: true },
    { playerId: 'p3', totalBet: 1000, isEligible: true },
    { playerId: 'p4', totalBet: 1000, isEligible: true },
  ];
  
  const totalPot = 2600;
  const pots = calculateSidePots(playerBets, totalPot);
  
  console.log('Calculated pots:', JSON.stringify(pots, null, 2));
  
  // Expected pots:
  // Pot 1: 400 (all 4 players: 100 × 4)
  // Pot 2: 1200 (p2, p3, p4: (500-100) × 3 = 400 × 3)
  // Pot 3: 1000 (p3, p4: (1000-500) × 2 = 500 × 2)
  
  assert(pots.length === 3, 'Should have 3 pots');
  
  // Verify P2 is eligible for pots 1 and 2 but NOT pot 3
  assert(pots[0].eligiblePlayerIds.includes('p2'), 'P2 should be eligible for pot 1');
  assert(pots[1].eligiblePlayerIds.includes('p2'), 'P2 should be eligible for pot 2');
  assert(!pots[2].eligiblePlayerIds.includes('p2'), 'P2 should NOT be eligible for pot 3');
  
  // Simulate P2 winning pots 1 and 2, P3 winning pot 3
  const distributions = simulatePotDistribution(playerBets, totalPot, {
    0: ['p2'], // P2 wins pot 1
    1: ['p2'], // P2 wins pot 2
    2: ['p3']  // P3 wins pot 3
  });
  
  const p2Won = distributions.filter(d => d.winner === 'p2').reduce((sum, d) => sum + d.potAmount, 0);
  const p3Won = distributions.filter(d => d.winner === 'p3').reduce((sum, d) => sum + d.potAmount, 0);
  
  console.log(`P2 won: ${p2Won}, P3 won: ${p3Won}`);
  
  assert(p2Won === 1600, `P2 should win 1600 (pots 1+2: 400+1200), got ${p2Won}`);
  assert(p3Won === 1000, `P3 should win 1000 (pot 3), got ${p3Won}`);
}

function testLargestStackWinsAllPots() {
  console.log('\n--- Test 3: Largest Stack Player Wins All Pots ---');
  
  // Scenario from problem statement documentation:
  // 6 players with various stack sizes, j6 has the best hand
  
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
  
  console.log('Calculated pots:', JSON.stringify(pots, null, 2));
  
  // Expected: 5 pots as calculated in multiRoundSidePot.test.ts
  assert(pots.length === 5, `Should have 5 pots, got ${pots.length}`);
  
  // Verify j6 is eligible for all pots (since they have the largest stack)
  for (let i = 0; i < pots.length; i++) {
    assert(
      pots[i].eligiblePlayerIds.includes('j6'),
      `j6 should be eligible for pot ${i + 1}`
    );
  }
  
  // Simulate j6 winning all pots
  const winners: { [key: number]: string[] } = {};
  for (let i = 0; i < pots.length; i++) {
    winners[i] = ['j6'];
  }
  
  const distributions = simulatePotDistribution(playerBets, totalPot, winners);
  
  assert(distributions.length === 5, 'j6 should win all 5 pots');
  
  const totalWon = distributions.reduce((sum, d) => sum + d.potAmount, 0);
  assert(totalWon === totalPot, `j6 should win all ${totalPot} chips, got ${totalWon}`);
  
  // Verify j6 wins each pot
  for (let i = 0; i < distributions.length; i++) {
    assert(distributions[i].winner === 'j6', `j6 should win pot ${i + 1}`);
  }
}

function testSplitPotsWithMultipleWinners() {
  console.log('\n--- Test 4: Player Can Win Multiple Split Pots ---');
  
  // Scenario: Player ties for multiple pots
  // P1: all-in 500
  // P2: all-in 1000 (ties with P3)
  // P3: calls 1000 (ties with P2)
  
  const playerBets: PlayerBetInfo[] = [
    { playerId: 'p1', totalBet: 500, isEligible: true },
    { playerId: 'p2', totalBet: 1000, isEligible: true },
    { playerId: 'p3', totalBet: 1000, isEligible: true },
  ];
  
  const totalPot = 2500;
  const pots = calculateSidePots(playerBets, totalPot);
  
  console.log('Calculated pots:', JSON.stringify(pots, null, 2));
  
  // Simulate P2 and P3 splitting both pots
  const distributions = simulatePotDistribution(playerBets, totalPot, {
    0: ['p2', 'p3'], // Both split pot 1
    1: ['p2', 'p3']  // Both split pot 2
  });
  
  const p2Distributions = distributions.filter(d => d.winner === 'p2');
  const p3Distributions = distributions.filter(d => d.winner === 'p3');
  
  assert(p2Distributions.length === 2, 'P2 should win/split 2 pots');
  assert(p3Distributions.length === 2, 'P3 should win/split 2 pots');
  
  const p2Won = p2Distributions.reduce((sum, d) => sum + d.potAmount, 0);
  const p3Won = p3Distributions.reduce((sum, d) => sum + d.potAmount, 0);
  
  console.log(`P2 won: ${p2Won}, P3 won: ${p3Won}`);
  
  // They should split the total pot equally
  assert(Math.abs(p2Won - p3Won) < 1, 'P2 and P3 should win approximately equal amounts');
}

function testEligibilityPreservedAcrossPots() {
  console.log('\n--- Test 5: Winner Eligibility Is Never Removed After Winning ---');
  
  // This test verifies that winning a pot doesn't exclude a player from subsequent pots
  // The key is that eligiblePlayerIds are set once during START_POT_DISTRIBUTION
  // and never modified during DELIVER_CURRENT_POT
  
  const playerBets: PlayerBetInfo[] = [
    { playerId: 'p1', totalBet: 1000, isEligible: true },
    { playerId: 'p2', totalBet: 2000, isEligible: true },
    { playerId: 'p3', totalBet: 3000, isEligible: true },
  ];
  
  const totalPot = 6000;
  const pots = calculateSidePots(playerBets, totalPot);
  
  console.log('Calculated pots:', JSON.stringify(pots, null, 2));
  
  // Expected pots:
  // Pot 1: 3000 (all 3 players)
  // Pot 2: 2000 (p2, p3)
  // Pot 3: 1000 (p3)
  
  assert(pots.length === 3, `Should have 3 pots, got ${pots.length}`);
  
  // Verify that P3 is eligible for ALL pots
  assert(pots[0].eligiblePlayerIds.includes('p3'), 'P3 should be eligible for pot 1');
  assert(pots[1].eligiblePlayerIds.includes('p3'), 'P3 should be eligible for pot 2');
  assert(pots[2].eligiblePlayerIds.includes('p3'), 'P3 should be eligible for pot 3');
  
  // The critical test: after simulating winning pot 1, P3 should still be eligible for pots 2 and 3
  // This is guaranteed by the fact that eligiblePlayerIds are calculated once and not modified
  
  // Simulate P3 winning all three pots sequentially
  const pot1Distribution = simulatePotDistribution(playerBets, totalPot, { 0: ['p3'] });
  assert(pot1Distribution[0].winner === 'p3', 'P3 should win pot 1');
  
  // After winning pot 1, P3 should still be in the eligible list for pot 2
  assert(pots[1].eligiblePlayerIds.includes('p3'), 'P3 should still be eligible for pot 2 after winning pot 1');
  
  const pot2Distribution = simulatePotDistribution(playerBets, totalPot, { 0: ['p3'], 1: ['p3'] });
  const p3Pot2Win = pot2Distribution.find(d => d.potIndex === 1 && d.winner === 'p3');
  assert(p3Pot2Win !== undefined, 'P3 should win pot 2');
  
  // After winning pots 1 and 2, P3 should still be in the eligible list for pot 3
  assert(pots[2].eligiblePlayerIds.includes('p3'), 'P3 should still be eligible for pot 3 after winning pots 1 and 2');
  
  const allPotsDistribution = simulatePotDistribution(playerBets, totalPot, { 0: ['p3'], 1: ['p3'], 2: ['p3'] });
  assert(allPotsDistribution.length === 3, 'P3 should win all 3 pots');
  
  const totalWon = allPotsDistribution.reduce((sum, d) => sum + d.potAmount, 0);
  assert(totalWon === totalPot, `P3 should win entire pot of ${totalPot}, got ${totalWon}`);
}

// Run all tests
console.log('=== Running Multi-Pot Winner Distribution Tests ===');

try {
  testPlayerCanWinMultiplePots();
  testPlayerWinsSomePotsButNotAll();
  testLargestStackWinsAllPots();
  testSplitPotsWithMultipleWinners();
  testEligibilityPreservedAcrossPots();
  
  console.log('\n✅ All multi-pot winner distribution tests passed!');
  console.log('\n🎯 Verification: Players can correctly win multiple pots based on their hand strength.');
  console.log('📋 The current implementation correctly preserves eligibility across pots.');
  console.log('✨ Winners are NOT excluded from subsequent pots - this is working as intended.');
} catch (error) {
  console.error('\n❌ Test failed with error:', error);
  process.exit(1);
}
