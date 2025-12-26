import { Player, PlayerStatus, Pot } from '../types';

/**
 * Side Pot Logic Utility Functions
 * 
 * This module handles the calculation and management of side pots in poker games,
 * which occur when one or more players go all-in with different stack sizes.
 * 
 * Key Concepts:
 * - Main Pot: All eligible players (who haven't folded) can win this pot
 * - Side Pots: Created when players go all-in with different amounts
 * - Each pot has a specific set of eligible players who can win it
 * - Folded players' contributions stay in the pot but they cannot win
 * 
 * Mathematical Approach:
 * The algorithm uses a "layer peeling" approach to calculate pots:
 * 1. All players who made bets are included in calculations (even folded players)
 * 2. Find the minimum bet amount (the "layer")
 * 3. Create a pot from all contributing players at this layer
 * 4. Only eligible (non-folded) players can win each pot
 * 5. Subtract the layer from all bets and repeat
 * 
 * Example with folded player:
 * - P1: all-in 10k (eligible)
 * - P2: calls 10k then folds (NOT eligible)
 * - P3: raises to 30k (eligible)
 * - P4: calls 30k (eligible)
 * 
 * Result:
 * - Main pot: 10k × 4 = 40k (P1, P3, P4 eligible - P2's money included but cannot win)
 * - Side pot: 20k × 2 = 40k (P3, P4 eligible)
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
 * 1. Include ALL player bets in calculations (even folded players)
 * 2. While there are still bets remaining:
 *    a. Find the minimum bet amount (the "layer")
 *    b. Create pot value by multiplying layer amount by the number of all contributing 
 *       players (including folded players who contributed to this layer)
 *    c. Track only eligible (non-folded) players for winning
 *    d. Subtract the layer from all remaining bets
 *    e. Remove players who have no more bets remaining
 * 3. Each pot includes money from all contributors, but only eligible players can win
 * 
 * This approach ensures that:
 * - Folded players' contributions remain in the pot (correct poker rules)
 * - Folded players cannot win any pot (correct poker rules)
 * - Players compete only in pots they contributed to
 * - All money is properly allocated
 * 
 * @param playerBets - Array of player bet information (includes folded players)
 * @param currentPotAmount - Current pot amount on the table
 * @returns Array of pots with amounts and eligible players
 */
export function calculateSidePots(
  playerBets: PlayerBetInfo[],
  currentPotAmount: number
): Pot[] {
  // Get all players who made bets (including folded players)
  // Folded players' chips stay in the pot, they just can't win
  const playersWithBets = playerBets.filter(pb => pb.totalBet > 0);
  
  if (playersWithBets.length === 0) {
    // No one bet anything, return single pot with all eligible (non-folded) players
    const eligiblePlayers = playerBets.filter(pb => pb.isEligible);
    return [{
      amount: currentPotAmount,
      eligiblePlayerIds: eligiblePlayers.map(pb => pb.playerId)
    }];
  }

  const pots: Pot[] = [];
  
  // Create a mutable copy of bets remaining to be allocated
  // Map of playerId -> remaining bet amount
  // This includes ALL players who bet, even if they folded
  const remainingBets = new Map<string, number>();
  playersWithBets.forEach(pb => {
    remainingBets.set(pb.playerId, pb.totalBet);
  });
  
  // Create a map for quick eligibility lookup
  const eligibilityMap = new Map<string, boolean>();
  playerBets.forEach(pb => {
    eligibilityMap.set(pb.playerId, pb.isEligible);
  });

  // Iterate while there are still bets to allocate
  while (remainingBets.size > 0) {
    // Find the minimum bet amount (the "layer" for this pot)
    // Use a loop instead of spread operator for better performance with many players
    let layerAmount = Infinity;
    for (const bet of remainingBets.values()) {
      if (bet < layerAmount) {
        layerAmount = bet;
      }
    }
    
    if (layerAmount === 0 || layerAmount === Infinity) {
      // Safety check: all remaining bets are 0 or no valid bets
      break;
    }

    // Process all players still in the betting pool to calculate pot value and eligibility
    let potValue = 0;
    const eligibleForThisPot: string[] = [];

    const playerIds = Array.from(remainingBets.keys());
    for (const playerId of playerIds) {
      const playerBet = remainingBets.get(playerId)!;
      
      // Add this player's contribution to the pot (even if they folded)
      potValue += layerAmount;
      
      // Only add to eligible list if player hasn't folded
      if (eligibilityMap.get(playerId)) {
        eligibleForThisPot.push(playerId);
      }
      
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
  // Use epsilon tolerance for floating point comparison
  const totalAllocated = pots.reduce((sum, pot) => sum + pot.amount, 0);
  const difference = currentPotAmount - totalAllocated;
  const EPSILON = 0.01; // Tolerance for floating point precision issues
  
  if (Math.abs(difference) > EPSILON) {
    // This should rarely happen, but handle rounding/edge cases
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
