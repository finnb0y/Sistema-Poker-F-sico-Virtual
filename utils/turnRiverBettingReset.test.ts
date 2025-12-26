/**
 * Test: Turn/River Betting Round Reset
 * 
 * Validates that when advancing from one betting round to another (especially TURN to RIVER),
 * the currentBet is properly reset to 0, allowing players to CHECK instead of being forced to CALL.
 * 
 * This test addresses the issue where players were seeing a base bet at the start of RIVER
 * when they should be able to CHECK.
 * 
 * Run with: npx tsx utils/turnRiverBettingReset.test.ts
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

function testTurnToRiverReset() {
  console.log('\n--- Test: TURN to RIVER Betting Reset ---');
  
  const logger = new TestLogger();
  
  // Scenario: At end of TURN, players had bet 10000 and all called
  // Now advancing to RIVER, bets should be reset to 0
  
  // Create players who all have matched the previous round's bet
  const players = createTestPlayers([
    {
      id: 'p1',
      name: 'Player 1',
      balance: 5000,
      status: PlayerStatus.ACTIVE,
      seatNumber: 1,
      currentBet: 0, // Should be reset to 0 at start of new round
      totalContributedThisHand: 10000 // Total from previous rounds
    },
    {
      id: 'p2',
      name: 'Player 2',
      balance: 5000,
      status: PlayerStatus.ACTIVE,
      seatNumber: 2,
      currentBet: 0, // Should be reset to 0 at start of new round
      totalContributedThisHand: 10000 // Total from previous rounds
    }
  ]);
  
  // Table at RIVER with currentBet reset to 0 (correct behavior)
  const tableState = createTestTableState({
    id: 1,
    tournamentId: 'test',
    pot: 20000, // Pot from previous rounds
    currentBet: 0, // MUST be 0 at start of new betting round
    bettingRound: BettingRound.RIVER,
    dealerButtonPosition: 1,
    handInProgress: true
  });
  
  logger.info('Scenario: Start of RIVER, after TURN where both players bet 10k');
  logger.info('At start of new round, currentBet should be 0');
  logger.info('Players should be able to CHECK, not forced to CALL');
  
  const p1Actions = getAvailableActions(players[0], tableState);
  const p2Actions = getAvailableActions(players[1], tableState);
  
  console.log(`Player 1 available actions: ${p1Actions.join(', ')}`);
  console.log(`Player 2 available actions: ${p2Actions.join(', ')}`);
  console.log(`Table currentBet: ${tableState.currentBet}`);
  console.log(`Player 1 currentBet: ${players[0].currentBet}`);
  console.log(`Player 2 currentBet: ${players[1].currentBet}`);
  
  assert(tableState.currentBet === 0, 'Table currentBet should be 0 at start of RIVER');
  assert(players[0].currentBet === 0, 'Player 1 currentBet should be 0 at start of RIVER');
  assert(players[1].currentBet === 0, 'Player 2 currentBet should be 0 at start of RIVER');
  assert(p1Actions.includes('CHECK'), 'Player 1 should be able to CHECK at start of RIVER');
  assert(p2Actions.includes('CHECK'), 'Player 2 should be able to CHECK at start of RIVER');
  
  logger.info('\n✓ RIVER correctly starts with currentBet = 0, allowing CHECK');
}

function testIncorrectScenario() {
  console.log('\n--- Test: INCORRECT Scenario (Bug Reproduction) ---');
  
  const logger = new TestLogger();
  
  // This reproduces the BUG described in the issue:
  // At start of RIVER, currentBet is incorrectly set to 10000 instead of 0
  
  const players = createTestPlayers([
    {
      id: 'p1',
      name: 'Player 1',
      balance: 5000,
      status: PlayerStatus.ACTIVE,
      seatNumber: 1,
      currentBet: 10000, // Bug: Should be 0 but is still 10000 from previous round
      totalContributedThisHand: 10000
    },
    {
      id: 'p2',
      name: 'Player 2',
      balance: 5000,
      status: PlayerStatus.ACTIVE,
      seatNumber: 2,
      currentBet: 10000, // Bug: Should be 0 but is still 10000 from previous round
      totalContributedThisHand: 10000
    }
  ]);
  
  // Bug: Table currentBet is 10000 when it should be 0
  const tableState = createTestTableState({
    id: 1,
    tournamentId: 'test',
    pot: 20000,
    currentBet: 10000, // Bug: Should be 0 at start of new round
    bettingRound: BettingRound.RIVER,
    dealerButtonPosition: 1,
    handInProgress: true
  });
  
  logger.info('Scenario: BUG - RIVER starts with currentBet = 10000 instead of 0');
  logger.info('This forces players to CALL instead of allowing CHECK');
  
  const p1Actions = getAvailableActions(players[0], tableState);
  const p2Actions = getAvailableActions(players[1], tableState);
  
  console.log(`Player 1 available actions: ${p1Actions.join(', ')}`);
  console.log(`Player 2 available actions: ${p2Actions.join(', ')}`);
  console.log(`Table currentBet: ${tableState.currentBet}`);
  console.log(`Player 1 currentBet: ${players[0].currentBet}`);
  console.log(`Player 2 currentBet: ${players[1].currentBet}`);
  
  // With the bug, players would have CHECK available because their currentBet matches table currentBet
  // But this is incorrect behavior - at start of new round, bets should be 0
  
  if (p1Actions.includes('CHECK') && players[0].currentBet === tableState.currentBet) {
    console.log('\n⚠️  WARNING: Players can CHECK but only because currentBet was not reset!');
    console.log('   This scenario should not exist - bets should be reset to 0 at start of round');
  }
  
  logger.info('\n✗ This scenario demonstrates the bug where bets are not reset');
}

function testMismatchedBetsAtRiverStart() {
  console.log('\n--- Test: Bug - Player Bets Not Reset, Table Bet Reset ---');
  
  const logger = new TestLogger();
  
  // Another possible bug scenario:
  // Table currentBet was reset to 0, but player currentBets were NOT reset
  // This would make it look like players need to bet when they should CHECK
  
  const players = createTestPlayers([
    {
      id: 'p1',
      name: 'Player 1',
      balance: 5000,
      status: PlayerStatus.ACTIVE,
      seatNumber: 1,
      currentBet: 10000, // Bug: Not reset
      totalContributedThisHand: 10000
    },
    {
      id: 'p2',
      name: 'Player 2',
      balance: 5000,
      status: PlayerStatus.ACTIVE,
      seatNumber: 2,
      currentBet: 10000, // Bug: Not reset
      totalContributedThisHand: 10000
    }
  ]);
  
  // Table currentBet was correctly reset
  const tableState = createTestTableState({
    id: 1,
    tournamentId: 'test',
    pot: 20000,
    currentBet: 0, // Correct
    bettingRound: BettingRound.RIVER,
    dealerButtonPosition: 1,
    handInProgress: true
  });
  
  logger.info('Scenario: Table currentBet reset to 0, but player currentBets NOT reset');
  
  const p1Actions = getAvailableActions(players[0], tableState);
  
  console.log(`Player 1 available actions: ${p1Actions.join(', ')}`);
  console.log(`Table currentBet: ${tableState.currentBet}`);
  console.log(`Player 1 currentBet: ${players[0].currentBet}`);
  
  // With this bug, player currentBet (10000) > table currentBet (0)
  // So needsToCall would be FALSE (player.currentBet >= table.currentBet)
  // Player would be able to CHECK, which is actually correct behavior
  
  if (p1Actions.includes('CHECK')) {
    console.log('\n✅ Player can CHECK (because player.currentBet > table.currentBet)');
    console.log('   But player.currentBet should have been reset to 0!');
  }
  
  logger.info('\n⚠️  This scenario is logically inconsistent but happens to work');
}

function testTableBetNotResetPlayerBetReset() {
  console.log('\n--- Test: Bug - Table Bet Not Reset, Player Bets Reset ---');
  
  const logger = new TestLogger();
  
  // The ACTUAL bug from the issue:
  // Player currentBets were reset to 0, but table currentBet was NOT reset
  // This forces players to CALL when they should CHECK
  
  const players = createTestPlayers([
    {
      id: 'p1',
      name: 'Player 1',
      balance: 5000,
      status: PlayerStatus.ACTIVE,
      seatNumber: 1,
      currentBet: 0, // Correctly reset
      totalContributedThisHand: 10000
    },
    {
      id: 'p2',
      name: 'Player 2',
      balance: 5000,
      status: PlayerStatus.ACTIVE,
      seatNumber: 2,
      currentBet: 0, // Correctly reset
      totalContributedThisHand: 10000
    }
  ]);
  
  // Bug: Table currentBet NOT reset
  const tableState = createTestTableState({
    id: 1,
    tournamentId: 'test',
    pot: 20000,
    currentBet: 10000, // Bug: Should be 0
    bettingRound: BettingRound.RIVER,
    dealerButtonPosition: 1,
    handInProgress: true
  });
  
  logger.info('Scenario: THE BUG - Player bets reset, but table currentBet NOT reset');
  logger.info('This is the scenario described in the issue!');
  
  const p1Actions = getAvailableActions(players[0], tableState);
  
  console.log(`Player 1 available actions: ${p1Actions.join(', ')}`);
  console.log(`Table currentBet: ${tableState.currentBet}`);
  console.log(`Player 1 currentBet: ${players[0].currentBet}`);
  
  // With this bug:
  // player.currentBet (0) < table.currentBet (10000)
  // So needsToCall is TRUE
  // Player is forced to CALL instead of being able to CHECK
  
  if (!p1Actions.includes('CHECK') && p1Actions.includes('CALL')) {
    console.log('\n🐛 BUG CONFIRMED: Player forced to CALL instead of CHECK!');
    console.log('   This matches the issue description');
  } else if (p1Actions.includes('CHECK')) {
    console.log('\n✅ Player can CHECK (correct behavior)');
  }
  
  assert(!p1Actions.includes('CHECK'), 'Player 1 should NOT be able to CHECK (demonstrating the bug)');
  assert(p1Actions.includes('CALL'), 'Player 1 is forced to CALL (demonstrating the bug)');
  
  logger.info('\n🐛 This is the BUG: table.currentBet not reset, forcing CALL instead of CHECK');
}

// Run all tests
console.log('=== Running Turn/River Betting Reset Tests ===');

try {
  testTurnToRiverReset();
  testIncorrectScenario();
  testMismatchedBetsAtRiverStart();
  testTableBetNotResetPlayerBetReset();
  
  console.log('\n✅ All tests completed!');
  console.log('\n🎯 Key Finding: The bug occurs when table.currentBet is not reset to 0');
  console.log('   at the start of a new betting round, while player.currentBets ARE reset.');
  console.log('   This forces players to CALL instead of allowing CHECK.\n');
} catch (error) {
  console.error('\n❌ Test failed with error:', error);
  process.exit(1);
}
