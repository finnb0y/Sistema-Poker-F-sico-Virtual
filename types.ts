
export enum Role {
  DIRECTOR = 'DIRECTOR',
  DEALER = 'DEALER',
  PLAYER = 'PLAYER'
}

export enum PlayerStatus {
  SITTING = 'SITTING',
  ACTIVE = 'ACTIVE',
  FOLDED = 'FOLDED',
  ALL_IN = 'ALL_IN',
  OUT = 'OUT'
}

export interface RegisteredPerson {
  id: string;
  name: string;
  nickname?: string;
}

export interface BlindLevel {
  smallBlind: number;
  bigBlind: number;
  ante: number;
  duration: number; // in minutes
  isBreak?: boolean; // if true, this is a break period
}

export interface BlindInterval {
  startingSmallBlind: number;
  increment: number; // how much to increase small blind each level
  levelDuration: number; // duration in minutes for each level in this interval
  numberOfLevels: number; // how many levels in this interval
}

export interface TournamentConfig {
  buyIn: { enabled: boolean, price: number, chips: number };
  rebuy: { enabled: boolean, price: number, chips: number, maxCount: number, threshold: number };
  reentry: { enabled: boolean, price: number, chips: number };
  addon: { enabled: boolean, active: boolean, price: number, chips: number };
  maxSeats: number;
  blindStructure: {
    intervals: BlindInterval[];
    levels: BlindLevel[];
    breakEnabled: boolean;
    breakDuration: number; // in minutes
    breakFrequency: number; // insert break after every X levels (0 = no breaks)
  };
}

export interface RoomTable {
  id: number;
  name: string;
}

export interface Tournament {
  id: string;
  name: string;
  acronym: string; // 3-letter acronym
  guaranteed?: number; // Guaranteed prize pool
  config: TournamentConfig;
  assignedTableIds: number[];
  isActive: boolean;
}

export interface Player {
  id: string;
  personId: string;
  tournamentId: string;
  name: string;
  balance: number;
  currentBet: number;
  totalContributedThisHand: number; // Total chips contributed across all betting rounds in current hand
  status: PlayerStatus;
  tableId: number | null;
  seatNumber: number;
  accessCode: string;
  rebuysCount: number;
  hasAddon: boolean;
  totalInvested: number;
}

export enum BettingRound {
  PRE_FLOP = 'PRE_FLOP',
  FLOP = 'FLOP',
  TURN = 'TURN',
  RIVER = 'RIVER',
  SHOWDOWN = 'SHOWDOWN'
}

export interface Pot {
  amount: number;
  eligiblePlayerIds: string[]; // Players eligible to win this pot
}

export interface BetAction {
  playerId: string;
  playerName: string;
  action: 'BET' | 'CALL' | 'RAISE' | 'CHECK' | 'FOLD' | 'ALL_IN';
  amount: number;
  timestamp: number;
  bettingRound: BettingRound;
}

export type BetActionType = BetAction['action'];

export interface PotDistributionState {
  pots: Pot[]; // Array of pots (main pot + side pots)
  currentPotIndex: number; // Which pot is being distributed
  selectedWinnerIds: string[]; // Players marked to receive current pot
}

export interface TableState {
  id: number;
  tournamentId: string;
  pot: number;
  currentTurn: string | null;
  dealerId: string | null;
  dealerButtonPosition: number | null; // seat number of the dealer button
  currentBlindLevel: number; // index in the blindStructure.levels array
  bettingRound: BettingRound | null; // current betting round
  currentBet: number; // current bet amount in this round
  lastRaiseAmount: number; // amount of the last raise
  handInProgress: boolean; // whether a hand is currently being played
  lastAggressorId: string | null; // player who last bet/raised, used to determine when betting round completes
  playersActedInRound: string[]; // track which players have acted in current betting round
  potDistribution: PotDistributionState | null; // Active pot distribution state during showdown
  betActions: BetAction[]; // Log of all betting actions in current hand
}

export interface GameState {
  roomTables: RoomTable[];
  tournaments: Tournament[];
  tableStates: TableState[];
  players: Player[];
  registry: RegisteredPerson[];
  smallBlind: number;
  bigBlind: number;
  activeTournamentId: string | null;
}

export type ActionType = 
  | 'REGISTER_PERSON'
  | 'DELETE_PERSON'
  | 'ADD_ROOM_TABLE'
  | 'REMOVE_ROOM_TABLE'
  | 'CREATE_TOURNAMENT'
  | 'UPDATE_TOURNAMENT'
  | 'DELETE_TOURNAMENT'
  | 'REGISTER_PLAYER_TO_TOURNAMENT'
  | 'REMOVE_PLAYER'
  | 'MOVE_PLAYER'
  | 'REBUY_PLAYER'
  | 'REENTRY_PLAYER'
  | 'START_HAND' 
  | 'BET' 
  | 'FOLD' 
  | 'CHECK' 
  | 'CALL'
  | 'RAISE'
  | 'ADVANCE_BETTING_ROUND'
  | 'START_POT_DISTRIBUTION' // Initiate manual pot distribution during showdown
  | 'TOGGLE_POT_WINNER' // Mark/unmark a player as winner for current pot
  | 'DELIVER_CURRENT_POT' // Finalize delivery of current pot to marked winners
  | 'DELIVER_ALL_ELIGIBLE_POTS' // NEW: Deliver all pots eligible to selected winner at once
  | 'AWARD_POT' // Legacy: direct award pot to a winner
  | 'RESET_HAND' 
  | 'UPDATE_BLINDS'
  | 'AUTO_BALANCE'
  | 'SET_ACTIVE_TOURNAMENT'
  | 'MOVE_DEALER_BUTTON'
  | 'ADVANCE_BLIND_LEVEL';

export interface ActionMessage {
  type: ActionType;
  payload: any;
  senderId: string;
}
