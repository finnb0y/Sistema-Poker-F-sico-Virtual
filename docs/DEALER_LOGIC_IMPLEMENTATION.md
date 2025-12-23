# Dealer Logic Implementation - Summary

## Overview

This implementation provides a complete dealer button and blind management system for poker games, with proper handling of different player counts and betting rounds according to standard poker rules.

## Key Features Implemented

### 1. Dealer Button Management

- **Initial Setup**: Dealer button is set manually for the first hand only using the "Mover Dealer" button in the dealer interface
- **Automatic Rotation**: After each hand, the button automatically moves clockwise to the next active player
- **Button Tracking**: The `dealerButtonPosition` field in `TableState` stores the seat number of the current button position

### 2. Blind Positions

#### Heads-Up (2 Players)
- **Dealer Button** = **Small Blind** (same player)
- **Other Player** = Big Blind
- This follows standard heads-up poker rules

#### 3+ Players
- **Small Blind**: First player to the left of the dealer button
- **Big Blind**: First player to the left of the small blind
- Standard multi-player poker configuration

### 3. Action Order

#### Pre-Flop
- **2 Players**: Small blind (dealer) acts first
- **3 Players**: UTG (player left of big blind, which wraps to dealer)
- **4+ Players**: UTG (player left of big blind)

#### Post-Flop (Flop, Turn, River)
- Action always starts with the **first active player** to the left of the dealer button
- This is typically the small blind position
- If small blind has folded, action starts with the next active player clockwise

### 4. Automatic Blind Posting

When a hand starts (SOLTAR MÃO button):
1. System automatically determines blind positions based on dealer button
2. Small blind amount is deducted from small blind player's stack
3. Big blind amount is deducted from big blind player's stack
4. Amounts are added to the pot
5. Current bet is set to big blind amount
6. First player to act is determined based on player count

## Implementation Details

### New Files

**`utils/dealerLogic.ts`** - Core dealer logic functions:

```typescript
// Calculate all positions for a hand
calculateDealerPositions(players, dealerButtonPosition)
  → Returns: { dealerIdx, smallBlindIdx, bigBlindIdx, firstToActIdx }

// Get first to act post-flop
getPostFlopFirstToAct(players, dealerButtonPosition)
  → Returns: index of first active player left of button

// Move button to next player
moveButtonToNextPlayer(players, currentPosition)
  → Returns: seat number of next button position

// Get active players at table
getActivePlayers(allPlayers, tableId, excludeStatuses)
  → Returns: sorted array of active players
```

### Modified Files

**`App.tsx`** - Updated action handlers:

- `MOVE_DEALER_BUTTON`: Uses new button movement logic
- `START_HAND`: Uses position calculation for blinds and action order
- `ADVANCE_BETTING_ROUND`: Uses post-flop action calculation

## Usage in Dealer Interface

### Starting a New Hand

1. Click "MOVER DEALER" button to position the dealer button (first hand only, or to correct position)
2. Click "SOLTAR MÃO" button to start the hand
   - Blinds are automatically posted
   - Action order is automatically determined
   - Current turn indicator shows who acts first

### Between Hands

1. Award pot to winner
2. (Optional) Move dealer button automatically by clicking "MOVER DEALER" or it will move on next hand
3. Start next hand

## Testing

Comprehensive tests validate:
- ✅ 2-player (heads-up) blind and action positions
- ✅ 3-player positions with UTG wrap-around
- ✅ 4+ player standard positions
- ✅ Button movement and wrap-around
- ✅ Initial button setup
- ✅ Post-flop action with folded players

See `utils/dealerLogicManualTest.ts` for test code and `utils/dealerLogic.test.md` for detailed test scenarios.

## Poker Rules Reference

This implementation follows standard Texas Hold'em poker rules:

### Heads-Up Exception
In heads-up play, the dealer button posts the small blind and acts first pre-flop but acts last post-flop. This is different from full-ring games and is correctly implemented.

### Standard Multi-Player
With 3+ players, action proceeds clockwise with:
- Pre-flop: UTG (left of BB) acts first, BB acts last
- Post-flop: SB (left of button) acts first, Button acts last

## Future Enhancements

Potential improvements for future iterations:

1. **Visual Button Indicator**: Show dealer button graphically on the table view
2. **Action Timer**: Add countdown timer for each player's action
3. **Blind Level Automation**: Auto-advance blinds based on configured duration
4. **Hand History**: Log button position and action sequence for each hand
5. **Dead Button Rules**: Handle situations where button is eliminated mid-tournament

## Technical Notes

- All functions are pure and testable in isolation
- Player positions are always sorted by seat number for consistency
- Index-based calculations use modulo to handle wrap-around
- Status filtering ensures only eligible players are considered for positions
- The implementation is defensive against edge cases (empty tables, missing players, etc.)
