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
 * Algorithm:
 * 1. Sort players by their total bet amount
 * 2. For each unique bet level, create a pot
 * 3. Each pot includes contributions from all players up to that level
 * 4. Track which players are eligible for each pot
 * 
 * @param playerBets - Array of player bet information
 * @param currentPotAmount - Current pot amount on the table
 * @returns Array of pots with amounts and eligible players
 */
export function calculateSidePots(
  playerBets: PlayerBetInfo[],
  currentPotAmount: number
): Pot[] {
  // Filter only eligible players who have bet something
  const eligibleBets = playerBets
    .filter(pb => pb.isEligible && pb.totalBet > 0)
    .sort((a, b) => a.totalBet - b.totalBet);

  if (eligibleBets.length === 0) {
    // No eligible players with bets, return single pot with all money
    const allEligiblePlayers = playerBets.filter(pb => pb.isEligible).map(pb => pb.playerId);
    return [{
      amount: currentPotAmount,
      eligiblePlayerIds: allEligiblePlayers
    }];
  }

  const pots: Pot[] = [];
  let remainingPotAmount = currentPotAmount;
  let previousBetLevel = 0;

  // Get all players who can participate (including those who bet 0 but are still eligible)
  const allPlayers = playerBets.filter(pb => pb.isEligible);

  // Process each bet level to create pots
  for (let i = 0; i < eligibleBets.length; i++) {
    const currentBetLevel = eligibleBets[i].totalBet;
    
    if (currentBetLevel > previousBetLevel) {
      // Calculate pot amount for this level
      // Count how many players contributed to this level
      const contributingPlayers = allPlayers.filter(pb => pb.totalBet >= currentBetLevel);
      const potAmount = (currentBetLevel - previousBetLevel) * contributingPlayers.length;

      if (potAmount > 0 && potAmount <= remainingPotAmount) {
        // Players eligible for this pot are those who:
        // 1. Are still in the hand (isEligible)
        // 2. Have bet at least up to this level
        const eligibleForThisPot = allPlayers
          .filter(pb => pb.totalBet >= currentBetLevel)
          .map(pb => pb.playerId);

        pots.push({
          amount: potAmount,
          eligiblePlayerIds: eligibleForThisPot
        });

        remainingPotAmount -= potAmount;
      }

      previousBetLevel = currentBetLevel;
    }
  }

  // If there's remaining amount (should rarely happen due to rounding or edge cases),
  // add it to the last pot or create a new one
  if (remainingPotAmount > 0) {
    if (pots.length > 0) {
      pots[pots.length - 1].amount += remainingPotAmount;
    } else {
      // Fallback: create a pot with all eligible players
      pots.push({
        amount: remainingPotAmount,
        eligiblePlayerIds: allPlayers.map(pb => pb.playerId)
      });
    }
  }

  return pots;
}

/**
 * Check if all remaining active players are all-in (no more actions possible)
 * 
 * A betting round should end immediately when:
 * 1. Only one player has chips remaining, OR
 * 2. All players are either all-in, folded, or out
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

  if (activePlayers.length <= 1) {
    return true;
  }

  // Count players who can still act (have chips and are not all-in)
  const playersWhoCanAct = activePlayers.filter(p => 
    p.status !== PlayerStatus.ALL_IN && p.balance > 0
  );

  // If 0 or 1 player can act, no more meaningful actions possible
  return playersWhoCanAct.length <= 1;
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
