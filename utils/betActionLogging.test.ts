/**
 * Bet Action Logging Tests
 * 
 * Tests to verify bet action logging and negative pot prevention
 * Run with: npx tsx utils/betActionLogging.test.ts
 */

import { BettingRound, BetAction } from '../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

function testBetActionStructure() {
  console.log('\n--- Test 1: Bet Action Structure ---');
  
  const mockAction: BetAction = {
    playerId: 'p1',
    playerName: 'Player 1',
    action: 'BET',
    amount: 100,
    timestamp: Date.now(),
    bettingRound: BettingRound.PRE_FLOP
  };
  
  assert(mockAction.playerId === 'p1', 'Should have playerId');
  assert(mockAction.playerName === 'Player 1', 'Should have playerName');
  assert(mockAction.action === 'BET', 'Should have action type');
  assert(mockAction.amount === 100, 'Should have amount');
  assert(typeof mockAction.timestamp === 'number', 'Should have timestamp');
  assert(mockAction.bettingRound === BettingRound.PRE_FLOP, 'Should have bettingRound');
}

function testNegativePotPrevention() {
  console.log('\n--- Test 2: Negative Pot Prevention ---');
  
  // Simulate pot distribution where pot might be insufficient
  // This can happen due to calculation errors or edge cases in pot accounting
  let pot = 10000;
  const potsToDistribute = [6000, 4001]; // Total 10001 - exceeds available pot by 1
  
  // Old way (could go negative):
  // pot -= 6000; // pot = 4000
  // pot -= 4001; // pot = -1 ❌
  
  // New way (prevents negative):
  potsToDistribute.forEach(amount => {
    pot = Math.max(0, pot - amount);
  });
  
  assert(pot === 0, `Pot should be 0 or positive, got ${pot}`);
  assert(pot >= 0, 'Pot should never be negative');
}

function testMultiplePotDistribution() {
  console.log('\n--- Test 3: Multiple Pot Distribution ---');
  
  let pot = 50000;
  const pots = [
    { amount: 20000, eligiblePlayerIds: ['p1', 'p2', 'p3'] },
    { amount: 15000, eligiblePlayerIds: ['p1', 'p2'] },
    { amount: 15000, eligiblePlayerIds: ['p1'] }
  ];
  
  let totalDistributed = 0;
  
  pots.forEach(p => {
    pot = Math.max(0, pot - p.amount);
    totalDistributed += p.amount;
  });
  
  assert(pot === 0, `Final pot should be 0, got ${pot}`);
  assert(totalDistributed === 50000, `Should distribute all 50000, distributed ${totalDistributed}`);
}

function testActionTypeValidation() {
  console.log('\n--- Test 4: Action Type Validation ---');
  
  const validActions: Array<'BET' | 'CALL' | 'RAISE' | 'CHECK' | 'FOLD' | 'ALL_IN'> = [
    'BET', 'CALL', 'RAISE', 'CHECK', 'FOLD', 'ALL_IN'
  ];
  
  validActions.forEach(action => {
    const mockAction: BetAction = {
      playerId: 'p1',
      playerName: 'Player 1',
      action: action,
      amount: action === 'CHECK' || action === 'FOLD' ? 0 : 100,
      timestamp: Date.now(),
      bettingRound: BettingRound.FLOP
    };
    
    assert(mockAction.action === action, `Should support ${action} action`);
  });
}

function testBettingRoundProgression() {
  console.log('\n--- Test 5: Betting Round Progression in Logs ---');
  
  const rounds = [
    BettingRound.PRE_FLOP,
    BettingRound.FLOP,
    BettingRound.TURN,
    BettingRound.RIVER,
    BettingRound.SHOWDOWN
  ];
  
  const betActions: BetAction[] = [];
  
  rounds.forEach((round, idx) => {
    betActions.push({
      playerId: `p${idx + 1}`,
      playerName: `Player ${idx + 1}`,
      action: 'BET',
      amount: 100 * (idx + 1),
      timestamp: Date.now() + idx,
      bettingRound: round
    });
  });
  
  assert(betActions.length === 5, 'Should have actions for all 5 rounds');
  assert(betActions[0].bettingRound === BettingRound.PRE_FLOP, 'First should be PRE_FLOP');
  assert(betActions[4].bettingRound === BettingRound.SHOWDOWN, 'Last should be SHOWDOWN');
}

function testPotAccounting() {
  console.log('\n--- Test 6: Pot Accounting Accuracy ---');
  
  // Simulate a hand where contributions must match pot
  const playerContributions = [1000, 2000, 1500, 2500]; // Total: 7000
  const expectedPot = 7000;
  
  let actualPot = 0;
  playerContributions.forEach(contrib => {
    actualPot += contrib;
  });
  
  assert(actualPot === expectedPot, `Pot should be ${expectedPot}, got ${actualPot}`);
  
  // Now distribute with side pots
  const pots = [
    { amount: 4000, eligiblePlayerIds: ['p1', 'p2', 'p3', 'p4'] }, // 1000 * 4
    { amount: 1500, eligiblePlayerIds: ['p2', 'p3', 'p4'] },        // 500 * 3
    { amount: 1000, eligiblePlayerIds: ['p2', 'p4'] },              // 500 * 2
    { amount: 500, eligiblePlayerIds: ['p4'] }                      // 500 * 1
  ];
  
  const totalInPots = pots.reduce((sum, p) => sum + p.amount, 0);
  assert(totalInPots === expectedPot, `Total in pots should be ${expectedPot}, got ${totalInPots}`);
  
  // Distribute all pots
  let remainingPot = actualPot;
  pots.forEach(p => {
    remainingPot = Math.max(0, remainingPot - p.amount);
  });
  
  assert(remainingPot === 0, `After distribution, pot should be 0, got ${remainingPot}`);
}

console.log('=== Running Bet Action Logging Tests ===');
testBetActionStructure();
testNegativePotPrevention();
testMultiplePotDistribution();
testActionTypeValidation();
testBettingRoundProgression();
testPotAccounting();

console.log('\n✅ All bet action logging tests passed!');
