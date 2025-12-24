# Fix: All-In Action Issues, Zero-Balance Players, and Side Pot Visualization

## Problem Statement (Portuguese - From Issue)

### 1. Ação pendente após all-in
Quando quase todos os jogadores vão all-in em mãos diferentes (por exemplo, pré-flop e flop), o sistema estava entendendo que todos estão em all-in assim que o penúltimo jogador vai all-in. Porém, o último jogador com fichas ainda deveria ter a opção de pagar ou dar fold ao all-in dos outros, mas não estava recebendo essa escolha.

### 2. Manutenção de jogadores sem fichas
Jogadores que ficam com zero fichas permaneciam ativos na mesa. Eles continuavam pagando blinds (ficando com saldo negativo) e podendo "pagar" ações mesmo sem fichas, indo direto para all-in negativo.

### 3. Visualização dos potes paralelos (side pots)
Não estava claro se a separação e distribuição dos potes estava correta. Era necessário mostrar na interface indicadores dos potes paralelos/side pots, além do pote total.

---

## Solutions Implemented

### Solution 1: Last Player with Chips Now Gets Action ✅

**Root Cause:**
The function `areAllPlayersAllInOrCapped` was returning `true` when there was exactly **1 player** who could act, causing the betting round to end prematurely before that player got a chance to call/fold the all-in bets.

**The Fix:**
Changed the logic in `utils/sidePotLogic.ts`:

```typescript
// BEFORE (INCORRECT):
return playersWhoCanAct.length <= 1;  // ❌ Returns true if 1 or 0 can act

// AFTER (CORRECT):
return playersWhoCanAct.length === 0;  // ✅ Only returns true if 0 can act
```

**Why This Works:**
- If **0 players** can act → Everyone is all-in, betting round complete ✅
- If **1 player** can act → They should get to call/fold the all-ins ✅
- If **2+ players** can act → Normal betting continues ✅

**Example Scenario:**
```
Before Fix:
- P1, P2, P3, P4, P5 go all-in
- P6 has 1000 chips
- System: "Only 1 player can act, round complete" ❌
- P6 never gets action

After Fix:
- P1, P2, P3, P4, P5 go all-in
- P6 has 1000 chips
- System: "1 player can still act, continue" ✅
- P6 gets to call/fold before showdown
```

---

### Solution 2: Zero-Balance Players Marked as OUT ✅

**Problem:**
Players with 0 chips were:
- Staying active at the table
- Posting blinds with insufficient balance → negative balance
- Continuing to play with negative balances

**The Fix:**
Modified `START_HAND` action in `App.tsx`:

```typescript
// Mark players with zero or negative balance as OUT
const allTablePlayers = newState.players.filter(p => p.tableId === payload.tableId);
allTablePlayers.forEach(p => {
  if (p.balance <= 0 && p.status !== PlayerStatus.OUT) {
    p.status = PlayerStatus.OUT;
  }
});
```

**Blind Posting Protection:**
```typescript
// Small blind - can only post what they have
const sbAmount = Math.min(currentBlindLevel.smallBlind, sbPlayer.balance);
sbPlayer.balance -= sbAmount;
sbPlayer.currentBet = sbAmount;
sbPlayer.totalContributedThisHand = sbAmount;
tableForHand.pot += sbAmount;
if (sbPlayer.balance === 0) {
  sbPlayer.status = PlayerStatus.ALL_IN;
}

// Same for big blind
const bbAmount = Math.min(currentBlindLevel.bigBlind, bbPlayer.balance);
// ... rest of code
```

**Post-Hand Cleanup:**
```typescript
// In DELIVER_CURRENT_POT - mark losers as OUT
newState.players.filter(p => p.tableId === tableForDelivery.id).forEach(p => {
  p.currentBet = 0;
  p.totalContributedThisHand = 0;
  if (p.balance <= 0) {
    p.status = PlayerStatus.OUT;  // ← NEW
  } else if (p.status !== PlayerStatus.OUT) {
    p.status = PlayerStatus.SITTING;
  }
});
```

**Benefits:**
- ✅ No more negative balances
- ✅ Players with 0 chips are excluded from hands
- ✅ Partial blind posting for short stacks (goes all-in)
- ✅ Clean player elimination when busted

---

### Solution 3: Side Pot Visualization on Table ✅

**Problem:**
Side pots were only visible during manual distribution in the dealer interface. Players couldn't see:
- How many side pots existed
- Which pots they were eligible for
- The breakdown of pot amounts

**The Fix:**
Modified `components/TableView.tsx` to display side pots dynamically:

