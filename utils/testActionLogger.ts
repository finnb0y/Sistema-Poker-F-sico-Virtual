/**
 * Action Logger and Simulator
 * 
 * Provides detailed logging and validation of poker actions during test scenarios.
 * Automatically tracks expected vs actual behavior and reports discrepancies.
 */

import { Player, PlayerStatus, TableState, BettingRound } from '../types';
import { canPlayerAct } from './playerActionLogic';

export interface ActionLog {
  timestamp: number;
  type: 'info' | 'action' | 'validation' | 'error' | 'bug';
  message: string;
  details?: any;
}

export interface ValidationResult {
  passed: boolean;
  expected: any;
  actual: any;
  message: string;
}

export class TestLogger {
  private logs: ActionLog[] = [];
  private bugCount = 0;
  private validationCount = 0;
  private passedValidations = 0;

  /**
   * Log an informational message
   */
  info(message: string, details?: any) {
    this.logs.push({
      timestamp: Date.now(),
      type: 'info',
      message,
      details
    });
  }

  /**
   * Log a player action
   */
  action(playerId: string, action: string, amount?: number, details?: any) {
    const message = amount !== undefined
      ? `${playerId} ${action} ${amount} chips`
      : `${playerId} ${action}`;
    
    this.logs.push({
      timestamp: Date.now(),
      type: 'action',
      message,
      details
    });
  }

  /**
   * Validate an expectation and log the result
   */
  validate(description: string, expected: any, actual: any): boolean {
    this.validationCount++;
    
    // Simple deep equality check for primitive types, arrays, and objects
    let passed = false;
    if (expected === actual) {
      passed = true;
    } else if (Array.isArray(expected) && Array.isArray(actual)) {
      passed = expected.length === actual.length && 
               expected.every((val, index) => val === actual[index]);
    } else if (typeof expected === 'object' && typeof actual === 'object' && expected !== null && actual !== null) {
      // Use JSON.stringify as fallback for complex objects in test context
      passed = JSON.stringify(expected) === JSON.stringify(actual);
    }
    
    if (passed) {
      this.passedValidations++;
    }

    this.logs.push({
      timestamp: Date.now(),
      type: passed ? 'validation' : 'error',
      message: passed 
        ? `✓ ${description}` 
        : `✗ ${description}`,
      details: { expected, actual }
    });

    return passed;
  }

  /**
   * Report a bug found during testing
   */
  bug(description: string, details?: any) {
    this.bugCount++;
    this.logs.push({
      timestamp: Date.now(),
      type: 'bug',
      message: `🐛 BUG: ${description}`,
      details
    });
  }

  /**
   * Get all logs
   */
  getLogs(): ActionLog[] {
    return [...this.logs];
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    return {
      totalLogs: this.logs.length,
      bugsFound: this.bugCount,
      validations: this.validationCount,
      passedValidations: this.passedValidations,
      failedValidations: this.validationCount - this.passedValidations
    };
  }

