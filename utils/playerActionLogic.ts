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
