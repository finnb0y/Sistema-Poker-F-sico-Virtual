
import React, { useState } from 'react';
import { GameState, ActionMessage, PlayerStatus } from '../types';
import PokerChip from './PokerChip';
import TableView from './TableView';
import TournamentBlindTimer from './TournamentBlindTimer';

interface PlayerDashboardProps {
  state: GameState;
  playerId: string;
  onDispatch: (action: ActionMessage) => void;
}

const PlayerDashboard: React.FC<PlayerDashboardProps> = ({ state, playerId, onDispatch }) => {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return <div className="p-10 text-center text-white font-bold">Jogador não encontrado ou desconectado.</div>;

  // Find the tournament this player belongs to
  const tournament = state.tournaments.find(t => t.id === player.tournamentId);
  
  // Fix: state.tables -> state.tableStates
  const tableState = state.tableStates.find(t => t.id === player.tableId);
  const isMyTurn = tableState?.currentTurn === playerId;
  const [betAmount, setBetAmount] = useState<number>(0);
  const [showTable, setShowTable] = useState(false);

  const handleAction = (type: ActionMessage['type'], amount?: number) => {
    onDispatch({ type, payload: { amount: amount || 0 }, senderId: playerId });
    setBetAmount(0);
    // Automatically show table view after action
    setShowTable(true);
  };

  const chips = [
    { value: 100, color: '#ef4444' },
    { value: 500, color: '#3b82f6' },
    { value: 1000, color: '#10b981' },
    { value: 5000, color: '#000000' },
  ];

  const tablePlayers = state.players.filter(p => p.tableId === player.tableId);
  const maxOnTable = Math.max(...tablePlayers.map(p => p.currentBet), 0);
  const callAmount = maxOnTable - player.currentBet;
  const bbValue = state.bigBlind;
  const currentPot = tableState?.pot || 0;

  return (
    <div className="h-screen flex flex-col bg-[#050505] overflow-hidden relative font-inter">
      {/* Visual da Mesa em Tela Cheia */}
      <div className={`fixed inset-0 z-50 transition-all duration-500 transform ${showTable ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
          <div className="h-full w-full bg-black relative flex flex-col">
             <div className="absolute top-6 left-6 right-6 z-[60] flex justify-between">
                <button 
                  onClick={() => setShowTable(false)}
                  className="bg-yellow-500 text-black font-black px-6 py-3 rounded-2xl shadow-2xl uppercase text-xs tracking-widest"
                >
                  FECHAR MESA
                </button>
                <div className="bg-black/60 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
                   <div className="text-[10px] text-white/40 font-black uppercase text-center mb-1">Seu Saldo</div>
                   <div className="text-xl font-black text-green-500">${player.balance}</div>
                </div>
             </div>
             <div className="flex-1 scale-95 sm:scale-100">
               <TableView state={state} tableId={player.tableId!} showEmptySeats={true} currentPlayerId={playerId} />
             </div>
          </div>
      </div>

      {/* Interface de Controle */}
      <div className="p-4 flex justify-between items-center bg-black border-b border-white/5">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center font-black text-black text-lg">{player.name[0]}</div>
            <div>
               <div className="text-[8px] font-black text-white/30 uppercase tracking-[2px]">MESA {player.tableId} • ASSENTO {player.seatNumber}</div>
               <div className="text-sm font-black text-white">{player.name}</div>
            </div>
         </div>
         <div className="flex gap-2">
            <div className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 text-right">
                <div className="text-[7px] text-white/30 font-black uppercase mb-0.5">Saldo</div>
                <div className="text-sm font-black text-green-500 leading-none">${player.balance}</div>
            </div>
            <button 
              onClick={() => setShowTable(true)}
              className="bg-yellow-500/10 hover:bg-yellow-500/20 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider text-yellow-500 border border-yellow-500/20 transition-all"
            >
              VISTA MESA
            </button>
         </div>
      </div>

      {/* Area de Jogo Central */}
      <div className="flex-1 flex flex-col items-center justify-between p-4 py-8 gap-4 overflow-y-auto custom-scrollbar">
         
         {/* Blind Timer - only show if tournament is started */}
         {tournament && tournament.isStarted && (
           <div className="w-full max-w-sm">
             <TournamentBlindTimer tournament={tournament} state={state} onDispatch={onDispatch} />
           </div>
         )}
         
         {/* HUD de Pote */}
         <div className="text-center space-y-1">
            <div className="text-[10px] font-black text-white/20 uppercase tracking-[10px]">POT</div>
            <div className="text-5xl font-black text-white italic drop-shadow-2xl">${currentPot}</div>
            {player.currentBet > 0 && <div className="text-yellow-500/60 font-black text-[10px] uppercase">Sua Aposta: ${player.currentBet}</div>}
         </div>

         {/* Painel de Apostas */}
         <div className="w-full max-w-sm glass rounded-[40px] p-6 flex flex-col gap-5 border-white/10 border shadow-2xl">
            
            {/* Display de Valor Selecionado */}
            <div className="text-center bg-black/40 py-4 rounded-3xl border border-white/5 relative">
               <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Aumentar Para</div>
               <div className="text-5xl font-outfit font-black text-white leading-none">${betAmount}</div>
               {isMyTurn && <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[8px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-lg">SUA VEZ</div>}
            </div>

            {/* Atalhos Rápidos: Blinds */}
            <div className="space-y-2">
               <div className="text-[8px] font-black text-white/20 uppercase px-2">Blinds (BB: ${bbValue})</div>
               <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 5].map(mult => (
                    <button 
                      key={`bb-${mult}`}
                      onClick={() => setBetAmount(mult * bbValue)}
                      className="bg-white/5 hover:bg-white/10 py-2.5 rounded-xl text-[10px] font-black text-white/60 border border-white/5 transition-all"
                    >
                      {mult}BB
                    </button>
                  ))}
               </div>
            </div>

            {/* Atalhos Rápidos: Pot */}
            <div className="space-y-2">
               <div className="text-[8px] font-black text-white/20 uppercase px-2">Fração do Pote</div>
               <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '1/4', mult: 0.25 },
                    { label: '1/2', mult: 0.5 },
                    { label: '3/4', mult: 0.75 },
                    { label: 'POT', mult: 1 }
                  ].map(p => (
                    <button 
                      key={`pot-${p.label}`}
                      onClick={() => setBetAmount(Math.min(Math.round(currentPot * p.mult), player.balance))}
                      className="bg-white/5 hover:bg-white/10 py-2.5 rounded-xl text-[10px] font-black text-white/60 border border-white/5 transition-all"
                    >
                      {p.label}
                    </button>
                  ))}
               </div>
            </div>

            {/* Chips (Manual) */}
            <div className="flex flex-wrap justify-center gap-3">
               {chips.map(c => (
                 <PokerChip key={c.value} value={c.value} color={c.color} size="sm" onClick={() => setBetAmount(prev => Math.min(prev + c.value, player.balance))} />
               ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
               <button onClick={() => setBetAmount(0)} className="bg-white/5 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest text-white/30">Limpar</button>
               <button onClick={() => setBetAmount(player.balance)} className="bg-red-900/40 text-red-400 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest border border-red-500/20">All-in</button>
            </div>
         </div>
      </div>

      {/* Barra de Ações Rápidas Inferior */}
      <div className="p-3 grid grid-cols-3 gap-2 bg-black border-t border-white/5 pb-8 sm:pb-4">
         <button 
           onClick={() => handleAction('FOLD')}
           disabled={!isMyTurn}
           className={`py-6 rounded-[24px] font-black text-[10px] uppercase transition-all border-2 ${isMyTurn ? 'bg-red-950/40 border-red-500/20 text-red-200 active:scale-95' : 'bg-white/5 border-transparent text-white/10 pointer-events-none'}`}
         >
           FOLD
         </button>
         
         <button 
           onClick={() => handleAction(callAmount > 0 ? 'CALL' : 'CHECK')}
           disabled={!isMyTurn}
           className={`py-6 rounded-[24px] font-black text-[10px] uppercase transition-all border-2 ${isMyTurn ? 'bg-blue-600 border-blue-400 text-white active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-white/5 border-transparent text-white/10 pointer-events-none'}`}
         >
           {callAmount > 0 ? `CALL $${callAmount}` : 'CHECK'}
         </button>

         <button 
           disabled={!isMyTurn || betAmount < (callAmount || 1)}
           onClick={() => handleAction('BET', betAmount)}
           className={`py-6 rounded-[24px] font-black text-[10px] uppercase transition-all border-2 ${isMyTurn && betAmount >= (callAmount || 1) ? 'bg-yellow-600 border-yellow-400 text-black active:scale-95 shadow-[0_0_20px_rgba(202,138,4,0.3)]' : 'bg-white/5 border-transparent text-white/10 pointer-events-none'}`}
         >
           {maxOnTable > 0 ? 'RAISE' : 'BET'}
         </button>
      </div>
    </div>
  );
};

export default PlayerDashboard;
