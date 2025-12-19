
import React, { useState, useEffect, useCallback } from 'react';
import { Role, GameState, Player, PlayerStatus, ActionMessage, Tournament, RoomTable, RegisteredPerson, TournamentConfig, TableState } from './types';
import { syncService } from './services/syncService';
import PlayerDashboard from './components/PlayerDashboard';
import DealerControls from './components/DealerControls';
import TableDealerInterface from './components/TableDealerInterface';

const INITIAL_STATE: GameState = {
  roomTables: Array.from({ length: 15 }, (_, i) => ({ id: i + 1, name: `Mesa ${i + 1}` })),
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
              newState.tableStates.push({ id: tid, tournamentId: newId, pot: 0, currentTurn: null, dealerId: null });
            }
          });
          break;

        case 'UPDATE_TOURNAMENT':
          const tIdx = newState.tournaments.findIndex(t => t.id === payload.id);
          if (tIdx !== -1) {
            newState.tournaments[tIdx] = { ...newState.tournaments[tIdx], ...payload };
            payload.assignedTableIds.forEach((tid: number) => {
              if (!newState.tableStates.find(ts => ts.id === tid)) {
                newState.tableStates.push({ id: tid, tournamentId: payload.id, pot: 0, currentTurn: null, dealerId: null });
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
             if (leastBusyTable && leastBusyTable.count < targetTourney.config.maxSeats) {
                p.tableId = leastBusyTable.id;
                const takenSeats = newState.players.filter(p2 => p2.tableId === leastBusyTable.id).map(p2 => p2.seatNumber);
                for(let s=1; s<=targetTourney.config.maxSeats; s++) {
                   if (!takenSeats.includes(s)) { p.seatNumber = s; break; }
                }
             }
          });
          break;

        case 'BET':
          const bP = newState.players.find(p => p.id === senderId);
          if (bP) {
            const betDiff = payload.amount - bP.currentBet;
            bP.balance -= betDiff;
            bP.currentBet = payload.amount;
            const tState = newState.tableStates.find(t => t.id === bP.tableId);
            if (tState) {
              tState.pot += betDiff;
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
          <h1 className="text-6xl font-outfit font-black text-white mb-2 italic tracking-tighter">POKER<span className="text-yellow-500">PRO</span></h1>
          <p className="text-white/40 mb-10 text-[10px] font-bold tracking-[6px] uppercase">Chip Manager & Suite Profissional</p>
          <div className="space-y-4">
            <form onSubmit={(e) => {
              e.preventDefault();
              const found = gameState.players.find(p => p.accessCode === accessCodeInput.toUpperCase());
              if (found) { setPlayerId(found.id); selectRole(Role.PLAYER); }
            }} className="space-y-4">
              <input type="text" maxLength={4} value={accessCodeInput} onChange={e => setAccessCodeInput(e.target.value.toUpperCase())} placeholder="CÓDIGO" className="w-full bg-black/40 border border-white/10 rounded-3xl p-6 text-center text-4xl font-black text-yellow-500 outline-none transition-all tracking-[12px]" />
              <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-black py-5 rounded-3xl text-xl shadow-xl transition-all">ACESSAR FICHA</button>
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
               <h1 className="text-2xl font-outfit font-black text-white italic tracking-tight uppercase">Control Center</h1>
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