```typescript
// Calculate side pots when all-in players are present
const sidePots = useMemo(() => {
  if (!tableState?.handInProgress) return null;
  
  const tablePlayers = state.players.filter(p => p.tableId === tableId);
  const hasAllInPlayers = tablePlayers.some(p => p.status === PlayerStatus.ALL_IN);
  
  if (!hasAllInPlayers) return null;
  
  // Calculate potential side pots based on current bets
  const playerBets = preparePlayerBetsForPotCalculation(state.players, tableId);
  const pots = calculateSidePots(playerBets, tableState.pot);
  
  // Only show side pots if there are multiple pots
  return pots.length > 1 ? pots : null;
}, [state.players, tableId, tableState?.pot, tableState?.handInProgress]);
```

**Visual Display:**
```typescript
{sidePots ? (
  // Display side pots when all-ins create multiple pots
  <div className="space-y-2 sm:space-y-3">
    {sidePots.map((pot, index) => (
      <div key={index} className={/* Main pot smaller, side pots larger */}>
        <div className="text-white/40 uppercase">
          {index === 0 ? 'Pote Principal' : `Side Pot ${index}`}
        </div>
        ${pot.amount}
      </div>
    ))}
    <div className="text-white/30">
      Total: ${tableState.pot}
    </div>
  </div>
) : (
  // Display single pot normally
  <div className="text-8xl">${tableState.pot}</div>
)}
```

**Visual Hierarchy:**
- **Main Pot:** Smaller text (text-2xl/4xl), white/60 opacity
- **Side Pots:** Larger text (text-3xl/6xl), green-400 color
- **Total:** Small text below showing sum of all pots

**Example Display:**
```
┌──────────────────┐
│ Pote Principal   │
│     $1,500       │  ← Smaller, less prominent
├──────────────────┤
│   Side Pot 1     │
│     $3,000       │  ← Larger, green, highlighted
├──────────────────┤
│   Side Pot 2     │
│     $2,000       │  ← Larger, green, highlighted
├──────────────────┤
│  Total: $6,500   │  ← Small info text
└──────────────────┘
```

---

## Test Coverage

### New Tests Created

#### 1. `lastPlayerWithChips.test.ts` (5 tests)
- ✅ Five all-in, one with chips should get action
- ✅ Four all-in, one folded, one with chips
- ✅ All players all-in, no one can act
- ✅ Two players with chips, normal betting
- ✅ One player remaining, others folded/out

#### 2. `zeroBalancePlayers.test.ts` (5 tests)
- ✅ Player with zero balance marked as OUT
- ✅ Player with negative balance marked as OUT
- ✅ Player with positive balance remains in play
- ✅ Already OUT player stays OUT
- ✅ Blind posting with insufficient balance

### Existing Tests (All Passing)
- ✅ sidePotLogic.test.ts (4 tests)
- ✅ allInPlayerActions.test.ts (7 tests)
- ✅ multiPotWinner.test.ts (5 tests)
- ✅ multipleAllInRounds.test.ts (4 tests)
- ✅ multiRoundSidePot.test.ts (3 tests)

**Total: 33/33 tests passing** ✅

---

## Code Changes Summary

### Files Modified

1. **`utils/sidePotLogic.ts`**
   - Changed `areAllPlayersAllInOrCapped` logic from `<= 1` to `=== 0`
   - Updated documentation

2. **`App.tsx`**
   - Added zero-balance check before starting hand
   - Added partial blind posting with `Math.min()`
   - Added all-in status check after blind posting
   - Added zero-balance check after pot distribution

3. **`components/TableView.tsx`**
   - Added side pot calculation using `useMemo`
   - Added conditional rendering for single pot vs. multiple pots
   - Added visual hierarchy (smaller main pot, larger side pots)
   - Added green highlighting for side pots
   - Added total pot display

---

## Impact Analysis

### Before Fix

| Issue | Behavior | Result |
|-------|----------|--------|
| Multiple all-ins | Last player with chips doesn't get action | ❌ Unfair, skips to showdown |
| Zero balance | Players stay active, post negative blinds | ❌ Negative balances, broken state |
| Side pots | Only visible during manual distribution | ❌ Confusing, unclear pot structure |

### After Fix

| Issue | Behavior | Result |
|-------|----------|--------|
| Multiple all-ins | Last player with chips gets to call/fold | ✅ Fair, proper poker rules |
| Zero balance | Players marked OUT, partial blinds allowed | ✅ No negative balances, clean |
| Side pots | Always visible when all-ins present | ✅ Clear, transparent pot display |

---

## Example Scenarios

### Scenario 1: The Main Issue (Before vs After)

**Setup:**
- 6 players at the table
- Blinds: 50/100
- Pre-flop: P1 goes all-in for 500
- Flop: P2 goes all-in for 800
- Turn: P3 goes all-in for 1200
- Turn: P4 goes all-in for 2000
- Turn: P5 goes all-in for 3000
- Turn: P6 has 5000 chips remaining

