/**
 * Test: SHOWDOWN Betting Block
 * 
 * Validates that during SHOWDOWN, players cannot perform betting actions.
 * SHOWDOWN is exclusively for revealing physical cards and pot distribution.
 * 
 * Run with: npx tsx utils/showdownBettingBlock.test.ts
 */

import { createTestPlayers, createTestTableState } from './testScenarioBuilder';
import { TestLogger, getAvailableActions } from './testActionLogger';
import { PlayerStatus, BettingRound } from '../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

function testShowdownNoActions() {
  console.log('\n--- Test: No Actions During SHOWDOWN ---');
  
  const logger = new TestLogger();
  
  // Create active players with chips
  const players = createTestPlayers([
    {
      id: 'p1',
      name: 'Player 1',
      balance: 5000,
      status: PlayerStatus.ACTIVE,
      seatNumber: 1,
      currentBet: 1000,
      totalContributedThisHand: 1000
    },
    {
      id: 'p2',
      name: 'Player 2',
      balance: 3000,
      status: PlayerStatus.ACTIVE,
      seatNumber: 2,
      currentBet: 1000,
      totalContributedThisHand: 1000
    }
  ]);
  
  // Table at SHOWDOWN
  const tableState = createTestTableState({
    id: 1,
    tournamentId: 'test',
    pot: 2000,
    currentBet: 1000,
    bettingRound: BettingRound.SHOWDOWN,
    dealerButtonPosition: 1,
    handInProgress: false
  });
  
  logger.info('Scenario: Two active players at SHOWDOWN');
  logger.info('Both players have chips and could act in theory');
  logger.info('But SHOWDOWN blocks all betting actions');
  
  const p1Actions = getAvailableActions(players[0], tableState);
  const p2Actions = getAvailableActions(players[1], tableState);
  
  console.log(`Player 1 available actions: ${p1Actions.length === 0 ? '(none)' : p1Actions.join(', ')}`);
  console.log(`Player 2 available actions: ${p2Actions.length === 0 ? '(none)' : p2Actions.join(', ')}`);
  
  assert(p1Actions.length === 0, 'Player 1 should have NO actions during SHOWDOWN');
  assert(p2Actions.length === 0, 'Player 2 should have NO actions during SHOWDOWN');
  
  logger.info('\n✓ SHOWDOWN correctly blocks all betting actions');
}

function testRiverHasActions() {
  console.log('\n--- Test: Actions Available During RIVER (Control) ---');
  
  const logger = new TestLogger();
  
  // Same players but at RIVER instead of SHOWDOWN
  const players = createTestPlayers([
    {
      id: 'p1',
      name: 'Player 1',
      balance: 5000,
      status: PlayerStatus.ACTIVE,
      seatNumber: 1,
      currentBet: 1000,
      totalContributedThisHand: 1000
    },
    {
      id: 'p2',
      name: 'Player 2',
      balance: 3000,
      status: PlayerStatus.ACTIVE,
      seatNumber: 2,
      currentBet: 1000,
      totalContributedThisHand: 1000
    }
  ]);
  
  // Table at RIVER (betting round)
  const tableState = createTestTableState({
    id: 1,
    tournamentId: 'test',
    pot: 2000,
    currentBet: 1000,
    bettingRound: BettingRound.RIVER,
    dealerButtonPosition: 1,
    handInProgress: true
  });
  
  logger.info('Scenario: Same players at RIVER (betting round)');
  logger.info('Players should have normal betting actions available');
  
  const p1Actions = getAvailableActions(players[0], tableState);
  const p2Actions = getAvailableActions(players[1], tableState);
  
  console.log(`Player 1 available actions: ${p1Actions.join(', ')}`);
  console.log(`Player 2 available actions: ${p2Actions.join(', ')}`);
  
  assert(p1Actions.length > 0, 'Player 1 should have actions during RIVER');
  assert(p2Actions.length > 0, 'Player 2 should have actions during RIVER');
  assert(p1Actions.includes('CHECK'), 'Player 1 should be able to CHECK');
  assert(p1Actions.includes('BET'), 'Player 1 should be able to BET');
  
  logger.info('\n✓ RIVER correctly allows betting actions');
}

function testAllInPlayerNoActionsEvenAtRiver() {
  console.log('\n--- Test: All-In Players Have No Actions (Control) ---');
  
  const logger = new TestLogger();
  
  // All-in player at RIVER
  const players = createTestPlayers([
    {
      id: 'p1',
      name: 'Player 1 (All-in)',
      balance: 0,
      status: PlayerStatus.ALL_IN,
      seatNumber: 1,
      currentBet: 5000,
      totalContributedThisHand: 5000
    }
  ]);
  
  const tableState = createTestTableState({
    id: 1,
    tournamentId: 'test',
    pot: 5000,
    currentBet: 5000,
    bettingRound: BettingRound.RIVER,
    dealerButtonPosition: 1,
    handInProgress: true
  });
  
  const actions = getAvailableActions(players[0], tableState);
  
  console.log(`All-in player available actions: ${actions.length === 0 ? '(none)' : actions.join(', ')}`);
  
  assert(actions.length === 0, 'All-in player should have NO actions even during RIVER');
  
  logger.info('\n✓ All-in status correctly blocks actions regardless of betting round');
}

// Run all tests
console.log('=== Running SHOWDOWN Betting Block Tests ===');

try {
  testShowdownNoActions();
  testRiverHasActions();
  testAllInPlayerNoActionsEvenAtRiver();
  
  console.log('\n✅ All SHOWDOWN tests passed!');
  console.log('\n🎯 Verification: SHOWDOWN correctly blocks betting actions.');
  console.log('   Only betting rounds (PRE_FLOP, FLOP, TURN, RIVER) allow player actions.');
  console.log('   SHOWDOWN is exclusively for physical card reveal and pot distribution.\n');
} catch (error) {
  console.error('\n❌ Test failed with error:', error);
  process.exit(1);
}
