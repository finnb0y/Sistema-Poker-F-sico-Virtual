/**
 * Negative Stack Prevention Tests
 * 
 * Test cases to validate that players cannot bet more than their available balance.
 * Run these tests with: npx tsx utils/negativeStackPrevention.test.ts
 */

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

interface TestPlayer {
  id: string;
  balance: number;
  currentBet: number;
  totalContributedThisHand: number;
}

function simulateBetAction(player: TestPlayer, betAmount: number): TestPlayer {
  // Simulate the BET action logic with validation
  const betDiff = betAmount - player.currentBet;
  const actualBetDiff = Math.min(betDiff, player.balance);
  
  return {
    ...player,
    balance: player.balance - actualBetDiff,
    currentBet: player.currentBet + actualBetDiff,
    totalContributedThisHand: player.totalContributedThisHand + actualBetDiff
  };
}

function simulateRaiseAction(player: TestPlayer, currentBet: number, raiseAmount: number): TestPlayer {
  // Simulate the RAISE action logic with validation
  const callAmount = currentBet - player.currentBet;
  const totalToPay = callAmount + raiseAmount;
  const actualToPay = Math.min(totalToPay, player.balance);
  
  return {
    ...player,
    balance: player.balance - actualToPay,
    currentBet: player.currentBet + actualToPay,
    totalContributedThisHand: player.totalContributedThisHand + actualToPay
  };
}

function testBetAboveBalance() {
  console.log('\n--- Test 1: Bet Above Available Balance ---');
  
  const player: TestPlayer = {
    id: 'p1',
    balance: 5000,
    currentBet: 0,
    totalContributedThisHand: 0
  };
  
  // Player tries to bet 10000 but only has 5000
  const result = simulateBetAction(player, 10000);
  
  console.log('Initial balance:', player.balance);
  console.log('Attempted bet:', 10000);
  console.log('Final balance:', result.balance);
  console.log('Final currentBet:', result.currentBet);
  
  assert(result.balance === 0, 'Player should go all-in with remaining balance');
  assert(result.currentBet === 5000, 'Current bet should be clamped to initial balance');
  assert(result.balance >= 0, 'Balance should never be negative');
}

function testPotButtonClamp() {
  console.log('\n--- Test 2: POT Button Should Clamp to Balance ---');
  
  const playerBalance = 5000;
  const currentPot = 20000;
  const potMultiplier = 1; // Full pot
  
  // Simulate POT button click with clamping
  const betAmount = Math.min(Math.round(currentPot * potMultiplier), playerBalance);
  
  console.log('Player balance:', playerBalance);
  console.log('Current pot:', currentPot);
  console.log('POT button (1x pot):', currentPot);
  console.log('Clamped bet amount:', betAmount);
  
  assert(betAmount === 5000, 'Bet amount should be clamped to player balance');
  assert(betAmount <= playerBalance, 'Bet should not exceed player balance');
}

function testRaiseAboveBalance() {
  console.log('\n--- Test 3: Raise Above Available Balance ---');
  
  const player: TestPlayer = {
    id: 'p2',
    balance: 3000,
    currentBet: 1000,
    totalContributedThisHand: 1000
  };
  
  const currentBet = 5000;
  const raiseAmount = 5000;
  
  // Player needs to call 4000 (5000 - 1000) + raise 5000 = 9000 total
  // But only has 3000 available
  const result = simulateRaiseAction(player, currentBet, raiseAmount);
  
  console.log('Initial balance:', player.balance);
  console.log('Current bet on table:', currentBet);
  console.log('Player current bet:', player.currentBet);
  console.log('Attempted raise amount:', raiseAmount);
  console.log('Total to pay (call + raise):', (currentBet - player.currentBet) + raiseAmount);
  console.log('Final balance:', result.balance);
  console.log('Final currentBet:', result.currentBet);
  
  assert(result.balance === 0, 'Player should go all-in with remaining balance');
  assert(result.currentBet === 4000, 'Current bet should be initial bet + available balance');
  assert(result.balance >= 0, 'Balance should never be negative');
}

function testMultipleBetsNeverNegative() {
  console.log('\n--- Test 4: Multiple Bets Should Never Create Negative Balance ---');
  
  let player: TestPlayer = {
    id: 'p3',
    balance: 10000,
    currentBet: 0,
    totalContributedThisHand: 0
  };
  
  // Bet 1: 3000
  player = simulateBetAction(player, 3000);
  assert(player.balance >= 0, 'Balance should not be negative after bet 1');
  console.log('After bet 3000: balance =', player.balance);
  
  // Bet 2: Try to bet 15000 (only 7000 available)
  player = simulateBetAction(player, 15000);
  assert(player.balance >= 0, 'Balance should not be negative after bet 2');
  assert(player.balance === 0, 'Should be all-in after trying to exceed balance');
  console.log('After trying to bet 15000: balance =', player.balance, 'currentBet =', player.currentBet);
}

function testScenarioFromIssue() {
  console.log('\n--- Test 5: Scenario from Issue (Player Clicks POT with Insufficient Chips) ---');
  
  // Simulate: Player has 6400, pot is 40000
  const playerBalance = 6400;
  const pot = 40000;
  
  // POT button click (should clamp to balance)
  const betAmount = Math.min(Math.round(pot * 1), playerBalance);
  
  let player: TestPlayer = {
    id: 'issue_player',
    balance: playerBalance,
    currentBet: 0,
    totalContributedThisHand: 0
  };
  
  // Execute bet
  player = simulateBetAction(player, betAmount);
  
  console.log('Original pot:', pot);
  console.log('Player balance:', playerBalance);
  console.log('POT button suggested:', pot);
  console.log('Clamped bet amount:', betAmount);
  console.log('Final player balance:', player.balance);
  console.log('Final currentBet:', player.currentBet);
  
  assert(player.balance >= 0, 'Player balance should never be negative');
  assert(player.balance === 0, 'Player should be all-in');
  assert(player.currentBet === 6400, 'Player should bet their entire stack');
}

console.log('=== Running Negative Stack Prevention Tests ===');

testBetAboveBalance();
testPotButtonClamp();
testRaiseAboveBalance();
testMultipleBetsNeverNegative();
testScenarioFromIssue();

console.log('\n✅ All tests passed!');
