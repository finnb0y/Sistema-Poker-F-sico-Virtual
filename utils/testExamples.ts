/**
 * Example: How to Create a Custom Test Scenario
 * 
 * This file demonstrates how to use the modular testing environment
 * to create and validate custom poker scenarios.
 */

import {
  createTestPlayers,
  createTestTableState,
  createTestTournament
} from './testScenarioBuilder';
import {
  TestLogger,
  validateAvailableActions,
  validatePlayerCanAct,
  simulateBettingRound,
  getAvailableActions
} from './testActionLogger';
import { PlayerStatus, BettingRound } from '../types';
import { preparePlayerBetsForPotCalculation, calculateSidePots } from './sidePotLogic';

/**
 * Example 1: Simple scenario with 3 players
 * Tests basic action availability
 */
function exampleSimpleScenario() {
  console.log('\n=== Example 1: Simple 3-Player Scenario ===\n');
  
  const logger = new TestLogger();
  
  // Create 3 players
  const players = createTestPlayers([
    {
      id: 'alice',
      name: 'Alice',
      balance: 5000,
      status: PlayerStatus.ACTIVE,
      seatNumber: 1,
      currentBet: 200,
      totalContributedThisHand: 200
    },
    {
      id: 'bob',
      name: 'Bob',
      balance: 3000,
      status: PlayerStatus.ACTIVE,
      seatNumber: 2,
      currentBet: 200,
      totalContributedThisHand: 200
    },
    {
      id: 'charlie',
      name: 'Charlie',
      balance: 0,
      status: PlayerStatus.ALL_IN,
      seatNumber: 3,
      currentBet: 1000,
      totalContributedThisHand: 1000
    }
  ]);
  
  // Create table state at the flop
  const tableState = createTestTableState({
    id: 1,
    tournamentId: 'example-tournament',
    pot: 1400, // 200 + 200 + 1000
    currentBet: 1000,
    bettingRound: BettingRound.FLOP,
    dealerButtonPosition: 1
  });
  
  logger.info('Example Scenario: 3 players at the flop');
  logger.info('Alice and Bob need to call Charlie\'s all-in of 1000');
  
  // Simulate the betting round
  simulateBettingRound(logger, players, tableState, 'Simple 3-Player Flop');
  
  // Get available actions for each player
  const aliceActions = getAvailableActions(players[0], tableState);
  const bobActions = getAvailableActions(players[1], tableState);
  const charlieActions = getAvailableActions(players[2], tableState);
  
  logger.info('\nExpected Behavior:');
  logger.info(`  Alice (5000 chips): Can CALL (800 more), FOLD, or RAISE`);
  logger.info(`  Bob (3000 chips): Can CALL (800 more), FOLD, or RAISE`);
  logger.info(`  Charlie (all-in): Cannot act`);
  
  // Validate
  validatePlayerCanAct(logger, players[0], true);
  validatePlayerCanAct(logger, players[1], true);
  validatePlayerCanAct(logger, players[2], false);
  
  logger.printLogs();
}

/**
 * Example 2: Testing side pot calculation
 * Shows how to validate complex pot distributions
 */
function exampleSidePotCalculation() {
  console.log('\n=== Example 2: Side Pot Calculation ===\n');
  
  const logger = new TestLogger();
  
  // Create 4 players with different all-in amounts
  const players = createTestPlayers([
    {
      id: 'p1',
      name: 'Small Stack',
      balance: 0,
      status: PlayerStatus.ALL_IN,
      seatNumber: 1,
      currentBet: 1000,
      totalContributedThisHand: 1000
    },
    {
      id: 'p2',
      name: 'Medium Stack',
      balance: 0,
      status: PlayerStatus.ALL_IN,
      seatNumber: 2,
      currentBet: 3000,
      totalContributedThisHand: 3000
    },
    {
      id: 'p3',
      name: 'Big Stack',
      balance: 0,
      status: PlayerStatus.ALL_IN,
      seatNumber: 3,
      currentBet: 5000,
      totalContributedThisHand: 5000
    },
    {
      id: 'p4',
      name: 'Huge Stack',
      balance: 10000,
      status: PlayerStatus.ACTIVE,
      seatNumber: 4,
      currentBet: 5000,
      totalContributedThisHand: 5000
    }
  ]);
  
  const tableState = createTestTableState({
    id: 1,
    tournamentId: 'side-pot-example',
    pot: 14000, // 1000 + 3000 + 5000 + 5000
    currentBet: 5000,
    bettingRound: BettingRound.TURN,
    dealerButtonPosition: 1
  });
  
  logger.info('Side Pot Example: 4 players with different stacks');
  logger.info('Expected pot structure:');
  logger.info('  Main Pot: 1000 × 4 = 4000 (all 4 players eligible)');
  logger.info('  Side Pot 1: (3000-1000) × 3 = 6000 (P2, P3, P4 eligible)');
  logger.info('  Side Pot 2: (5000-3000) × 2 = 4000 (P3, P4 eligible)');
  
  // Calculate side pots
  const playerBets = preparePlayerBetsForPotCalculation(players, tableState.id);
  const pots = calculateSidePots(playerBets, tableState.pot);
  
  logger.info(`\nActual calculation: ${pots.length} pots`);
  pots.forEach((pot, index) => {
    logger.info(`  Pot ${index + 1}: ${pot.amount} chips`);
    logger.info(`    Eligible players: ${pot.eligiblePlayerIds.join(', ')}`);
  });
  
  // Validate structure
  logger.validate('Number of pots', 3, pots.length);
  if (pots.length === 3) {
    logger.validate('Main pot amount', 4000, pots[0].amount);
    logger.validate('Side pot 1 amount', 6000, pots[1].amount);
    logger.validate('Side pot 2 amount', 4000, pots[2].amount);
    logger.validate('Main pot eligible count', 4, pots[0].eligiblePlayerIds.length);
    logger.validate('Side pot 1 eligible count', 3, pots[1].eligiblePlayerIds.length);
    logger.validate('Side pot 2 eligible count', 2, pots[2].eligiblePlayerIds.length);
  }
  
  logger.printLogs();
}

