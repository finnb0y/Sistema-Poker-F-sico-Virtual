# Dealer Logic Test Cases

This document describes the test cases for the dealer logic implementation.

## Test Case 1: Two Players (Heads-Up)

### Setup
- 2 players at the table
- Dealer button position: Player 1 (seat 2)

### Expected Behavior
- Dealer (seat 2) is also Small Blind
- Player 2 (seat 3) is Big Blind
- Action pre-flop: Small Blind (Dealer, seat 2) acts first
- Action post-flop: Small Blind (Dealer, seat 2) acts first

### Test Data
```typescript
players = [
  { seatNumber: 2, status: ACTIVE },
  { seatNumber: 3, status: ACTIVE }
]
dealerButtonPosition = 2
```

### Expected Results
```typescript
calculateDealerPositions(players, 2) => {
  dealerIdx: 0,
  smallBlindIdx: 0,  // Same as dealer
  bigBlindIdx: 1,
  firstToActIdx: 0   // Small blind acts first
}
```

## Test Case 2: Three Players

### Setup
- 3 players at the table
- Dealer button position: Player 1 (seat 2)

### Expected Behavior
- Dealer: seat 2
- Small Blind: seat 3 (left of dealer)
- Big Blind: seat 5 (left of small blind)
- Action pre-flop: UTG (seat 2, left of BB - wraps around)
- Action post-flop: Small Blind (seat 3) acts first

### Test Data
```typescript
players = [
  { seatNumber: 2, status: ACTIVE },
  { seatNumber: 3, status: ACTIVE },
  { seatNumber: 5, status: ACTIVE }
]
dealerButtonPosition = 2
```

### Expected Results
```typescript
calculateDealerPositions(players, 2) => {
  dealerIdx: 0,
  smallBlindIdx: 1,  // Left of dealer
  bigBlindIdx: 2,    // Left of SB
  firstToActIdx: 0   // UTG (left of BB, wraps to dealer)
}

getPostFlopFirstToAct(players, 2) => 1  // Small blind position
```

## Test Case 3: Four Players

### Setup
- 4 players at the table
- Dealer button position: Player 1 (seat 2)

### Expected Behavior
- Dealer: seat 2
- Small Blind: seat 3 (left of dealer)
- Big Blind: seat 4 (left of small blind)
- Action pre-flop: UTG (seat 5, left of BB)
- Action post-flop: Small Blind (seat 3) acts first

### Test Data
```typescript
players = [
  { seatNumber: 2, status: ACTIVE },
  { seatNumber: 3, status: ACTIVE },
  { seatNumber: 4, status: ACTIVE },
  { seatNumber: 5, status: ACTIVE }
]
dealerButtonPosition = 2
```

### Expected Results
```typescript
calculateDealerPositions(players, 2) => {
  dealerIdx: 0,
  smallBlindIdx: 1,  // Left of dealer
  bigBlindIdx: 2,    // Left of SB
  firstToActIdx: 3   // UTG (left of BB)
}

getPostFlopFirstToAct(players, 2) => 1  // Small blind position
```

## Test Case 4: Dealer Button Movement

### Setup
- 3 players at the table
- Current dealer button: seat 2

### Expected Behavior
- Button moves to seat 3 (next player clockwise)

### Test Data
```typescript
players = [
  { seatNumber: 2 },
  { seatNumber: 3 },
  { seatNumber: 5 }
]
currentDealerPosition = 2
```

### Expected Results
```typescript
moveButtonToNextPlayer(players, 2) => 3
```

## Test Case 5: Dealer Button Movement (Wrap Around)

### Setup
- 3 players at the table
- Current dealer button: seat 5

### Expected Behavior
- Button moves to seat 2 (wraps around to first player)

### Test Data
```typescript
players = [
  { seatNumber: 2 },
  { seatNumber: 3 },
  { seatNumber: 5 }
]
currentDealerPosition = 5
```

### Expected Results
```typescript
moveButtonToNextPlayer(players, 5) => 2
```

## Test Case 6: Initial Dealer Button Setup

### Setup
- 3 players at the table
- No current dealer button (null)

### Expected Behavior
- Button is set to first player's seat (manual selection)

### Test Data
```typescript
players = [
  { seatNumber: 2 },
  { seatNumber: 3 },
  { seatNumber: 5 }
]
currentDealerPosition = null
```

### Expected Results
```typescript
moveButtonToNextPlayer(players, null) => 2
```

## Test Case 7: Post-Flop with Folded Players

### Setup
- 4 players at the table originally
- Small blind folded
- Dealer button: seat 2

### Expected Behavior
- Action starts with first active player left of dealer
- In this case, big blind (seat 4) acts first

### Test Data
```typescript
activePlayers = [
  { seatNumber: 2, status: ACTIVE },  // Dealer
  { seatNumber: 4, status: ACTIVE },  // Big blind
  { seatNumber: 5, status: ACTIVE }   // UTG
]
dealerButtonPosition = 2
```

### Expected Results
```typescript
getPostFlopFirstToAct(activePlayers, 2) => 1  // Index of seat 4 (first active left of dealer)
```

## Integration Test: Complete Hand Flow

### Scenario: 3-player game

1. **Initial Setup**
   - Set dealer button manually to seat 2
   - Players: seat 2, 3, 5

2. **Start Hand**
   - Dealer: seat 2
   - SB: seat 3 (posts small blind)
   - BB: seat 5 (posts big blind)
   - First to act pre-flop: seat 2 (UTG, wraps around)

3. **Post-Flop**
   - First to act: seat 3 (small blind)

4. **End Hand**
   - Move dealer button

5. **Next Hand**
   - New dealer: seat 3
   - New SB: seat 5
   - New BB: seat 2
   - First to act pre-flop: seat 3 (UTG, dealer position)

This test validates the complete hand flow including dealer button rotation.
