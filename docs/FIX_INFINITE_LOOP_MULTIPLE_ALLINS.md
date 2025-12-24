# Fix: Infinite Loop After Multiple All-Ins Across Different Rounds

## Issue Summary
**Problem:** After multiple players went all-in across different betting rounds (pre-flop, flop, turn), with some players folding, the remaining 2 active players would get stuck in an infinite loop. Even after both players completed their actions (check/check or bet/call), the betting round would not advance to the dealer.

**Symptoms:**
- Actions alternating repeatedly between the two remaining players
- Round never advances to dealer for the next betting round
- Game becomes unplayable, requiring manual intervention

## Root Cause Analysis

The bug was located in the `checkBettingRoundComplete` function in `App.tsx`. This function determines when a betting round is complete and control should return to the dealer.

### The Problem

```typescript
// BEFORE (buggy code)
const allPlayersActed = activePlayers.every(p => 
  tableState.playersActedInRound.includes(p.id)
);
```

The function was checking if **all active players** had acted in the current round. However, the `activePlayers` array included players with `ALL_IN` status (they were only filtered by `FOLDED` and `OUT`).

**The issue:** ALL_IN players cannot act in subsequent rounds because they have no chips left. The `canPlayerAct` function enforces this:

```typescript
export function canPlayerAct(player: Player): boolean {
  return player.status !== PlayerStatus.FOLDED &&
         player.status !== PlayerStatus.OUT &&
         player.status !== PlayerStatus.ALL_IN;
}
```

### The Scenario

1. **Pre-flop:** Player A goes all-in, marked as `ALL_IN`
2. **Flop:** Player B goes all-in, marked as `ALL_IN`
3. **Turn:** Player C goes all-in, marked as `ALL_IN`
4. **Turn:** Player D folds, marked as `FOLDED`
5. **Turn:** Only Players E and F remain active with chips

At this point, `checkBettingRoundComplete` would check:
- Players E and F: ✅ Have acted (in `playersActedInRound`)
- Players A, B, C: ❌ Not in `playersActedInRound` for current round (they went all-in in previous rounds)

Since not all "active" players had entries in `playersActedInRound`, the function returned `false`, preventing the round from completing. This caused the turn to keep cycling between Players E and F infinitely.

## The Solution

### Change 1: Filter ALL_IN Players from Action Check

```typescript
// AFTER (fixed code)
const allPlayersActed = activePlayers
  .filter(p => p.status !== PlayerStatus.ALL_IN)  // ← NEW: Exclude ALL_IN players
  .every(p => tableState.playersActedInRound.includes(p.id));
```

This ensures we only check if players **who can actually act** have acted.

### Change 2: Handle ALL_IN Last Aggressor

```typescript
// AFTER (fixed code)
if (tableState.lastAggressorId) {
  const lastAggressor = players.find(p => p.id === tableState.lastAggressorId);
  // If aggressor is all-in, they can't act, so round can complete
  if (lastAggressor && lastAggressor.status === PlayerStatus.ALL_IN) {
    return true;  // ← NEW: Allow round to complete
  }
  return tableState.playersActedInRound.includes(tableState.lastAggressorId);
}
```

If the last aggressor went all-in, they don't need to act again in subsequent rounds. The round can complete once all other players who can act have acted.

## Changes Made

### Modified Files
1. **App.tsx** (lines 153-169)
   - Added filter to exclude ALL_IN players from action check
   - Added special handling for ALL_IN last aggressor

### New Files
2. **utils/multipleAllInRounds.test.ts**
   - Comprehensive test suite with 4 test cases
   - Covers the exact scenario described in the issue
   - Tests edge cases like last aggressor being all-in
   - All tests passing ✅

## Testing

### New Tests Created
1. **Test 1:** Multiple all-ins across different rounds (issue scenario) ✅
2. **Test 2:** Last aggressor all-in ✅
3. **Test 3:** Only all-ins remaining ✅
4. **Test 4:** Active players not all acted (negative test) ✅

### Existing Tests (No Regression)
- ✅ allInPlayerActions.test.ts
- ✅ sidePotLogic.test.ts
- ✅ multiRoundSidePot.test.ts
- ✅ multiPotWinner.test.ts

### Build Status
- ✅ TypeScript compilation successful
- ✅ No type errors
- ✅ Vite build successful

## Impact Analysis

### What Changed
- **Minimal change:** Only 2 logical changes to the `checkBettingRoundComplete` function
- **Surgical fix:** No changes to game flow, turn rotation, or pot calculation
- **Safe:** All existing functionality preserved

### What's Fixed
- ✅ Betting rounds now complete correctly with multiple all-ins
- ✅ Game progresses normally after all active players act
- ✅ No more infinite loops
- ✅ All-in players from previous rounds no longer block progression

### What's Unchanged
- ❌ Player action validation (still uses `canPlayerAct`)
- ❌ Turn rotation logic (still skips ALL_IN players)
- ❌ Pot calculation and side pot logic
- ❌ All-in detection and status updates

## Verification Steps

To verify this fix manually:

1. Start a game with 6 players
2. Have Player 1 go all-in during pre-flop
3. Have Player 2 go all-in during flop
4. Have Player 3 go all-in during turn
5. Have Player 4 fold
6. With Players 5 and 6 remaining:
   - Player 5 checks
   - Player 6 checks
7. **Expected:** Round advances to dealer for river
8. **Before fix:** Round would loop back to Player 5 infinitely

## Related Issues

This fix addresses the issue reported in:
- **[BUG] Loop infinito após múltiplos all-ins em rodadas diferentes**

## Future Considerations

1. **Testing:** The test file uses a reimplementation of the logic. Consider extracting `checkBettingRoundComplete` to a utility file for better testability.

2. **Refactoring:** The function could be split into smaller, more focused helper functions:
   - `getPlayersWhoCanAct()`
   - `haveAllActivePlayersActed()`
   - `hasLastAggressorActed()`

3. **Type Safety:** Consider adding a type guard function to ensure ALL_IN players are consistently excluded across all action-related logic.

## Code Review Notes

The implementation follows the existing patterns in the codebase:
- Uses the same filtering logic as `getNextTurnId` and `areAllPlayersAllInOrCapped`
- Maintains consistency with `canPlayerAct` function
- Preserves all existing comments and documentation
- No breaking changes to the API or state structure