/**
 * Example 3: Testing the river check scenario
 * Validates that players can check when appropriate
 */
function exampleRiverCheck() {
  console.log('\n=== Example 3: River Check Validation ===\n');
  
  const logger = new TestLogger();
  
  // Create 2 players at the river
  const players = createTestPlayers([
    {
      id: 'dealer',
      name: 'Dealer',
      balance: 3000,
      status: PlayerStatus.ACTIVE,
      seatNumber: 1,
      currentBet: 500,
      totalContributedThisHand: 2000
    },
    {
      id: 'sb',
      name: 'Small Blind',
      balance: 4000,
      status: PlayerStatus.ACTIVE,
      seatNumber: 2,
      currentBet: 500,
      totalContributedThisHand: 1500
    }
  ]);
  
  const tableState = createTestTableState({
    id: 1,
    tournamentId: 'river-check-example',
    pot: 3500,
    currentBet: 500,
    bettingRound: BettingRound.RIVER,
    dealerButtonPosition: 1
  });
  
  logger.info('River Check Example: Both players have matched the bet');
  logger.info('Both should be able to CHECK (no additional bet required)');
  
  simulateBettingRound(logger, players, tableState, 'River Check Scenario');
  
  // Validate both can check
  validateAvailableActions(logger, players[0], tableState, ['CHECK', 'BET', 'FOLD']);
  validateAvailableActions(logger, players[1], tableState, ['CHECK', 'BET', 'FOLD']);
  
  logger.printLogs();
}

/**
 * Example 4: Creating a custom tournament configuration
 */
function exampleCustomTournament() {
  console.log('\n=== Example 4: Custom Tournament Configuration ===\n');
  
  const logger = new TestLogger();
  
  // Create a custom tournament
  const tournament = createTestTournament({
    id: 'custom-tourney',
    name: 'High Stakes Championship',
    buyInChips: 50000,
    rebuyEnabled: true,
    rebuyChips: 50000,
    maxSeats: 8,
    smallBlind: 500,
    bigBlind: 1000
  });
  
  logger.info('Custom Tournament Created:');
  logger.info(`  Name: ${tournament.name}`);
  logger.info(`  Buy-in: ${tournament.config.buyIn.chips} chips`);
  logger.info(`  Rebuy: ${tournament.config.rebuy.enabled ? 'Enabled' : 'Disabled'}`);
  logger.info(`  Max Seats: ${tournament.config.maxSeats}`);
  logger.info(`  Blinds: ${tournament.config.blindStructure.levels[0].smallBlind}/${tournament.config.blindStructure.levels[0].bigBlind}`);
  
  // Create high-stakes players
  const players = createTestPlayers([
    {
      id: 'pro1',
      name: 'Pro Player 1',
      balance: 50000,
      seatNumber: 1
    },
    {
      id: 'pro2',
      name: 'Pro Player 2',
      balance: 50000,
      seatNumber: 2
    }
  ]);
  
  logger.info(`\nPlayers registered: ${players.length}`);
  players.forEach(p => {
    logger.info(`  ${p.name}: ${p.balance} chips`);
  });
  
  logger.printLogs();
}

// Run all examples
console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
console.log('║              POKER TESTING ENVIRONMENT - USAGE EXAMPLES                       ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');

try {
  exampleSimpleScenario();
  exampleSidePotCalculation();
  exampleRiverCheck();
  exampleCustomTournament();
  
  console.log('\n✅ All examples completed successfully!');
  console.log('\nFor more information, see: docs/TESTING_ENVIRONMENT.md\n');
} catch (error) {
  console.error('\n❌ Example failed:', error);
  process.exit(1);
}
