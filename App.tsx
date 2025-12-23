
import React, { useState, useEffect, useCallback } from 'react';
import { Role, GameState, Player, PlayerStatus, ActionMessage, Tournament, RoomTable, RegisteredPerson, TournamentConfig, TableState, BettingRound } from './types';
import { syncService } from './services/syncService';
import PlayerDashboard from './components/PlayerDashboard';
import DealerControls from './components/DealerControls';
import TableDealerInterface from './components/TableDealerInterface';
import { calculateDealerPositions, getPostFlopFirstToAct, moveButtonToNextPlayer, getActivePlayers } from './utils/dealerLogic';

const INITIAL_STATE: GameState = {
  roomTables: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `Mesa ${i + 1}` })),
  tournaments: [],
  tableStates: [],
  players: [],
  registry: [],
  smallBlind: 50,
  bigBlind: 100,
  activeTournamentId: null
};

const generateAccessCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();

const App: React.FC = () => {
  const [role, setRole] = useState<Role | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [gameState, setGameState] = useState<GameState>(syncService.loadState() || INITIAL_STATE);
  
  useEffect(() => {
    const savedRole = localStorage.getItem('poker_current_role');
    const savedPlayerId = localStorage.getItem('poker_current_player_id');
    if (savedRole) setRole(savedRole as Role);
    if (savedPlayerId) setPlayerId(savedPlayerId);
  }, []);

  const getNextTurnId = (players: Player[], tableId: number, currentId: string | null): string | null => {
    const tablePlayers = players.filter(p => p.tableId === tableId && p.status !== PlayerStatus.FOLDED && p.status !== PlayerStatus.OUT);
    if (tablePlayers.length <= 1) return null;
    const sorted = [...tablePlayers].sort((a, b) => a.seatNumber - b.seatNumber);
    const currIdx = sorted.findIndex(p => p.id === currentId);
    return sorted[(currIdx + 1) % sorted.length].id;
  };

  const processAction = useCallback((msg: ActionMessage) => {
    setGameState(prev => {
      let newState = { ...prev };
      const { type, payload, senderId } = msg;

      switch (type) {
        case 'REGISTER_PERSON':
          newState.registry.push({ id: Math.random().toString(36).substr(2, 9), name: payload.name, nickname: payload.nickname });
          break;

        case 'DELETE_PERSON':
          newState.registry = newState.registry.filter(r => r.id !== payload.personId);
          newState.players = newState.players.filter(p => p.personId !== payload.personId);
          break;

        case 'ADD_ROOM_TABLE':
          const nextId = newState.roomTables.length > 0 ? Math.max(...newState.roomTables.map(t => t.id)) + 1 : 1;
          newState.roomTables.push({ id: nextId, name: `Mesa ${nextId}` });
          break;

        case 'REMOVE_ROOM_TABLE':
          newState.roomTables = newState.roomTables.filter(t => t.id !== payload.id);
          newState.tableStates = newState.tableStates.filter(ts => ts.id !== payload.id);
          break;

        case 'CREATE_TOURNAMENT':
          const newId = Math.random().toString(36).substr(2, 9);
          newState.tournaments.push({
            id: newId,
            name: payload.name,
            acronym: payload.acronym?.toUpperCase() || 'TOU',
            guaranteed: payload.guaranteed || 0,
            config: payload.config,
            assignedTableIds: payload.assignedTableIds,
            isActive: true
          });
          payload.assignedTableIds.forEach((tid: number) => {
            if (!newState.tableStates.find(ts => ts.id === tid)) {
              newState.tableStates.push({ 
                id: tid, 
                tournamentId: newId, 
                pot: 0, 
                currentTurn: null, 
                dealerId: null,
                dealerButtonPosition: null,
                currentBlindLevel: 0,
                bettingRound: null,
                currentBet: 0,
                lastRaiseAmount: 0,
                handInProgress: false
              });
            }
          });
          break;

        case 'UPDATE_TOURNAMENT':
          const tIdx = newState.tournaments.findIndex(t => t.id === payload.id);
          if (tIdx !== -1) {
            newState.tournaments[tIdx] = { ...newState.tournaments[tIdx], ...payload };
            payload.assignedTableIds.forEach((tid: number) => {
              if (!newState.tableStates.find(ts => ts.id === tid)) {
                newState.tableStates.push({ 
                  id: tid, 
                  tournamentId: payload.id, 
                  pot: 0, 
                  currentTurn: null, 
                  dealerId: null,
                  dealerButtonPosition: null,
                  currentBlindLevel: 0,
                  bettingRound: null,
                  currentBet: 0,
                  lastRaiseAmount: 0,
                  handInProgress: false
                });
              }
            });
            newState.tableStates = newState.tableStates.filter(ts => 
              ts.tournamentId !== payload.id || payload.assignedTableIds.includes(ts.id)
            );
          }
          break;

        case 'DELETE_TOURNAMENT':
          newState.tournaments = newState.tournaments.filter(t => t.id !== payload.id);
          newState.players = newState.players.filter(p => p.tournamentId !== payload.id);
          newState.tableStates = newState.tableStates.filter(ts => ts.tournamentId !== payload.id);
          break;

        case 'SET_ACTIVE_TOURNAMENT':
          newState.activeTournamentId = payload.id;
          break;

        case 'REGISTER_PLAYER_TO_TOURNAMENT':
          const person = newState.registry.find(r => r.id === payload.personId);
          const tourney = newState.tournaments.find(t => t.id === payload.tournamentId);
          if (!person || !tourney) break;
          
          let totalChips = 0;
          let totalInvestment = 0;
          let rebuysAtStart = payload.rebuys || 0;
          let hasAddonAtStart = payload.addon || false;

          // Buy-in or Re-entry base
          if (payload.entryType === 'reentry') {
            totalChips += tourney.config.reentry.chips;
            totalInvestment += tourney.config.reentry.price;
          } else {
            totalChips += tourney.config.buyIn.chips;
            totalInvestment += tourney.config.buyIn.price;
          }

          // Initial rebuys
          totalChips += rebuysAtStart * tourney.config.rebuy.chips;
          totalInvestment += rebuysAtStart * tourney.config.rebuy.price;

          // Initial addon
          if (hasAddonAtStart) {
            totalChips += tourney.config.addon.chips;
            totalInvestment += tourney.config.addon.price;
          }

          newState.players.push({
            id: Math.random().toString(36).substr(2, 9),
            personId: person.id,
            tournamentId: tourney.id,
            name: person.nickname || person.name,
            balance: totalChips,
            currentBet: 0,
            status: PlayerStatus.SITTING,
            tableId: null,
            seatNumber: 0,
            accessCode: generateAccessCode(),
            rebuysCount: rebuysAtStart,
            hasAddon: hasAddonAtStart,
            totalInvested: totalInvestment
          });
          break;

        case 'AUTO_BALANCE':
          const tourId = payload.tournamentId;
          const targetTourney = newState.tournaments.find(t => t.id === tourId);
          if (!targetTourney) break;
          
          const waitingPlayers = newState.players.filter(p => p.tournamentId === tourId && p.tableId === null);
          waitingPlayers.forEach(p => {
             const tableUsage = targetTourney.assignedTableIds.map(tid => ({ 
               id: tid, 
               count: newState.players.filter(p2 => p2.tableId === tid).length 
             }));
             const leastBusyTable = tableUsage.sort((a, b) => a.count - b.count)[0];
             // Reserve seat 1 for dealer - maxSeats - 1 available seats for players
             if (leastBusyTable && leastBusyTable.count < (targetTourney.config.maxSeats - 1)) {
                p.tableId = leastBusyTable.id;
                const takenSeats = newState.players.filter(p2 => p2.tableId === leastBusyTable.id).map(p2 => p2.seatNumber);
                // Skip seat 1 (dealer position) when assigning seats
                for(let s=2; s<=targetTourney.config.maxSeats; s++) {
                   if (!takenSeats.includes(s)) { p.seatNumber = s; break; }
                }
             }
          });
          break;

        case 'BET':
          const bP = newState.players.find(p => p.id === senderId);
          if (bP && bP.tableId) {
            const tState = newState.tableStates.find(t => t.id === bP.tableId);
            // Only allow action if it's player's turn
            if (tState && tState.currentTurn === senderId) {
              const betDiff = payload.amount - bP.currentBet;
              bP.balance -= betDiff;
              bP.currentBet = payload.amount;
              tState.pot += betDiff;
              tState.currentBet = Math.max(tState.currentBet, payload.amount);
              tState.currentTurn = getNextTurnId(newState.players, tState.id, senderId);
            }
          }
          break;

        case 'FOLD':
          const foldPlayer = newState.players.find(p => p.id === senderId);
          if (foldPlayer && foldPlayer.tableId) {
            const tState = newState.tableStates.find(t => t.id === foldPlayer.tableId);
            // Only allow action if it's player's turn
            if (tState && tState.currentTurn === senderId) {
              foldPlayer.status = PlayerStatus.FOLDED;
              tState.currentTurn = getNextTurnId(newState.players, tState.id, senderId);
            }
          }
          break;

        case 'CHECK':
          const checkPlayer = newState.players.find(p => p.id === senderId);
          if (checkPlayer && checkPlayer.tableId) {
            const tState = newState.tableStates.find(t => t.id === checkPlayer.tableId);
            // Only allow action if it's player's turn and no bet to call
            if (tState && tState.currentTurn === senderId) {
              const tablePlayers = newState.players.filter(p => p.tableId === checkPlayer.tableId);
              const maxBet = Math.max(...tablePlayers.map(p => p.currentBet), 0);
              // Can only check if current bet matches the max bet
              if (checkPlayer.currentBet === maxBet) {
                tState.currentTurn = getNextTurnId(newState.players, tState.id, senderId);
              }
            }
          }
          break;

        case 'CALL':
          const callPlayer = newState.players.find(p => p.id === senderId);
          if (callPlayer && callPlayer.tableId) {
            const tState = newState.tableStates.find(t => t.id === callPlayer.tableId);
            // Only allow action if it's player's turn
            if (tState && tState.currentTurn === senderId) {
              const tablePlayers = newState.players.filter(p => p.tableId === callPlayer.tableId);
              const maxBet = Math.max(...tablePlayers.map(p => p.currentBet), 0);
              const callAmount = maxBet - callPlayer.currentBet;
              
              if (callAmount > 0) {
                const amountToCall = Math.min(callAmount, callPlayer.balance);
                callPlayer.balance -= amountToCall;
                callPlayer.currentBet += amountToCall;
                tState.pot += amountToCall;
                
                // If player is all-in, mark status
                if (callPlayer.balance === 0) {
                  callPlayer.status = PlayerStatus.ALL_IN;
                }
              }
              
              tState.currentTurn = getNextTurnId(newState.players, tState.id, senderId);
            }
          }
          break;

        case 'AWARD_POT':
          const winner = newState.players.find(p => p.id === payload.winnerId);
          if (winner) {
            const tState = newState.tableStates.find(t => t.id === winner.tableId);
            if (tState) {
              winner.balance += tState.pot;
              tState.pot = 0;
              tState.currentTurn = null;
              newState.players.filter(p => p.tableId === tState.id).forEach(p => p.currentBet = 0);
            }
          }
          break;

        case 'REMOVE_PLAYER':
          newState.players = newState.players.filter(p => p.id !== payload.playerId);
          break;

        case 'MOVE_PLAYER':
          const playerToMove = newState.players.find(p => p.id === payload.playerId);
          if (playerToMove) {
            const targetTable = payload.targetTableId;
            const targetTourney = newState.tournaments.find(t => t.id === playerToMove.tournamentId);
            if (targetTourney) {
              playerToMove.tableId = targetTable;
              playerToMove.currentBet = 0;
              playerToMove.status = PlayerStatus.SITTING;
              // Find available seat at target table (skip seat 1 - dealer position)
              const takenSeats = newState.players.filter(p => p.tableId === targetTable && p.id !== payload.playerId).map(p => p.seatNumber);
              for(let s=2; s<=targetTourney.config.maxSeats; s++) {
                if (!takenSeats.includes(s)) { playerToMove.seatNumber = s; break; }
              }
            }
          }
          break;

        case 'REBUY_PLAYER':
          const rebuyPlayer = newState.players.find(p => p.id === payload.playerId);
          if (rebuyPlayer) {
            const rebuyTourney = newState.tournaments.find(t => t.id === rebuyPlayer.tournamentId);
            if (rebuyTourney && rebuyTourney.config.rebuy.enabled) {
              if (rebuyPlayer.rebuysCount < rebuyTourney.config.rebuy.maxCount) {
                rebuyPlayer.balance += rebuyTourney.config.rebuy.chips;
                rebuyPlayer.rebuysCount += 1;
                rebuyPlayer.totalInvested += rebuyTourney.config.rebuy.price;
              }
            }
          }
          break;

        case 'REENTRY_PLAYER':
          const reentryPlayer = newState.players.find(p => p.id === payload.playerId);
          if (reentryPlayer) {
            const reentryTourney = newState.tournaments.find(t => t.id === reentryPlayer.tournamentId);
            if (reentryTourney && reentryTourney.config.reentry.enabled) {
              reentryPlayer.balance = reentryTourney.config.reentry.chips;
              reentryPlayer.currentBet = 0;
              reentryPlayer.status = PlayerStatus.SITTING;
              reentryPlayer.totalInvested += reentryTourney.config.reentry.price;
              reentryPlayer.tableId = null;
              reentryPlayer.seatNumber = 0;
            }
          }
          break;

        case 'MOVE_DEALER_BUTTON':
          const tableStateForDealer = newState.tableStates.find(ts => ts.id === payload.tableId);
          if (tableStateForDealer) {
            const tablePlayers = getActivePlayers(newState.players, payload.tableId);
            
            if (tablePlayers.length > 0) {
              const newButtonPosition = moveButtonToNextPlayer(
                tablePlayers,
                tableStateForDealer.dealerButtonPosition
              );
              tableStateForDealer.dealerButtonPosition = newButtonPosition;
            }
          }
          break;

        case 'START_HAND':
          const tableForHand = newState.tableStates.find(ts => ts.id === payload.tableId);
          if (tableForHand) {
            const tournament = newState.tournaments.find(t => t.id === tableForHand.tournamentId);
            if (!tournament) break;
            
            const currentBlindLevel = tournament.config.blindStructure.levels[tableForHand.currentBlindLevel];
            if (!currentBlindLevel) break;
            
            const tablePlayers = getActivePlayers(newState.players, payload.tableId);
            
            if (tablePlayers.length < 2) break;
            
            // Calculate dealer positions based on player count
            const positions = calculateDealerPositions(
              tablePlayers,
              tableForHand.dealerButtonPosition!
            );
            
            if (!positions) break;
            
            // Reset for new hand
            tableForHand.pot = 0;
            tableForHand.currentBet = currentBlindLevel.bigBlind;
            tableForHand.lastRaiseAmount = currentBlindLevel.bigBlind;
            tableForHand.bettingRound = 'PRE_FLOP' as any;
            tableForHand.handInProgress = true;
            tablePlayers.forEach(p => {
              p.currentBet = 0;
              p.status = PlayerStatus.ACTIVE;
            });
            
            // Post blinds
            const sbPlayer = tablePlayers[positions.smallBlindIdx];
            const bbPlayer = tablePlayers[positions.bigBlindIdx];
            
            sbPlayer.balance -= currentBlindLevel.smallBlind;
            sbPlayer.currentBet = currentBlindLevel.smallBlind;
            tableForHand.pot += currentBlindLevel.smallBlind;
            
            bbPlayer.balance -= currentBlindLevel.bigBlind;
            bbPlayer.currentBet = currentBlindLevel.bigBlind;
            tableForHand.pot += currentBlindLevel.bigBlind;
            
            // Set first to act based on player count and positions
            tableForHand.currentTurn = tablePlayers[positions.firstToActIdx].id;
          }
          break;

        case 'RAISE':
          const raisePlayer = newState.players.find(p => p.id === senderId);
          if (raisePlayer && raisePlayer.tableId) {
            const tableForRaise = newState.tableStates.find(ts => ts.id === raisePlayer.tableId);
            if (tableForRaise) {
              const raiseAmount = payload.amount;
              const callAmount = tableForRaise.currentBet - raisePlayer.currentBet;
              const totalToPay = callAmount + raiseAmount;
              
              raisePlayer.balance -= totalToPay;
              raisePlayer.currentBet += totalToPay;
              tableForRaise.pot += totalToPay;
              tableForRaise.currentBet = raisePlayer.currentBet;
              tableForRaise.lastRaiseAmount = raiseAmount;
              tableForRaise.currentTurn = getNextTurnId(newState.players, tableForRaise.id, senderId);
            }
          }
          break;

        case 'ADVANCE_BETTING_ROUND':
          const tableForAdvance = newState.tableStates.find(ts => ts.id === payload.tableId);
          if (tableForAdvance && tableForAdvance.handInProgress) {
            const roundOrder = ['PRE_FLOP', 'FLOP', 'TURN', 'RIVER', 'SHOWDOWN'];
            const currentRoundIdx = roundOrder.indexOf(tableForAdvance.bettingRound || 'PRE_FLOP');
            
            if (currentRoundIdx < roundOrder.length - 1) {
              tableForAdvance.bettingRound = roundOrder[currentRoundIdx + 1] as any;
              tableForAdvance.currentBet = 0;
              tableForAdvance.lastRaiseAmount = 0;
              
              // Reset player bets for new round
              // Post-flop: only players who are ACTIVE (not folded) participate
              const activePlayers = getActivePlayers(
                newState.players,
                payload.tableId,
                [PlayerStatus.OUT, PlayerStatus.FOLDED]
              );
              
              activePlayers.forEach(p => p.currentBet = 0);
              
              // Post-flop action starts with first player left of dealer button (small blind position)
              if (tableForAdvance.dealerButtonPosition && activePlayers.length > 0) {
                const firstToActIdx = getPostFlopFirstToAct(
                  activePlayers,
                  tableForAdvance.dealerButtonPosition
                );
                
                if (firstToActIdx !== -1) {
                  tableForAdvance.currentTurn = activePlayers[firstToActIdx].id;
                }
              }
            }
          }
          break;

        case 'ADVANCE_BLIND_LEVEL':
          const tableStateForBlinds = newState.tableStates.find(ts => ts.id === payload.tableId);
          if (tableStateForBlinds) {
            const tournament = newState.tournaments.find(t => t.id === tableStateForBlinds.tournamentId);
            if (tournament && tournament.config.blindStructure.levels) {
              const nextLevel = tableStateForBlinds.currentBlindLevel + 1;
              if (nextLevel < tournament.config.blindStructure.levels.length) {
                tableStateForBlinds.currentBlindLevel = nextLevel;
              }
            }
          }
          break;
      }

      syncService.persistState(newState);
      return newState;
    });
  }, []);

  useEffect(() => {
    const unsubscribe = syncService.subscribe(processAction);
    return unsubscribe;
  }, [processAction]);

  const dispatch = (msg: ActionMessage) => {
    processAction(msg);
    syncService.sendMessage(msg);
  };

  const selectRole = (r: Role) => {
    setRole(r);
    localStorage.setItem('poker_current_role', r);
  };

  const exitRole = () => {
    setRole(null);
    setPlayerId(null);
    localStorage.removeItem('poker_current_role');
    localStorage.removeItem('poker_current_player_id');
  };

  if (!role) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 poker-felt">
        <div className="w-full max-w-md glass p-10 rounded-[40px] shadow-2xl text-center border-white/20 border">
          <h1 className="text-6xl font-outfit font-black text-white mb-2 italic tracking-tighter">POKER<span className="text-yellow-500"> 2</span></h1>
          <p className="text-white/40 mb-10 text-[10px] font-bold tracking-[6px] uppercase">Gerenciador de Fichas & Suite Profissional</p>
          <div className="space-y-4">
            <form onSubmit={(e) => {
              e.preventDefault();
              const found = gameState.players.find(p => p.accessCode === accessCodeInput.toUpperCase());
              if (found) { setPlayerId(found.id); selectRole(Role.PLAYER); }
            }} className="space-y-4">
              <input type="text" maxLength={4} value={accessCodeInput} onChange={e => setAccessCodeInput(e.target.value.toUpperCase())} placeholder="CÓDIGO" className="w-full bg-black/40 border border-white/10 rounded-3xl p-6 text-center text-4xl font-black text-yellow-500 outline-none transition-all tracking-[12px]" />
              <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-black py-5 rounded-3xl text-xl shadow-xl transition-all">SENTAR NA MESA</button>
            </form>
            <div className="grid grid-cols-2 gap-3 pt-4">
              <button onClick={() => selectRole(Role.DEALER)} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black py-4 rounded-2xl transition-all uppercase text-[10px] tracking-widest">DEALER</button>
              <button onClick={() => selectRole(Role.DIRECTOR)} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black py-4 rounded-2xl transition-all uppercase text-[10px] tracking-widest">DIRETOR</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      {role === Role.PLAYER && playerId && <PlayerDashboard state={gameState} playerId={playerId} onDispatch={dispatch} />}
      {role === Role.DEALER && <TableDealerInterface state={gameState} onDispatch={dispatch} onExit={exitRole} />}
      {role === Role.DIRECTOR && (
        <div className="h-screen flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center font-black text-black text-xl">D</div>
               <h1 className="text-2xl font-outfit font-black text-white italic tracking-tight uppercase">Gerenciamento</h1>
            </div>
            <button onClick={exitRole} className="px-6 py-2 rounded-xl bg-white/5 hover:bg-red-600/20 text-white/40 hover:text-red-500 text-[10px] font-black uppercase transition-all tracking-widest">LOGOUT</button>
          </div>
          <div className="flex-1 overflow-hidden bg-[#0a0a0a]">
            <DealerControls state={gameState} onDispatch={dispatch} />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