**Before Fix:**
```
System thinks: "Only P6 can act (1 player), round complete"
→ Betting round ends
→ P6 never gets action
→ Goes straight to showdown ❌
```

**After Fix:**
```
System thinks: "P6 can still act (1 player > 0), continue"
→ P6's turn
→ P6 can choose: CALL 3000 or FOLD
→ If calls: Goes to showdown
→ If folds: Forfeits investment ✅
```

### Scenario 2: Zero Balance Player

**Before Fix:**
```
P1: 0 chips, status: SITTING
New hand starts
→ P1 posts SB of 50 → balance becomes -50 ❌
→ Next hand: P1 posts BB of 100 → balance becomes -150 ❌
→ Negative balances accumulate
```

**After Fix:**
```
P1: 0 chips, status: SITTING
New hand starts
→ Check: balance <= 0
→ P1.status = OUT ✅
→ P1 excluded from getActivePlayers
→ P1 doesn't participate in hand
→ Must rebuy or re-enter to play again
```

### Scenario 3: Side Pot Visualization

**Before Fix:**
```
Table Display:
┌──────────────┐
│  Pot: $6,500 │  ← Only total shown
└──────────────┘
Players confused about pot structure
```

**After Fix:**
```
Table Display:
┌──────────────────┐
│ Pote Principal   │
│     $1,500       │  ← Main pot (small)
├──────────────────┤
│   Side Pot 1     │
│     $3,000       │  ← Side pot (large, green)
├──────────────────┤
│   Side Pot 2     │
│     $2,000       │  ← Side pot (large, green)
├──────────────────┤
│  Total: $6,500   │
└──────────────────┘
Clear pot structure visible to all
```

---

## Testing Instructions

### Manual Testing

#### Test 1: Last Player with Chips
1. Start game with 6 players, each with 5000 chips
2. Blinds: 50/100
3. Have P1-P5 go all-in in different rounds
4. Observe P6 still gets action on turn/river
5. P6 should be able to call or fold

**Expected:** P6 gets action before showdown ✅

#### Test 2: Zero Balance Elimination
1. Start game with 3 players
2. P1: 1000 chips, P2: 1000 chips, P3: 50 chips (less than BB)
3. Start a hand
4. P3 should post partial SB and go all-in
5. After hand ends, if P3 loses, check they're marked OUT
6. Start new hand - P3 should not participate

**Expected:** P3 marked as OUT, doesn't play next hand ✅

#### Test 3: Side Pot Display
1. Start game with 4 players
2. P1: 500, P2: 1000, P3: 2000, P4: 5000
3. Have all go all-in
4. Check table display shows:
   - Pote Principal (smaller, white)
   - Side Pot 1 (larger, green)
   - Side Pot 2 (larger, green)
   - Total amount

**Expected:** Multiple pots displayed with visual hierarchy ✅

---

## Automated Testing

Run all tests:
```bash
# Test 1: Last player with chips
npx tsx utils/lastPlayerWithChips.test.ts

# Test 2: Zero balance players
npx tsx utils/zeroBalancePlayers.test.ts

# Existing tests (verify no regression)
npx tsx utils/sidePotLogic.test.ts
npx tsx utils/allInPlayerActions.test.ts
npx tsx utils/multiPotWinner.test.ts
npx tsx utils/multipleAllInRounds.test.ts
npx tsx utils/multiRoundSidePot.test.ts

# Build verification
npm run build
```

---

## Breaking Changes

**None.** All changes are backward compatible:
- Existing game states continue to work
- No API changes
- No data structure modifications
- Only behavioral improvements

---

## Future Enhancements

Potential improvements for future iterations:

1. **Automatic Pot Distribution**
   - Detect when hand result is clear
   - Auto-distribute pots without manual selection

2. **Player Eligibility Indicators**
   - Show which players are eligible for each pot
   - Highlight eligible players on the table view

3. **Balance Warnings**
   - Warn players when balance < big blind
   - Suggest rebuy/add-on options

4. **Side Pot Animations**
   - Animate pot creation when players go all-in
   - Visual feedback for pot distributions

5. **History Log**
   - Track all pot distributions
   - Show hand history with pot details

---

## Conclusion

All three issues from the problem statement have been resolved:

1. ✅ **All-in action issue:** Last player with chips now gets proper action
2. ✅ **Zero-balance maintenance:** Players with no chips are marked OUT
3. ✅ **Side pot visualization:** Pots are clearly displayed on the table

The implementation is:
- ✅ Minimal and surgical
- ✅ Fully tested (33 passing tests)
- ✅ Backward compatible
- ✅ Production ready

The poker game now follows standard poker rules correctly for all-in situations and player elimination.
