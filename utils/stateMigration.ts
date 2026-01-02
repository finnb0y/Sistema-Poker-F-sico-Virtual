import { GameState, TableState } from '../types';

/**
 * Centralized state migration utilities
 * 
 * This module handles all backward compatibility and state migration logic
 * when the GameState schema changes over time.
 */

/**
 * Generate a dealer code
 */
const generateDealerCode = () => 'D' + Math.random().toString(36).substring(2, 5).toUpperCase();

/**
 * Migrate table states to include all required fields
 * Ensures backward compatibility when new fields are added to TableState
 */
export function migrateTableStates(tableStates: TableState[]): TableState[] {
  return tableStates.map(ts => {
    const migratedState = ts as TableState;
    
    // Migration: Add lastAggressorId (added in betting round update)
    if (!('lastAggressorId' in migratedState)) {
      migratedState.lastAggressorId = null;
    }
    
    // Migration: Add playersActedInRound (added in betting round update)
    if (!('playersActedInRound' in migratedState)) {
      migratedState.playersActedInRound = [];
    }
    
    // Migration: Add potDistribution (added for manual pot distribution)
    if (!('potDistribution' in migratedState)) {
      migratedState.potDistribution = null;
    }
    
    // Migration: Add betActions (added for bet action logging)
    if (!('betActions' in migratedState)) {
      migratedState.betActions = [];
    }
    
    // Migration: Add dealerAccessCode (added for dealer access)
    if (!('dealerAccessCode' in migratedState) || !migratedState.dealerAccessCode) {
      migratedState.dealerAccessCode = generateDealerCode();
    }
    
    return migratedState;
  });
}

/**
 * Migrate game state to include clubs support
 * Ensures backward compatibility when clubs system was added
 */
export function migrateToClubsSupport(state: GameState): GameState {
  // Migration: Add clubs array if not present
  if (!('clubs' in state)) {
    state.clubs = [];
  }
  
  // Migration: Add activeClubId if not present
  if (!('activeClubId' in state)) {
    state.activeClubId = null;
  }
  
  // Migration: Add clubId to existing RoomTables if not present
  if (state.roomTables) {
    state.roomTables = state.roomTables.map(rt => {
      if (!('clubId' in rt)) {
        return { ...rt, clubId: undefined };
      }
      return rt;
    });
  }
  
  // Migration: Add clubId to existing RegisteredPersons if not present
  if (state.registry) {
    state.registry = state.registry.map(r => {
      if (!('clubId' in r)) {
        return { ...r, clubId: undefined };
      }
      return r;
    });
  }
  
  return state;
}

/**
 * Apply all migrations to a loaded game state
 * This is the main entry point for state migration
 */
export function migrateGameState(state: GameState): GameState {
  // Migrate table states
  state.tableStates = migrateTableStates(state.tableStates);
  
  // Migrate to clubs support
  state = migrateToClubsSupport(state);
  
  // Add future migrations here as needed
  
  return state;
}
