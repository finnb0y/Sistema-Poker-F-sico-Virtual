/**
 * Test Scenario Builder
 * 
 * Provides utilities to quickly create customizable poker table scenarios for testing.
 * This module helps identify bugs by allowing precise configuration of game states.
 */

import { 
  Player, 
  PlayerStatus, 
  TableState, 
  BettingRound, 
  Tournament,
  TournamentConfig,
  BlindLevel
} from '../types';

export interface PlayerConfig {
  id: string;
  name: string;
  balance: number;
  status?: PlayerStatus;
  seatNumber: number;
  currentBet?: number;
  totalContributedThisHand?: number;
  rebuysCount?: number;
}

export interface TableConfig {
  id: number;
  tournamentId: string;
  pot?: number;
  currentBet?: number;
  bettingRound?: BettingRound;
  dealerButtonPosition?: number;
  currentBlindLevel?: number;
  handInProgress?: boolean;
}

export interface TournamentSetup {
  id: string;
  name: string;
  buyInChips?: number;
  rebuyEnabled?: boolean;
  rebuyChips?: number;
  maxSeats?: number;
  smallBlind?: number;
  bigBlind?: number;
}

/**
 * Create a player with default or custom configuration
 */
export function createTestPlayer(config: PlayerConfig): Player {
  return {
    id: config.id,
    personId: `person-${config.id}`,
    tournamentId: 'test-tournament',
    name: config.name,
    balance: config.balance,
    currentBet: config.currentBet ?? 0,
    totalContributedThisHand: config.totalContributedThisHand ?? config.currentBet ?? 0,
    status: config.status ?? PlayerStatus.ACTIVE,
    tableId: 1,
    seatNumber: config.seatNumber,
    accessCode: `code-${config.id}`,
    rebuysCount: config.rebuysCount ?? 0,
    hasAddon: false,
    totalInvested: (config.rebuysCount ?? 0) * 10000
  };
}

/**
 * Create multiple players quickly
 */
export function createTestPlayers(configs: PlayerConfig[]): Player[] {
  return configs.map(createTestPlayer);
}

/**
 * Create a table state with default or custom configuration
 */
export function createTestTableState(config: TableConfig): TableState {
  return {
    id: config.id,
    tournamentId: config.tournamentId,
    pot: config.pot ?? 0,
    currentTurn: null,
    dealerId: null,
    dealerButtonPosition: config.dealerButtonPosition ?? 1,
    currentBlindLevel: config.currentBlindLevel ?? 0,
    bettingRound: config.bettingRound ?? BettingRound.PRE_FLOP,
    currentBet: config.currentBet ?? 0,
    lastRaiseAmount: 0,
    handInProgress: config.handInProgress ?? true,
    lastAggressorId: null,
    playersActedInRound: [],
    potDistribution: null
  };
}

/**
 * Create a tournament configuration for testing
 */
export function createTestTournament(setup: TournamentSetup): Tournament {
  const blindLevel: BlindLevel = {
    smallBlind: setup.smallBlind ?? 50,
    bigBlind: setup.bigBlind ?? 100,
    ante: 0,
    duration: 20
  };

  const config: TournamentConfig = {
    buyIn: { 
      enabled: true, 
      price: 100, 
      chips: setup.buyInChips ?? 10000 
    },
    rebuy: { 
      enabled: setup.rebuyEnabled ?? true, 
      price: 100, 
      chips: setup.rebuyChips ?? 10000, 
      maxCount: 3, 
      threshold: 10000 
    },
    reentry: { 
      enabled: false, 
      price: 100, 
      chips: 10000 
    },
    addon: { 
      enabled: false, 
      active: false, 
      price: 100, 
      chips: 10000 
    },
    maxSeats: setup.maxSeats ?? 9,
    blindStructure: {
      intervals: [],
      levels: [blindLevel],
      breakEnabled: false,
      breakDuration: 0,
      breakFrequency: 0
    }
  };

  return {
    id: setup.id,
    name: setup.name,
    acronym: 'TST',
    config,
    assignedTableIds: [1],
    isActive: true
  };
}

/**
 * Scenario: 6-player rebuy tournament with multiple all-ins
 * Based on problem statement scenario
 */
