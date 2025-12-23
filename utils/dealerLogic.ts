import { Player, PlayerStatus } from '../types';

export interface DealerPositions {
  dealerIdx: number;
  smallBlindIdx: number;
  bigBlindIdx: number;
  firstToActIdx: number;
}

/**
 * Calculate dealer, blind, and action positions based on player count and dealer button
 * @param players - Array of players at the table (sorted by seat number)
 * @param dealerButtonPosition - Current dealer button seat number
 * @returns Positions for dealer, blinds, and first to act
 */
export function calculateDealerPositions(
  players: Player[],
  dealerButtonPosition: number
): DealerPositions | null {
  if (players.length < 2) return null;

  const dealerIdx = players.findIndex(p => p.seatNumber === dealerButtonPosition);
  if (dealerIdx === -1) return null;

  const playerCount = players.length;

  if (playerCount === 2) {
    // Heads-up (2 players): Dealer is small blind, other player is big blind
    const smallBlindIdx = dealerIdx;
    const bigBlindIdx = (dealerIdx + 1) % playerCount;
    // In heads-up, small blind (dealer) acts first pre-flop
    const firstToActIdx = smallBlindIdx;
    
    return { dealerIdx, smallBlindIdx, bigBlindIdx, firstToActIdx };
  } else {
    // 3+ players: Small blind is left of dealer, big blind is left of small blind
    const smallBlindIdx = (dealerIdx + 1) % playerCount;
    const bigBlindIdx = (smallBlindIdx + 1) % playerCount;
    // Action starts at UTG (left of big blind) for 3+ players
    const firstToActIdx = (bigBlindIdx + 1) % playerCount;
    
    return { dealerIdx, smallBlindIdx, bigBlindIdx, firstToActIdx };
  }
}

/**
 * Get the first player to act in post-flop betting rounds
 * @param players - Array of active players at the table (sorted by seat number)
 * @param dealerButtonPosition - Current dealer button seat number
 * @returns Index of first player to act, or -1 if no valid player
 */
export function getPostFlopFirstToAct(
  players: Player[],
  dealerButtonPosition: number
): number {
  if (players.length === 0) return -1;

  const dealerIdx = players.findIndex(p => p.seatNumber === dealerButtonPosition);
  if (dealerIdx === -1) {
    // If dealer button position has no active player, start from first active player
    return 0;
  }

  // Post-flop action starts with first active player to the left of dealer button
  // This is effectively the small blind position (or next active player if SB folded)
  return (dealerIdx + 1) % players.length;
}

/**
 * Move dealer button to the next player position
 * @param players - Array of players at the table (sorted by seat number)
 * @param currentDealerPosition - Current dealer button seat number
 * @returns New dealer button seat number
 */
export function moveButtonToNextPlayer(
  players: Player[],
  currentDealerPosition: number | null
): number | null {
  if (players.length === 0) return null;

  if (currentDealerPosition === null) {
    // First time setting dealer button - use first player's seat
    return players[0].seatNumber;
  }

  const currentIdx = players.findIndex(p => p.seatNumber === currentDealerPosition);
  
  if (currentIdx === -1) {
    // Current dealer button position no longer has a player
    return players[0].seatNumber;
  }

  // Move to next player clockwise
  const nextIdx = (currentIdx + 1) % players.length;
  return players[nextIdx].seatNumber;
}

/**
 * Get active players at a table, sorted by seat number and filtered by status
 * @param allPlayers - All players in the game
 * @param tableId - Table ID to filter by
 * @param excludeStatuses - Array of statuses to exclude (defaults to OUT only)
 * @returns Sorted array of active players
 */
export function getActivePlayers(
  allPlayers: Player[],
  tableId: number,
  excludeStatuses: PlayerStatus[] = [PlayerStatus.OUT]
): Player[] {
  return allPlayers
    .filter(p => 
      p.tableId === tableId && 
      !excludeStatuses.includes(p.status)
    )
    .sort((a, b) => a.seatNumber - b.seatNumber);
}
