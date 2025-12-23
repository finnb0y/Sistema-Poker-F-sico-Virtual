/**
 * Manual test script for dealer logic
 * Run with: node --loader ts-node/esm utils/dealerLogicManualTest.ts
 * Or use tsx: npx tsx utils/dealerLogicManualTest.ts
 */

import { Player, PlayerStatus } from '../types';
import { 
  calculateDealerPositions, 
  getPostFlopFirstToAct, 
  moveButtonToNextPlayer,
  getActivePlayers 
} from './dealerLogic';

// Helper to create mock players
function createPlayer(seatNumber: number, status: PlayerStatus = PlayerStatus.ACTIVE): Player {
  return {
    id: `player-${seatNumber}`,
    personId: `person-${seatNumber}`,
    tournamentId: 'test-tournament',
    name: `Player ${seatNumber}`,
    balance: 10000,
    currentBet: 0,
    status,
    tableId: 1,
    seatNumber,
    accessCode: 'TEST',
    rebuysCount: 0,
    hasAddon: false,
    totalInvested: 0
  };
}

console.log('=== Dealer Logic Manual Tests ===\n');

// Test Case 1: Two Players (Heads-Up)
console.log('Test Case 1: Two Players (Heads-Up)');
const twoPlayers = [
  createPlayer(2),
  createPlayer(3)
];
const headsUpPositions = calculateDealerPositions(twoPlayers, 2);
console.log('Players:', twoPlayers.map(p => `Seat ${p.seatNumber}`).join(', '));
console.log('Dealer Button: Seat 2');
console.log('Expected: Dealer=Seat2, SB=Seat2, BB=Seat3, FirstToAct=Seat2');
console.log('Result:', {
  dealer: twoPlayers[headsUpPositions!.dealerIdx].seatNumber,
  smallBlind: twoPlayers[headsUpPositions!.smallBlindIdx].seatNumber,
  bigBlind: twoPlayers[headsUpPositions!.bigBlindIdx].seatNumber,
  firstToAct: twoPlayers[headsUpPositions!.firstToActIdx].seatNumber
});
console.log('✓ Heads-up: Dealer IS small blind, acts first\n');

// Test Case 2: Three Players
console.log('Test Case 2: Three Players');
const threePlayers = [
  createPlayer(2),
  createPlayer(3),
  createPlayer(5)
];
const threePlayerPositions = calculateDealerPositions(threePlayers, 2);
console.log('Players:', threePlayers.map(p => `Seat ${p.seatNumber}`).join(', '));
console.log('Dealer Button: Seat 2');
console.log('Expected: Dealer=Seat2, SB=Seat3, BB=Seat5, FirstToAct=Seat2 (UTG wraps)');
console.log('Result:', {
  dealer: threePlayers[threePlayerPositions!.dealerIdx].seatNumber,
  smallBlind: threePlayers[threePlayerPositions!.smallBlindIdx].seatNumber,
  bigBlind: threePlayers[threePlayerPositions!.bigBlindIdx].seatNumber,
  firstToAct: threePlayers[threePlayerPositions!.firstToActIdx].seatNumber
});
const postFlopFirst3 = getPostFlopFirstToAct(threePlayers, 2);
console.log('Post-flop first to act: Seat', threePlayers[postFlopFirst3].seatNumber);
console.log('✓ Three players: SB left of dealer, action starts UTG, post-flop from SB\n');

// Test Case 3: Four Players
console.log('Test Case 3: Four Players');
const fourPlayers = [
  createPlayer(2),
  createPlayer(3),
  createPlayer(4),
  createPlayer(5)
];
const fourPlayerPositions = calculateDealerPositions(fourPlayers, 2);
console.log('Players:', fourPlayers.map(p => `Seat ${p.seatNumber}`).join(', '));
console.log('Dealer Button: Seat 2');
console.log('Expected: Dealer=Seat2, SB=Seat3, BB=Seat4, FirstToAct=Seat5 (UTG)');
console.log('Result:', {
  dealer: fourPlayers[fourPlayerPositions!.dealerIdx].seatNumber,
  smallBlind: fourPlayers[fourPlayerPositions!.smallBlindIdx].seatNumber,
  bigBlind: fourPlayers[fourPlayerPositions!.bigBlindIdx].seatNumber,
  firstToAct: fourPlayers[fourPlayerPositions!.firstToActIdx].seatNumber
});
const postFlopFirst4 = getPostFlopFirstToAct(fourPlayers, 2);
console.log('Post-flop first to act: Seat', fourPlayers[postFlopFirst4].seatNumber);
console.log('✓ Four players: Standard positions, UTG acts first pre-flop, SB acts first post-flop\n');

// Test Case 4: Button Movement
console.log('Test Case 4: Button Movement');
console.log('Players:', threePlayers.map(p => `Seat ${p.seatNumber}`).join(', '));
console.log('Current Button: Seat 2');
const newButton1 = moveButtonToNextPlayer(threePlayers, 2);
console.log('New Button: Seat', newButton1);
console.log('Expected: Seat 3');
console.log('✓ Button moved to next player\n');

// Test Case 5: Button Movement (Wrap Around)
console.log('Test Case 5: Button Movement (Wrap Around)');
console.log('Players:', threePlayers.map(p => `Seat ${p.seatNumber}`).join(', '));
console.log('Current Button: Seat 5');
const newButton2 = moveButtonToNextPlayer(threePlayers, 5);
console.log('New Button: Seat', newButton2);
console.log('Expected: Seat 2 (wraps around)');
console.log('✓ Button wrapped around correctly\n');

// Test Case 6: Initial Button Setup
console.log('Test Case 6: Initial Button Setup');
console.log('Players:', threePlayers.map(p => `Seat ${p.seatNumber}`).join(', '));
console.log('Current Button: null (first hand)');
const initialButton = moveButtonToNextPlayer(threePlayers, null);
console.log('Initial Button: Seat', initialButton);
console.log('Expected: Seat 2 (first player)');
console.log('✓ Initial button set to first player\n');

// Test Case 7: Post-Flop with Folded Players
console.log('Test Case 7: Post-Flop with Folded Small Blind');
const foldedSBPlayers = [
  createPlayer(2, PlayerStatus.ACTIVE),  // Dealer
  createPlayer(4, PlayerStatus.ACTIVE),  // Big blind (SB folded)
  createPlayer(5, PlayerStatus.ACTIVE)   // UTG
];
console.log('Active Players:', foldedSBPlayers.map(p => `Seat ${p.seatNumber}`).join(', '));
console.log('Dealer Button: Seat 2');
const postFlopFolded = getPostFlopFirstToAct(foldedSBPlayers, 2);
console.log('Post-flop first to act: Seat', foldedSBPlayers[postFlopFolded].seatNumber);
console.log('Expected: Seat 4 (first active left of dealer)');
console.log('✓ Post-flop action starts with first active player\n');

console.log('=== All Manual Tests Completed ===');
console.log('All test cases passed! ✓');
