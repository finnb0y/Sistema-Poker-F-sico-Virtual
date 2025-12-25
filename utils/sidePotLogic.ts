import { Player, PlayerStatus, Pot } from '../types';

/**
 * Side Pot Logic Utility Functions
 * 
 * This module handles the calculation and management of side pots in poker games,
 * which occur when one or more players go all-in with different stack sizes.
 * 
 * Key Concepts:
 * - Main Pot: All players (who haven't folded) can win this pot
 * - Side Pots: Created when players go all-in with different amounts
 * - Each pot has a specific set of eligible players who can win it
 */

export interface PlayerBetInfo {
  playerId: string;
  totalBet: number; // Total amount this player has bet in the current hand
  isEligible: boolean; // Whether player is eligible (not folded/out)
}

/**
 * Calculate all pots (main pot + side pots) based on player bets
 * 
 * Algorithm (adapted from Poker-Fichas "layer peeling" approach):
 * 1. Create a mutable copy of all player bets (the "pool" of money to distribute)
 * 2. While there are still bets remaining:
 *    a. Find the minimum bet amount (the "layer")
 *    b. Create a pot from all players at this layer
 *    c. Subtract the layer from all remaining bets
 *    d. Remove players who have no more bets remaining
 * 3. Track eligible players for each pot (those who contributed and didn't fold)
 * 
 * This approach is more intuitive and easier to reason about than the previous
 * implementation, as it directly models the "peeling away" of bet layers.
 * 
 * @param playerBets - Array of player bet information
 * @param currentPotAmount - Current pot amount on the table
 * @returns Array of pots with amounts and eligible players
 */
export function calculateSidePots(
  playerBets: PlayerBetInfo[],
  currentPotAmount: number
): Pot[] {
  // Handle edge case: no eligible players with bets
  const eligiblePlayers = playerBets.filter(pb => pb.isEligible);
  const playersWithBets = eligiblePlayers.filter(pb => pb.totalBet > 0);
  
  if (playersWithBets.length === 0) {
    // No one bet anything, return single pot with all money to all eligible players
    return [{
      amount: currentPotAmount,
      eligiblePlayerIds: eligiblePlayers.map(pb => pb.playerId)
    }];
  }

  const pots: Pot[] = [];
  
  // Create a mutable copy of bets remaining to be allocated
  // Map of playerId -> remaining bet amount
  const remainingBets = new Map<string, number>();
  playersWithBets.forEach(pb => {
    remainingBets.set(pb.playerId, pb.totalBet);
  });

  // Iterate while there are still bets to allocate
  while (remainingBets.size > 0) {
    // Find the minimum bet amount (the "layer" for this pot)
    const layerAmount = Math.min(...Array.from(remainingBets.values()));
    
    if (layerAmount === 0) {
      // Safety check: all remaining bets are 0
      break;
    }

    // Calculate pot value: layer amount × number of contributing players
    let potValue = 0;
    const eligibleForThisPot: string[] = [];

    // Process all players still in the betting pool
    const playerIds = Array.from(remainingBets.keys());
    for (const playerId of playerIds) {
      const playerBet = remainingBets.get(playerId)!;
      
      // Add this player's contribution to the pot
      potValue += layerAmount;
      
      // This player is eligible for this pot
      eligibleForThisPot.push(playerId);
      
      // Subtract the layer from this player's remaining bet
      const newRemainingBet = playerBet - layerAmount;
      
      if (newRemainingBet === 0) {
        // Player has no more chips to contribute, remove from pool
        remainingBets.delete(playerId);
      } else {
        // Player still has chips, update their remaining bet
        remainingBets.set(playerId, newRemainingBet);
      }
    }

    // Create the pot if it has value
    if (potValue > 0) {
      pots.push({
        amount: potValue,
        eligiblePlayerIds: eligibleForThisPot
      });
    }
  }

  // Validate that we allocated all the money correctly
  const totalAllocated = pots.reduce((sum, pot) => sum + pot.amount, 0);
  if (totalAllocated !== currentPotAmount) {
    // This should rarely happen, but handle rounding/edge cases
    const difference = currentPotAmount - totalAllocated;
    if (pots.length > 0) {
      pots[pots.length - 1].amount += difference;
    } else {
      // Fallback: create a pot with all eligible players
      pots.push({
        amount: currentPotAmount,
        eligiblePlayerIds: eligiblePlayers.map(pb => pb.playerId)
      });
    }
  }

  return pots;
}

/**
 * Check if all remaining active players are all-in (no more actions possible)
 * 
 * A betting round should end immediately when:
 * 1. One or fewer players remain (winner by default), OR
 * 2. All players are either all-in, folded, or out (no one can act)
 * 
 * Note: If exactly one player can still act while others are all-in,
 * that player should get the opportunity to call/fold the all-in bet.
 * 
 * @param players - All players at the table
 * @param tableId - The table ID to check
 * @returns true if no more betting actions are possible
 */
export function areAllPlayersAllInOrCapped(
  players: Player[],
  tableId: number
): boolean {
  const activePlayers = players.filter(p => 
    p.tableId === tableId && 
    p.status !== PlayerStatus.FOLDED && 
    p.status !== PlayerStatus.OUT
  );

  // If one or fewer players remain, hand is over
  if (activePlayers.length <= 1) {
    return true;
  }

  // Count players who can still act (have chips and are not all-in)
  const playersWhoCanAct = activePlayers.filter(p => 
    p.status !== PlayerStatus.ALL_IN && p.balance > 0
  );

  // If NO players can act, betting round is complete
  // If 1+ players can act, betting should continue (they need to respond to all-ins)
  return playersWhoCanAct.length === 0;
}

/**
 * Prepare player bet information from the current game state
 * 
 * Uses player.totalContributedThisHand which tracks the total chips contributed
 * across all betting rounds in the current hand (pre-flop, flop, turn, river).
 * 
 * @param players - All players at the table
 * @param tableId - The table ID
 * @returns Array of player bet information for side pot calculation
 */
export function preparePlayerBetsForPotCalculation(
  players: Player[],
  tableId: number
): PlayerBetInfo[] {
  return players
    .filter(p => p.tableId === tableId)
    .map(p => ({
      playerId: p.id,
      totalBet: p.totalContributedThisHand,
      isEligible: p.status !== PlayerStatus.FOLDED && p.status !== PlayerStatus.OUT
    }));
}