  /**
   * Print all logs to console with formatting
   */
  printLogs() {
    console.log('\n' + '='.repeat(80));
    console.log('TEST EXECUTION LOG');
    console.log('='.repeat(80) + '\n');

    this.logs.forEach(log => {
      const prefix = this.getLogPrefix(log.type);
      console.log(`${prefix} ${log.message}`);
      if (log.details) {
        console.log('  Details:', JSON.stringify(log.details, null, 2));
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    const summary = this.getSummary();
    console.log(`Total Logs: ${summary.totalLogs}`);
    console.log(`Validations: ${summary.passedValidations}/${summary.validations} passed`);
    console.log(`Bugs Found: ${summary.bugsFound}`);
    console.log('='.repeat(80) + '\n');
  }

  private getLogPrefix(type: ActionLog['type']): string {
    switch (type) {
      case 'info': return 'ℹ️';
      case 'action': return '🎯';
      case 'validation': return '✅';
      case 'error': return '❌';
      case 'bug': return '🐛';
    }
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];
    this.bugCount = 0;
    this.validationCount = 0;
    this.passedValidations = 0;
  }
}

/**
 * Validate player action availability
 */
export function validatePlayerCanAct(
  logger: TestLogger,
  player: Player,
  expectedCanAct: boolean
): boolean {
  const actualCanAct = canPlayerAct(player);
  
  const description = expectedCanAct
    ? `${player.name} should be able to act`
    : `${player.name} should NOT be able to act`;

  return logger.validate(description, expectedCanAct, actualCanAct);
}

/**
 * Validate available actions for a player
 */
export function validateAvailableActions(
  logger: TestLogger,
  player: Player,
  tableState: TableState,
  expectedActions: string[]
): boolean {
  const actualActions = getAvailableActions(player, tableState);
  
  const description = `Available actions for ${player.name}`;
  
  // Sort both arrays for comparison
  const sortedExpected = [...expectedActions].sort();
  const sortedActual = [...actualActions].sort();
  
  const result = logger.validate(description, sortedExpected, sortedActual);
  
  if (!result) {
    logger.bug(
      `Incorrect available actions for ${player.name}`,
      {
        playerStatus: player.status,
        playerBalance: player.balance,
        playerCurrentBet: player.currentBet,
        tableCurrentBet: tableState.currentBet,
        bettingRound: tableState.bettingRound
      }
    );
  }
  
  return result;
}

/**
 * Get available actions for a player based on game state
 */
export function getAvailableActions(
  player: Player,
  tableState: TableState
): string[] {
  // Cannot act if folded, out, or all-in
  if (!canPlayerAct(player)) {
    return [];
  }

  // During SHOWDOWN, no betting actions are allowed
  // SHOWDOWN is for revealing cards and pot distribution only
  if (tableState.bettingRound === BettingRound.SHOWDOWN) {
    return [];
  }

  const actions: string[] = [];
  const needsToCall = player.currentBet < tableState.currentBet;
  const callAmount = tableState.currentBet - player.currentBet;

  // Can always fold (unless already committed all chips)
  actions.push('FOLD');

  // Check available if no bet to call
  if (!needsToCall) {
    actions.push('CHECK');
  }

  // Call available if there's a bet to call and player has chips
  if (needsToCall && player.balance > 0) {
    if (player.balance >= callAmount) {
      actions.push('CALL');
    } else {
      // Player can only call all-in
      actions.push('CALL_ALL_IN');
    }
  }

  // Bet/Raise available if player has chips beyond the call
  if (player.balance > callAmount) {
    if (needsToCall) {
      actions.push('RAISE');
    } else {
      actions.push('BET');
    }
  }

  return actions;
}

/**
 * Validate pot amount
 */
export function validatePotAmount(
  logger: TestLogger,
  actualPot: number,
  expectedPot: number,
  tolerance: number = 0.01  // Small epsilon for floating point precision
): boolean {
  const description = 'Pot amount is correct';
  const isValid = Math.abs(actualPot - expectedPot) <= tolerance;
  
  if (!isValid) {
    logger.validate(description, expectedPot, actualPot);
    logger.bug(
      `Incorrect pot amount: expected ${expectedPot}, got ${actualPot}`,
      { difference: actualPot - expectedPot }
    );
    return false;
  }
  
  return logger.validate(description, expectedPot, actualPot);
}

/**
 * Validate side pot calculation
 */
export function validateSidePots(
  logger: TestLogger,
  players: Player[],
  tableState: TableState,
  expectedPotCount: number,
  calculateSidePotsFunc: any,
  preparePlayerBetsFunc: any
): boolean {
  const playerBets = preparePlayerBetsFunc(players, tableState.id);
  const pots = calculateSidePotsFunc(playerBets, tableState.pot);
  
  logger.info(`Side pots calculated: ${pots.length} pots`);
  pots.forEach((pot, index) => {
    logger.info(
      `  Pot ${index + 1}: ${pot.amount} chips, eligible players: ${pot.eligiblePlayerIds.join(', ')}`
    );
  });
  
  const description = `Correct number of pots (${expectedPotCount} expected)`;
  const result = logger.validate(description, expectedPotCount, pots.length);
  
  if (!result) {
    logger.bug(
      `Incorrect side pot calculation`,
      { expectedPotCount, actualPotCount: pots.length, pots }
    );
  }
  
  return result;
}

/**
 * Simulate a betting round and validate actions
 */
export function simulateBettingRound(
  logger: TestLogger,
  players: Player[],
  tableState: TableState,
  scenarioName: string
) {
  logger.info(`--- ${scenarioName} ---`);
  logger.info(`Betting Round: ${tableState.bettingRound}`);
  logger.info(`Current Bet: ${tableState.currentBet}`);
  logger.info(`Pot: ${tableState.pot}`);
  
  logger.info('\nPlayer States:');
  players.forEach(player => {
    logger.info(
      `  ${player.name} (${player.status}): ${player.balance} chips, bet ${player.currentBet}, total contributed ${player.totalContributedThisHand}`
    );
  });
  
  // Validate each player's available actions
  logger.info('\nValidating Available Actions:');
  const activePlayers = players.filter(p => 
    p.status === PlayerStatus.ACTIVE && p.tableId === tableState.id
  );
  
  activePlayers.forEach(player => {
    const actions = getAvailableActions(player, tableState);
    logger.info(`  ${player.name}: ${actions.join(', ')}`);
  });
  
  // Check for specific scenarios that should allow CHECK
  if (tableState.bettingRound === BettingRound.RIVER) {
    const playersWhoShouldCheck = activePlayers.filter(p => 
      p.currentBet === tableState.currentBet && p.balance > 0
    );
    
    if (playersWhoShouldCheck.length > 0) {
      playersWhoShouldCheck.forEach(player => {
        const actions = getAvailableActions(player, tableState);
        if (!actions.includes('CHECK')) {
          logger.bug(
            `On river, ${player.name} should be able to CHECK (matched current bet), but CHECK not available`,
            {
              playerCurrentBet: player.currentBet,
              tableCurrentBet: tableState.currentBet,
              availableActions: actions
            }
          );
        }
      });
    }
  }
}