export function createRebuyTournamentScenario() {
  const tournament = createTestTournament({
    id: 'rebuy-test',
    name: 'Rebuy Tournament Test',
    buyInChips: 10000,
    rebuyEnabled: true,
    rebuyChips: 10000,
    maxSeats: 6,
    smallBlind: 50,
    bigBlind: 100
  });

  // Initial pot with blinds and antes
  const initialPot = 150; // SB + BB

  // Create 6 players with different stack situations
  const players = createTestPlayers([
    {
      id: 'p1',
      name: 'Player 1',
      balance: 0,
      status: PlayerStatus.ALL_IN,
      seatNumber: 1,
      currentBet: 10000,
      totalContributedThisHand: 10000
    },
    {
      id: 'p2',
      name: 'Player 2',
      balance: 0,
      status: PlayerStatus.ALL_IN,
      seatNumber: 2,
      currentBet: 5000,
      totalContributedThisHand: 5000
    },
    {
      id: 'p3',
      name: 'Player 3',
      balance: 0,
      status: PlayerStatus.FOLDED,
      seatNumber: 3,
      currentBet: 100,
      totalContributedThisHand: 100
    },
    {
      id: 'p4',
      name: 'Player 4',
      balance: 0,
      status: PlayerStatus.FOLDED,
      seatNumber: 4,
      currentBet: 50,
      totalContributedThisHand: 50
    },
    {
      id: 'p5',
      name: 'Player 5',
      balance: 5000,
      status: PlayerStatus.ACTIVE,
      seatNumber: 5,
      currentBet: 10000,
      totalContributedThisHand: 10000
    },
    {
      id: 'p6',
      name: 'Player 6',
      balance: 5000,
      status: PlayerStatus.ACTIVE,
      seatNumber: 6,
      currentBet: 10000,
      totalContributedThisHand: 10000
    }
  ]);

  const tableState = createTestTableState({
    id: 1,
    tournamentId: tournament.id,
    pot: initialPot + 10000 + 5000 + 100 + 50 + 10000 + 10000, // Total bets
    currentBet: 10000,
    bettingRound: BettingRound.RIVER,
    dealerButtonPosition: 1,
    handInProgress: true
  });

  return {
    tournament,
    players,
    tableState,
    description: '6-player rebuy tournament: 2 all-ins (different amounts), 2 folds, 2 active on river'
  };
}

/**
 * Scenario: Multiple players all-in with side pots
 */
export function createMultipleAllInScenario() {
  const tournament = createTestTournament({
    id: 'multi-allin-test',
    name: 'Multiple All-In Test',
    buyInChips: 10000,
    rebuyEnabled: false,
    maxSeats: 6,
    smallBlind: 50,
    bigBlind: 100
  });

  const players = createTestPlayers([
    {
      id: 'p1',
      name: 'Player 1',
      balance: 0,
      status: PlayerStatus.ALL_IN,
      seatNumber: 1,
      currentBet: 2000,
      totalContributedThisHand: 2000
    },
    {
      id: 'p2',
      name: 'Player 2',
      balance: 0,
      status: PlayerStatus.ALL_IN,
      seatNumber: 2,
      currentBet: 5000,
      totalContributedThisHand: 5000
    },
    {
      id: 'p3',
      name: 'Player 3',
      balance: 0,
      status: PlayerStatus.ALL_IN,
      seatNumber: 3,
      currentBet: 8000,
      totalContributedThisHand: 8000
    },
    {
      id: 'p4',
      name: 'Player 4',
      balance: 2000,
      status: PlayerStatus.ACTIVE,
      seatNumber: 4,
      currentBet: 8000,
      totalContributedThisHand: 8000
    }
  ]);

  const tableState = createTestTableState({
    id: 1,
    tournamentId: tournament.id,
    pot: 2000 + 5000 + 8000 + 8000,
    currentBet: 8000,
    bettingRound: BettingRound.FLOP,
    dealerButtonPosition: 1,
    handInProgress: true
  });

  return {
    tournament,
    players,
    tableState,
    description: 'Multiple all-ins with different stack sizes creating side pots'
  };
}

/**
 * Scenario: Heads-up with one all-in
 */
export function createHeadsUpAllInScenario() {
  const tournament = createTestTournament({
    id: 'headsup-test',
    name: 'Heads-Up All-In Test',
    buyInChips: 10000,
    rebuyEnabled: false,
    maxSeats: 2,
    smallBlind: 50,
    bigBlind: 100
  });

  const players = createTestPlayers([
    {
      id: 'p1',
      name: 'Player 1',
      balance: 0,
      status: PlayerStatus.ALL_IN,
      seatNumber: 1,
      currentBet: 3000,
      totalContributedThisHand: 3000
    },
    {
      id: 'p2',
      name: 'Player 2',
      balance: 7000,
      status: PlayerStatus.ACTIVE,
      seatNumber: 2,
      currentBet: 0,
      totalContributedThisHand: 0
    }
  ]);

  const tableState = createTestTableState({
    id: 1,
    tournamentId: tournament.id,
    pot: 3000,
    currentBet: 3000,
    bettingRound: BettingRound.PRE_FLOP,
    dealerButtonPosition: 1,
    handInProgress: true
  });

  return {
    tournament,
    players,
    tableState,
    description: 'Heads-up: One player all-in, other must call or fold'
  };
}
