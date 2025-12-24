import { Player, PlayerStatus } from '../types';

/**
 * Player Action Utility Functions
 * 
 * Helper functions to determine if a player can perform actions during gameplay.
 */

/**
 * Check if a player can perform an action based on their status
 * 
 * A player can act if they are not:
 * - Folded (already out of the hand)
 * - Out (eliminated from tournament)
 * - All-In (no chips left to bet)
 * 
 * @param player - The player to check
 * @returns true if player can perform actions, false otherwise
 */
export function canPlayerAct(player: Player): boolean {
  return player.status !== PlayerStatus.FOLDED &&
         player.status !== PlayerStatus.OUT &&
         player.status !== PlayerStatus.ALL_IN;
}

/**
 * Get players who can still act at a table
 * 
 * Filters out players who are folded, out, or all-in.
 * 
 * @param players - All players in the game
 * @param tableId - The table ID to filter by
 * @returns Array of players who can still act
 */
export function getPlayersWhoCanAct(players: Player[], tableId: number): Player[] {
  return players.filter(p => p.tableId === tableId && canPlayerAct(p));
}

/**
 * Check if a player should be included in turn rotation
 * 
 * Players are included in turn rotation if they can perform actions.
 * This excludes players who are folded, out, or all-in.
 * 
 * @param player - The player to check
 * @returns true if player should be in turn rotation, false otherwise
 */
export function shouldIncludeInTurnRotation(player: Player): boolean {
  return canPlayerAct(player);
}
