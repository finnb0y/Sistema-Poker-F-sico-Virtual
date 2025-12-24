# Fix: All-In Player Actions and Side Pot Distribution

## Problem Statement (Portuguese)
Necessário corrigir e implementar melhorias na estrutura de side pots e ações durante o jogo para lidar com jogadores em all-in e distribuição correta de potes no showdown.

### Problemas Identificados:
1. **Jogadores em all-in com ações disponíveis:**
   - Jogadores em all-in ainda podiam realizar ações como check ou fold. Isso não deve ocorrer.
   - Jogadores em all-in devem estar automaticamente obrigados a comparecer no showdown (sem opções de fold/check), tendo apenas cartas vivas e nenhuma ação adicional disponível.

2. **Sistema de distribuição de potes no showdown:**
   - Verificar se o sistema permite que jogadores vencedores possam disputar múltiplos pots baseado na força de suas mãos e contribuição para os pots.

---

## Solution Summary

### Problem 1: ALL_IN Players Taking Actions ✅ FIXED

**Changes Made:**

1. **Updated `getNextTurnId` function in App.tsx:**
   - Added `PlayerStatus.ALL_IN` to the filter exclusion list
   - ALL_IN players are now skipped in turn rotation, just like FOLDED and OUT players
   - When only ALL_IN players remain, the function returns `null` (no more turns needed)

2. **Added ALL_IN status checks to all action handlers:**
   - `FOLD`: Added check `foldPlayer.status !== PlayerStatus.ALL_IN`
   - `CHECK`: Added check `checkPlayer.status !== PlayerStatus.ALL_IN`
   - `CALL`: Added check `callPlayer.status !== PlayerStatus.ALL_IN`
   - `BET`: Added check `bP.status !== PlayerStatus.ALL_IN`
   - `RAISE`: Added check `raisePlayer.status !== PlayerStatus.ALL_IN`

**Result:**
- ✅ ALL_IN players cannot perform any actions
- ✅ Turn rotation automatically skips ALL_IN players
- ✅ When all remaining players are ALL_IN, betting round ends automatically
- ✅ ALL_IN players will automatically proceed to showdown

### Problem 2: Multi-Pot Winner Distribution ✅ VERIFIED CORRECT

**Analysis:**

The current implementation already handles multi-pot winners correctly:

1. **Pot Eligibility is Calculated Once:**
   - During `START_POT_DISTRIBUTION`, all pots are calculated with their `eligiblePlayerIds`
   - These eligible player lists are based on bet amounts and never modified

2. **Winners Can Win Multiple Pots:**
   - When `DELIVER_CURRENT_POT` is called, it distributes the current pot to winners
   - The system then moves to the next pot (increments `currentPotIndex`)
   - Winners are NOT removed from subsequent pot eligibility lists
   - A player with the best hand can win all pots they're eligible for

3. **Hierarchical Pot Distribution:**
   - Pots are distributed from smallest (main pot) to largest (side pots)
   - Each pot has its own eligibility list based on player contributions
   - Players who invested less cannot win larger side pots (correctly implemented)
   - Players who invested more can win multiple pots (correctly implemented)

**Result:**
- ✅ Players can win multiple pots based on hand strength
- ✅ Eligibility is preserved across pot distributions
- ✅ Winners are NOT excluded from subsequent pots
- ✅ Current implementation is correct - no changes needed

---

## Test Coverage

### New Tests Created:

1. **`utils/allInPlayerActions.test.ts`** (7 tests):
   - ✅ All-In Player Skipped in Turn Rotation
   - ✅ Multiple All-In Players Skipped
   - ✅ All Players All-In Returns No Turn
   - ✅ Only One Active Player Returns No Turn
   - ✅ All-In Player Cannot Perform Actions
   - ✅ Active Player Can Perform Actions
   - ✅ Folded Players Also Skipped

2. **`utils/multiPotWinner.test.ts`** (5 tests):
   - ✅ Player Can Win Multiple Consecutive Pots
   - ✅ Player Wins Multiple Pots But Not All
   - ✅ Largest Stack Player Wins All Pots
   - ✅ Player Can Win Multiple Split Pots
   - ✅ Winner Eligibility Is Never Removed After Winning

### Existing Tests:
- ✅ All original `sidePotLogic.test.ts` tests passing (4/4)
- ✅ All original `multiRoundSidePot.test.ts` tests passing (3/3)

**Total: 19/19 tests passing**

---

## Code Changes

### File: `App.tsx`

#### Change 1: `getNextTurnId` function (line ~75)
```typescript
// BEFORE:
const tablePlayers = players.filter(p => 
  p.tableId === tableId && 
  p.status !== PlayerStatus.FOLDED && 
  p.status !== PlayerStatus.OUT
);

// AFTER:
const tablePlayers = players.filter(p => 
  p.tableId === tableId && 
  p.status !== PlayerStatus.FOLDED && 
  p.status !== PlayerStatus.OUT &&
  p.status !== PlayerStatus.ALL_IN  // NEW: Skip ALL_IN players
);
```

#### Change 2: FOLD handler (line ~384)
```typescript
// BEFORE:
if (tState && tState.currentTurn === senderId) {

// AFTER:
if (tState && tState.currentTurn === senderId && foldPlayer.status !== PlayerStatus.ALL_IN) {
```

