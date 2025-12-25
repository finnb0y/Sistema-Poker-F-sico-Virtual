/**
 * Modular Testing Environment for Poker Table Scenarios
 * 
 * This test suite provides a comprehensive environment to test and identify problems
 * in different poker table scenarios with detailed logging and automatic bug detection.
 * 
 * Run with: npx tsx utils/pokerTestEnvironment.test.ts
 */

import {
  createRebuyTournamentScenario,
  createMultipleAllInScenario,
  createHeadsUpAllInScenario,
  createTestPlayers,
  createTestTableState
} from './testScenarioBuilder';
import {
  TestLogger,
  validatePlayerCanAct,
  validateAvailableActions,
  validatePotAmount,
  validateSidePots,
  simulateBettingRound
} from './testActionLogger';
import { PlayerStatus, BettingRound } from '../types';
import { preparePlayerBetsForPotCalculation, calculateSidePots } from './sidePotLogic';

// Test result tracking
let testsPassed = 0;
let testsFailed = 0;

function runTest(name: string, testFn: () => void) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST: ${name}`);
  console.log('='.repeat(80));
  
  try {
    testFn();
    testsPassed++;
    console.log(`\n✅ TEST PASSED: ${name}\n`);
  } catch (error) {
    testsFailed++;
    console.error(`\n❌ TEST FAILED: ${name}`);
    console.error(`Error: ${error}\n`);
  }
}

/**
 * Test 1: Rebuy Tournament Scenario (from problem statement)
 * 
 * Scenario: 6 players, 2 all-in (different amounts), 2 folded, 2 active on river
 * Expected: Active players should have CHECK option available
 * Bug: System incorrectly requires bet instead of allowing check
 */
function testRebuyTournamentScenario() {
  const logger = new TestLogger();
  const scenario = createRebuyTournamentScenario();
  
  logger.info('Scenario: ' + scenario.description);
  
  // Simulate the river betting round
  simulateBettingRound(
    logger,
    scenario.players,
    scenario.tableState,
    'Rebuy Tournament - River Action'
  );
  
  // Validate active players can check on river when bet is matched
  const activePlayer1 = scenario.players.find(p => p.id === 'p5')!;
  const activePlayer2 = scenario.players.find(p => p.id === 'p6')!;
  
  // Both active players have matched the current bet, so they should be able to check
  validateAvailableActions(
    logger,
    activePlayer1,
    scenario.tableState,
    ['CHECK', 'BET', 'FOLD']
  );
  
  validateAvailableActions(
    logger,
    activePlayer2,
    scenario.tableState,
    ['CHECK', 'BET', 'FOLD']
  );
  
  // Validate pot amount
  const expectedPot = 150 + 10000 + 5000 + 100 + 50 + 10000 + 10000;
  validatePotAmount(logger, scenario.tableState.pot, expectedPot);
  
  // Validate side pots
  validateSidePots(logger, scenario.players, scenario.tableState, 2, calculateSidePots, preparePlayerBetsForPotCalculation);
  
  logger.printLogs();
  
  const summary = logger.getSummary();
  if (summary.bugsFound > 0 || summary.failedValidations > 0) {
    throw new Error(`Found ${summary.bugsFound} bugs and ${summary.failedValidations} validation failures`);
  }
}

/**
 * Test 2: Multiple All-In with Side Pots
 * 
 * Scenario: 3 all-ins with different stack sizes, 1 active player
 * Expected: Correct side pot calculation
 * Bug potential: Incorrect pot distribution
 */
function testMultipleAllInSidePots() {
  const logger = new TestLogger();
  const scenario = createMultipleAllInScenario();
  
  logger.info('Scenario: ' + scenario.description);
  
  simulateBettingRound(
    logger,
    scenario.players,
    scenario.tableState,
    'Multiple All-Ins - Side Pot Validation'
  );
  
  // Validate side pots are created correctly
  // P1: 2000, P2: 5000, P3: 8000, P4: 8000
  // Main pot: 2000 * 4 = 8000 (all 4 players)
  // Side pot 1: (5000 - 2000) * 3 = 9000 (P2, P3, P4)
  // Side pot 2: (8000 - 5000) * 2 = 6000 (P3, P4)
  validateSidePots(logger, scenario.players, scenario.tableState, 3, calculateSidePots, preparePlayerBetsForPotCalculation);
  
  // Active player should be able to act
  const activePlayer = scenario.players.find(p => p.id === 'p4')!;
  validatePlayerCanAct(logger, activePlayer, true);
  
  // All-in players should NOT be able to act
  const allInPlayers = scenario.players.filter(p => p.status === PlayerStatus.ALL_IN);
  allInPlayers.forEach(player => {
    validatePlayerCanAct(logger, player, false);
  });
  
  logger.printLogs();
  
  const summary = logger.getSummary();
  if (summary.bugsFound > 0 || summary.failedValidations > 0) {
    throw new Error(`Found ${summary.bugsFound} bugs and ${summary.failedValidations} validation failures`);
  }
}

/**
 * Test 3: Heads-Up All-In Scenario
 * 
 * Scenario: One player all-in, other must decide
 * Expected: Active player can CALL or FOLD, not CHECK
 */
function testHeadsUpAllIn() {
  const logger = new TestLogger();
  const scenario = createHeadsUpAllInScenario();
  
  logger.info('Scenario: ' + scenario.description);
  
  simulateBettingRound(
    logger,
    scenario.players,
    scenario.tableState,
    'Heads-Up All-In'
  );
  
  const allInPlayer = scenario.players.find(p => p.id === 'p1')!;
  const activePlayer = scenario.players.find(p => p.id === 'p2')!;
  
  // All-in player cannot act
  validatePlayerCanAct(logger, allInPlayer, false);
  
  // Active player must call or fold (cannot check because there's a bet)
  validateAvailableActions(
    logger,
    activePlayer,
    scenario.tableState,
    ['CALL', 'FOLD', 'RAISE']
  );
  
  // Validate pot
  validatePotAmount(logger, scenario.tableState.pot, 3000);
  
  logger.printLogs();
  
  const summary = logger.getSummary();
  if (summary.bugsFound > 0 || summary.failedValidations > 0) {
    throw new Error(`Found ${summary.bugsFound} bugs and ${summary.failedValidations} validation failures`);
  }
}

/**
 * Test 4: River Check Scenario (Bug Detection Focus)
 * 
 * Specifically tests the bug mentioned in the problem statement:
 * "No river, a ação deveria possibilitar check para jogador X, mas apresentou 
 * erroneamente aposta mínima de 15k"
 */
function testRiverCheckBug() {
  const logger = new TestLogger();
  
  // Create scenario where player should be able to check on river
  const players = createTestPlayers([
    {
      id: 'p1',
      name: 'Player 1',
      balance: 0,
      status: PlayerStatus.ALL_IN,
      seatNumber: 1,
      currentBet: 15000,
      totalContributedThisHand: 15000
    },
    {
      id: 'p2',
      name: 'Player 2',
      balance: 5000,
      status: PlayerStatus.ACTIVE,
      seatNumber: 2,
      currentBet: 15000, // Has matched the current bet
      totalContributedThisHand: 15000
    }
  ]);
  
  const tableState = createTestTableState({
    id: 1,
    tournamentId: 'test',
    pot: 30000,
    currentBet: 15000,
    bettingRound: BettingRound.RIVER,
    dealerButtonPosition: 1,
    handInProgress: true
  });
  
  logger.info('Scenario: Testing river CHECK bug');
  logger.info('Player 1 went all-in with 15k');
  logger.info('Player 2 called 15k and still has chips');
  logger.info('On river, Player 2 should be able to CHECK (bet is matched)');
  
  simulateBettingRound(logger, players, tableState, 'River CHECK Bug Test');
  
  const activePlayer = players.find(p => p.id === 'p2')!;
  
  // Player 2 has matched the bet and should be able to check
  // Bug would be if system requires a bet instead
  const result = validateAvailableActions(
    logger,
    activePlayer,
    tableState,
    ['CHECK', 'BET', 'FOLD']
  );
  
  if (!result) {
    logger.bug(
      'BUG CONFIRMED: River check not available when bet is matched',
      {
        issue: 'Player cannot check on river despite matching current bet',
        symptom: 'System incorrectly requires minimum bet instead of allowing check',
        impact: 'Forces unnecessary betting action, violates poker rules'
      }
    );
  }
  
  logger.printLogs();
  
  const summary = logger.getSummary();
  if (summary.bugsFound > 0 || summary.failedValidations > 0) {
    throw new Error(`Found ${summary.bugsFound} bugs and ${summary.failedValidations} validation failures`);
  }
}

/**
 * Test 5: Multiple All-Ins Across Different Rounds
 * 
 * Tests scenario where players go all-in at different times
 */
function testMultipleAllInsAcrossRounds() {
  const logger = new TestLogger();
  
  const players = createTestPlayers([
    {
      id: 'p1',
      name: 'Player 1 (All-in Pre-flop)',
      balance: 0,
      status: PlayerStatus.ALL_IN,
      seatNumber: 1,
      currentBet: 500,
      totalContributedThisHand: 500
    },
    {
      id: 'p2',
      name: 'Player 2 (All-in Flop)',
      balance: 0,
      status: PlayerStatus.ALL_IN,
      seatNumber: 2,
      currentBet: 1000,
      totalContributedThisHand: 1000
    },
    {
      id: 'p3',
      name: 'Player 3 (All-in Turn)',
      balance: 0,
      status: PlayerStatus.ALL_IN,
      seatNumber: 3,
      currentBet: 2000,
      totalContributedThisHand: 2000
    },
    {
      id: 'p4',
      name: 'Player 4 (Active)',
      balance: 8000,
      status: PlayerStatus.ACTIVE,
      seatNumber: 4,
      currentBet: 2000,
      totalContributedThisHand: 2000
    },
    {
      id: 'p5',
      name: 'Player 5 (Active)',
      balance: 6000,
      status: PlayerStatus.ACTIVE,
      seatNumber: 5,
      currentBet: 2000,
      totalContributedThisHand: 2000
    }
  ]);
  
  const tableState = createTestTableState({
    id: 1,
    tournamentId: 'test',
    pot: 500 + 1000 + 2000 + 2000 + 2000,
    currentBet: 2000,
    bettingRound: BettingRound.RIVER,
    dealerButtonPosition: 1,
    handInProgress: true
  });
  
  logger.info('Scenario: Multiple all-ins across different betting rounds');
  
  simulateBettingRound(logger, players, tableState, 'Multiple All-Ins Across Rounds');
  
  // Validate active players can act
  const activePlayers = players.filter(p => p.status === PlayerStatus.ACTIVE);
  activePlayers.forEach(player => {
    validatePlayerCanAct(logger, player, true);
    // Since they matched the bet, they should be able to check
    validateAvailableActions(logger, player, tableState, ['CHECK', 'BET', 'FOLD']);
  });
  
  // Validate side pots
  validateSidePots(logger, players, tableState, 3, calculateSidePots, preparePlayerBetsForPotCalculation);
  
  logger.printLogs();
  
  const summary = logger.getSummary();
  if (summary.bugsFound > 0 || summary.failedValidations > 0) {
    throw new Error(`Found ${summary.bugsFound} bugs and ${summary.failedValidations} validation failures`);
  }
}

/**
 * Test 6: Side Pot Distribution Validation
 * 
 * Tests correct pot distribution to winners
 */
function testSidePotDistribution() {
  const logger = new TestLogger();
  
  const players = createTestPlayers([
    {
      id: 'p1',
      name: 'Player 1 (2000)',
      balance: 0,
      status: PlayerStatus.ALL_IN,
      seatNumber: 1,
      currentBet: 2000,
      totalContributedThisHand: 2000
    },
    {
      id: 'p2',
      name: 'Player 2 (5000)',
      balance: 0,
      status: PlayerStatus.ALL_IN,
      seatNumber: 2,
      currentBet: 5000,
      totalContributedThisHand: 5000
    },
    {
      id: 'p3',
      name: 'Player 3 (10000)',
      balance: 0,
      status: PlayerStatus.ALL_IN,
      seatNumber: 3,
      currentBet: 10000,
      totalContributedThisHand: 10000
    }
  ]);
  
  const tableState = createTestTableState({
    id: 1,
    tournamentId: 'test',
    pot: 2000 + 5000 + 10000,
    currentBet: 10000,
    bettingRound: BettingRound.SHOWDOWN,
    dealerButtonPosition: 1,
    handInProgress: false
  });
  
  logger.info('Scenario: Side pot distribution test');
  logger.info('Expected pots:');
  logger.info('  Main pot: 2000 * 3 = 6000 (P1, P2, P3 eligible)');
  logger.info('  Side pot 1: (5000 - 2000) * 2 = 6000 (P2, P3 eligible)');
  logger.info('  Side pot 2: (10000 - 5000) * 1 = 5000 (P3 eligible)');
  
  const playerBets = preparePlayerBetsForPotCalculation(players, tableState.id);
  const pots = calculateSidePots(playerBets, tableState.pot);
  
  logger.info(`\nCalculated ${pots.length} pots:`);
  pots.forEach((pot, index) => {
    logger.info(`  Pot ${index + 1}: ${pot.amount} chips`);
    logger.info(`    Eligible: ${pot.eligiblePlayerIds.join(', ')}`);
  });
  
  // Validate pot structure
  logger.validate('Should have 3 pots', 3, pots.length);
  
  if (pots.length >= 1) {
    logger.validate('Main pot amount', 6000, pots[0].amount);
    logger.validate('Main pot eligible count', 3, pots[0].eligiblePlayerIds.length);
  }
  
  if (pots.length >= 2) {
    logger.validate('Side pot 1 amount', 6000, pots[1].amount);
    logger.validate('Side pot 1 eligible count', 2, pots[1].eligiblePlayerIds.length);
  }
  
  if (pots.length >= 3) {
    logger.validate('Side pot 2 amount', 5000, pots[2].amount);
    logger.validate('Side pot 2 eligible count', 1, pots[2].eligiblePlayerIds.length);
  }
  
  logger.printLogs();
  
  const summary = logger.getSummary();
  if (summary.bugsFound > 0 || summary.failedValidations > 0) {
    throw new Error(`Found ${summary.bugsFound} bugs and ${summary.failedValidations} validation failures`);
  }
}

// Run all tests
console.log('\n');
console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
console.log('║          MODULAR TESTING ENVIRONMENT FOR POKER TABLE SCENARIOS                ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');

runTest('Rebuy Tournament Scenario', testRebuyTournamentScenario);
runTest('Multiple All-In with Side Pots', testMultipleAllInSidePots);
runTest('Heads-Up All-In', testHeadsUpAllIn);
runTest('River Check Bug Detection', testRiverCheckBug);
runTest('Multiple All-Ins Across Rounds', testMultipleAllInsAcrossRounds);
runTest('Side Pot Distribution', testSidePotDistribution);

// Final summary
console.log('\n');
console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                            FINAL TEST SUMMARY                                 ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);

if (testsFailed > 0) {
  console.log('\n⚠️  Some tests failed. Review the logs above for details.');
  process.exit(1);
} else {
  console.log('\n🎉 All tests passed successfully!');
  process.exit(0);
}