#### Change 3: CHECK handler (line ~408)
```typescript
// BEFORE:
if (tState && tState.currentTurn === senderId) {

// AFTER:
if (tState && tState.currentTurn === senderId && checkPlayer.status !== PlayerStatus.ALL_IN) {
```

#### Change 4: CALL handler (line ~434)
```typescript
// BEFORE:
if (tState && tState.currentTurn === senderId) {

// AFTER:
if (tState && tState.currentTurn === senderId && callPlayer.status !== PlayerStatus.ALL_IN) {
```

#### Change 5: BET handler (line ~343)
```typescript
// BEFORE:
if (tState && tState.currentTurn === senderId) {

// AFTER:
if (tState && tState.currentTurn === senderId && bP.status !== PlayerStatus.ALL_IN) {
```

#### Change 6: RAISE handler (line ~703)
```typescript
// BEFORE:
if (tableForRaise) {

// AFTER:
if (tableForRaise && raisePlayer.status !== PlayerStatus.ALL_IN) {
```

---

## Example Scenarios

### Scenario 1: Player Goes All-In Pre-Flop
```
Initial state:
- P1: 500 chips (goes all-in pre-flop)
- P2: 2000 chips (calls)
- P3: 3000 chips (calls)

BEFORE FIX:
- Pre-flop: P1 goes all-in
- Flop: P1 gets a turn and can check/fold ❌ WRONG
- Turn: P1 gets a turn and can check/fold ❌ WRONG

AFTER FIX:
- Pre-flop: P1 goes all-in → status = ALL_IN
- Flop: Turn rotation skips P1 (only P2 and P3 act) ✅ CORRECT
- Turn: Turn rotation skips P1 (only P2 and P3 act) ✅ CORRECT
- River: Turn rotation skips P1 (only P2 and P3 act) ✅ CORRECT
- Showdown: P1 automatically participates ✅ CORRECT
```

### Scenario 2: Multiple All-Ins, One Player Wins Multiple Pots
```
Player bets:
- P1: 500 (all-in, weakest hand)
- P2: 1000 (all-in, medium hand)
- P3: 2000 (best hand)

Pots created:
- Pot 1: 1500 (all 3 players eligible)
- Pot 2: 1500 (P2 and P3 eligible)
- Pot 3: 1000 (P3 only)

Showdown with P3 having best hand:
- P3 wins Pot 1: 1500 ✅
- P3 wins Pot 2: 1500 ✅
- P3 wins Pot 3: 1000 ✅
- Total: P3 wins all 4000 chips ✅

The fix ensures P3 is NOT removed from eligibility after winning Pot 1.
```

---

## Impact on Gameplay

### Before Fix:
1. ❌ ALL_IN players could fold (losing their investment unnecessarily)
2. ❌ ALL_IN players could check (wasting time in UI)
3. ❌ Turn rotation included ALL_IN players (confusion in gameplay)
4. ❌ Betting rounds didn't advance when only ALL_IN players remained

### After Fix:
1. ✅ ALL_IN players automatically skip turns
2. ✅ ALL_IN players cannot perform any actions
3. ✅ ALL_IN players automatically proceed to showdown
4. ✅ Betting rounds advance immediately when appropriate
5. ✅ Players can win multiple pots based on hand strength
6. ✅ Clear and fair pot distribution based on investment hierarchy

---

## Technical Notes

### Why Skip ALL_IN Players in Turn Rotation?

In poker, when a player goes all-in:
1. They have committed all their chips
2. They cannot bet, raise, call more, check, or fold
3. They must remain in the hand until showdown
4. Their hand is "live" but they have no actions available

By excluding ALL_IN players from `getNextTurnId`, we ensure:
- The game flow continues smoothly without them
- UI doesn't prompt them for actions they cannot take
- Betting rounds complete faster when multiple players are all-in

### Why Add Status Checks to Action Handlers?

Defense in depth: Even if a player somehow attempts an action while ALL_IN (e.g., through direct API call or race condition), the action handler will reject it. This prevents:
- Invalid state transitions
- Data inconsistencies
- Exploitation of edge cases

### Why Is Problem 2 Already Correct?

The key insight is that `eligiblePlayerIds` are calculated once during `START_POT_DISTRIBUTION` and stored in the `PotDistributionState`. When distributing pots:
1. System iterates through pots by index
2. Each pot retains its original eligibility list
3. Winners receive chips but eligibility lists never change
4. Next pot uses its own preserved eligibility list

This design naturally allows players to win multiple pots, which is the correct poker behavior.

---

## Running Tests

```bash
# Run all-in player action tests
npx tsx utils/allInPlayerActions.test.ts

# Run multi-pot winner tests
npx tsx utils/multiPotWinner.test.ts

# Run original side pot tests
npx tsx utils/sidePotLogic.test.ts

# Run multi-round side pot tests
npx tsx utils/multiRoundSidePot.test.ts

# Build the project
npm run build
```

All tests should pass with ✅ indicators.

---

## Conclusion

This fix ensures proper handling of ALL_IN players in the poker game:

1. **Problem 1 (ALL_IN Actions)**: ✅ FIXED
   - ALL_IN players can no longer take actions
   - Turn rotation automatically skips them
   - They proceed directly to showdown

2. **Problem 2 (Multi-Pot Winners)**: ✅ VERIFIED CORRECT
   - Current implementation already handles this correctly
   - Players can win multiple pots based on hand strength
   - No code changes needed for this issue

The implementation now matches standard poker rules for all-in situations and side pot distribution.
