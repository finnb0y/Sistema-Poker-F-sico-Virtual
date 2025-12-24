
import React, { useState } from 'react';
import { GameState, ActionMessage, PlayerStatus } from '../types';
import TableView from './TableView';
import { areAllPlayersAllInOrCapped } from '../utils/sidePotLogic';

interface TableDealerInterfaceProps {
  state: GameState;
  onDispatch: (action: ActionMessage) => void;
  onExit: () => void;
}

const TableDealerInterface: React.FC<TableDealerInterfaceProps> = ({ state, onDispatch, onExit }) => {
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);

  // Pot label constants
  const POT_LABELS = {
    MAIN: 'Pote Principal',
    SIDE: 'Pote Lateral',
  };

  if (!selectedTableId) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 poker-felt">
        <div className="w-full max-w-md glass p-10 rounded-[40px] border border-white/10 text-center shadow-2xl">
          <h2 className="text-4xl font-black text-white mb-8 italic tracking-tighter">DEALER</h2>
          <div className="grid grid-cols-1 gap-4">
            {state.tournaments.filter(t => t.isActive).map(tourney => (
              <div key={tourney.id} className="space-y-2">
                 <div className="text-[10px] font-black text-white/30 uppercase tracking-widest text-left px-2">{tourney.name}</div>
                 {tourney.assignedTableIds.map(tid => (
                    <button 
                      key={tid}
                      onClick={() => setSelectedTableId(tid)}
                      className="w-full bg-white/5 hover:bg-yellow-500 hover:text-black p-6 rounded-3xl font-black text-xl transition-all border border-white/5 flex justify-between items-center group"
                    >
                      <span>MESA {tid}</span>
                      <span className="text-[10px] text-white/20 group-hover:text-black/40">OPERAR</span>
                    </button>
                 ))}
              </div>
            ))}
          </div>
          <button onClick={onExit} className="mt-12 text-gray-600 hover:text-white font-bold uppercase text-[10px] tracking-[5px] transition-all">Sair</button>
        </div>
      </div>
    );
  }

  const tableState = state.tableStates.find(t => t.id === selectedTableId);
  const tablePlayers = state.players.filter(p => p.tableId === selectedTableId);
  const tournament = state.tournaments.find(t => t.id === tableState?.tournamentId);
  
  // Get current blind level
  const currentBlindLevel = tournament?.config.blindStructure?.levels?.[tableState?.currentBlindLevel || 0];
  
  // Check if all players are all-in or capped (no more actions possible)
  const allPlayersAllInOrCapped = tableState ? areAllPlayersAllInOrCapped(state.players, selectedTableId) : false;
  
  // Betting round labels
  const getRoundLabel = (round: string | null) => {
    switch(round) {
      case 'PRE_FLOP': return 'Pré-Flop';
      case 'FLOP': return 'Flop';
      case 'TURN': return 'Turn';
      case 'RIVER': return 'River';
      case 'SHOWDOWN': return 'Showdown';
      default: return 'Aguardando';
    }
  };
  
  const getNextRoundLabel = (round: string | null) => {
    switch(round) {
      case 'PRE_FLOP': return 'Abrir Flop';
      case 'FLOP': return 'Abrir Turn';
      case 'TURN': return 'Abrir River';
      case 'RIVER': return 'Showdown';
      default: return 'Próxima Rodada';
    }
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-[#050805]">
      <div className="flex-1 relative border-r border-white/5 overflow-hidden">
        <div className="absolute top-6 left-8 z-50">
           <button onClick={() => setSelectedTableId(null)} className="bg-black/60 p-4 rounded-2xl text-yellow-500 font-black border border-white/10">← VOLTAR</button>
        </div>
        <TableView state={state} tableId={selectedTableId} showEmptySeats={true} />
      </div>

      <div className="lg:w-[400px] bg-[#0a0f0a] flex flex-col border-l border-white/10 p-8 space-y-6">
         {/* Betting Round Display */}
         {tableState?.handInProgress && (
           <div className="bg-purple-900/20 p-6 rounded-[32px] border border-purple-500/30 space-y-2">
             <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Rodada de Apostas</div>
             <div className="text-2xl font-black text-purple-300">
               {getRoundLabel(tableState.bettingRound)}
             </div>
             <div className="text-sm font-black text-purple-400/60">
               Aposta Atual: ${tableState.currentBet}
             </div>
           </div>
         )}
         
         {/* Current Blind Level Display */}
         <div className="bg-black/40 p-6 rounded-[32px] border border-white/5 space-y-3">
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nível Atual</div>
            <div className="text-3xl font-black text-yellow-500">
              {currentBlindLevel ? `${currentBlindLevel.smallBlind}/${currentBlindLevel.bigBlind}` : 'N/A'}
            </div>
            {currentBlindLevel?.ante && currentBlindLevel.ante > 0 && (
              <div className="text-sm font-black text-blue-400">
                Ante: {currentBlindLevel.ante}
              </div>
            )}
            <div className="text-[10px] font-black text-white/40 uppercase">Nível {(tableState?.currentBlindLevel || 0) + 1}</div>
         </div>
         
         {/* Game Controls */}
         {!tableState?.handInProgress ? (
           <>
             {/* Dealer Button and Blind Controls */}
             <div className="grid grid-cols-2 gap-3">
               <button 
                 onClick={() => onDispatch({ type: 'MOVE_DEALER_BUTTON', payload: { tableId: selectedTableId }, senderId: 'DEALER' })} 
                 className="bg-yellow-600/20 hover:bg-yellow-600 text-yellow-500 hover:text-white font-black py-4 rounded-2xl text-[10px] uppercase shadow-lg transition-all border border-yellow-500/20"
               >
                 🔄 Mover Dealer
               </button>
               <button 
                 onClick={() => onDispatch({ type: 'ADVANCE_BLIND_LEVEL', payload: { tableId: selectedTableId }, senderId: 'DEALER' })} 
                 className="bg-blue-600/20 hover:bg-blue-600 text-blue-500 hover:text-white font-black py-4 rounded-2xl text-[10px] uppercase shadow-lg transition-all border border-blue-500/20"
               >
                 ⬆️ Subir Blind
               </button>
             </div>
             
             <button 
               onClick={() => onDispatch({ type: 'START_HAND', payload: { tableId: selectedTableId }, senderId: 'DEALER' })} 
               className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-black py-10 rounded-[40px] text-2xl shadow-2xl transition-all uppercase tracking-tighter"
             >
               SOLTAR MÃO
             </button>
           </>
         ) : (
           <>
             {/* Hand in Progress Controls */}
             {allPlayersAllInOrCapped && tableState.currentTurn === null && (
               <div className="bg-orange-900/30 p-4 rounded-2xl border border-orange-500/30 mb-3">
                 <div className="text-center text-xs text-orange-400 font-black uppercase tracking-wide">
                   ⚠️ Todos All-In - Sem Ações Restantes
                 </div>
               </div>
             )}
             <button 
               onClick={() => onDispatch({ type: 'ADVANCE_BETTING_ROUND', payload: { tableId: selectedTableId }, senderId: 'DEALER' })} 
               className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-8 rounded-[32px] text-lg shadow-2xl transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed"
               disabled={tableState.bettingRound === 'SHOWDOWN' || (tableState.currentTurn !== null && !allPlayersAllInOrCapped)}
             >
               🃏 {getNextRoundLabel(tableState.bettingRound)}
             </button>
             {tableState.currentTurn !== null && !allPlayersAllInOrCapped && (
               <div className="text-center text-xs text-purple-400/60 font-black uppercase tracking-wide -mt-3">
                 Aguardando ações dos jogadores
               </div>
             )}
           </>
         )}

                   {/* Pot Display and Distribution Controls */}
          {tableState?.potDistribution ? (
            <>
              {/* Active Pot Distribution UI */}
              <div className="bg-gradient-to-br from-green-900/40 to-yellow-900/40 p-6 rounded-[32px] border-2 border-green-500/50 space-y-4 animate-pulse-slow">
                <div className="text-[10px] font-black text-green-400 uppercase tracking-widest">
                  {tableState.potDistribution.currentPotIndex === 0 
                    ? POT_LABELS.MAIN 
                    : `${POT_LABELS.SIDE} ${tableState.potDistribution.currentPotIndex}`
                  }
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs text-white/60 font-black uppercase">
                      Pote {tableState.potDistribution.currentPotIndex + 1} de {tableState.potDistribution.pots.length}
                    </div>
                    <div className="text-3xl font-black text-green-400">
                      ${tableState.potDistribution.pots[tableState.potDistribution.currentPotIndex].amount}
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-green-500/20 border-4 border-green-500 flex items-center justify-center animate-pulse">
                    <span className="text-2xl">💰</span>
                  </div>
                </div>
              </div>

              {/* Eligible Players for Current Pot */}
              <div className="space-y-3">
                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest px-2">
                  Jogadores Elegíveis ({tableState.potDistribution.selectedWinnerIds.length} selecionados)
                </div>
                {tablePlayers
                  .filter(p => tableState.potDistribution!.pots[tableState.potDistribution!.currentPotIndex].eligiblePlayerIds.includes(p.id))
                  .map(p => {
                    const isSelected = tableState.potDistribution!.selectedWinnerIds.includes(p.id);
                    return (
                      <div 
                        key={p.id} 
                        className={`p-4 rounded-2xl flex justify-between items-center border-2 transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-green-500/20 border-green-500 shadow-lg shadow-green-500/20' 
                            : 'bg-white/5 border-white/10 hover:border-white/30'
                        }`}
                        onClick={() => onDispatch({ type: 'TOGGLE_POT_WINNER', payload: { tableId: selectedTableId, playerId: p.id }, senderId: 'DEALER' })}
                      >
                        <div className="flex gap-4 items-center">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                            isSelected ? 'bg-green-500 text-white' : 'bg-white/10 text-white/40'
                          }`}>
                            {isSelected ? '✓' : p.seatNumber}
                          </div>
                          <span className={`font-bold ${isSelected ? 'text-green-400' : 'text-white'}`}>{p.name}</span>
                        </div>
                        {isSelected && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-500 rounded-r-full animate-pulse"></div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Deliver Pot Button */}
              <button 
                onClick={() => onDispatch({ type: 'DELIVER_CURRENT_POT', payload: { tableId: selectedTableId }, senderId: 'DEALER' })} 
                disabled={tableState.potDistribution.selectedWinnerIds.length === 0}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-8 rounded-[32px] text-xl shadow-2xl transition-all uppercase disabled:opacity-30 disabled:cursor-not-allowed"
              >
                🎯 Entregar Pote
              </button>
            </>
          ) : (
            <>
              {/* Normal Pot Display */}
              <div className="text-center bg-black/40 p-6 rounded-[32px] border border-white/5">
                <div className="text-[10px] font-black text-gray-500 uppercase mb-1 tracking-widest">Pote Atual</div>
                <div className="text-4xl font-black text-green-500">${tableState?.pot || 0}</div>
              </div>
              
              {/* Player List with Manual Distribution Button */}
              {tableState?.handInProgress && tableState.bettingRound === 'SHOWDOWN' && (
                <button 
                  onClick={() => onDispatch({ type: 'START_POT_DISTRIBUTION', payload: { tableId: selectedTableId }, senderId: 'DEALER' })} 
                  className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-black py-6 rounded-[32px] text-sm shadow-xl transition-all uppercase"
                >
                  🏆 Iniciar Distribuição Manual
                </button>
              )}

              <div className="space-y-4">
                {tablePlayers.map(p => (
                  <div key={p.id} className="p-4 bg-white/5 rounded-2xl flex justify-between items-center border border-white/5">
                    <div className="flex gap-4 items-center">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-black text-white/40 text-xs">{p.seatNumber}</div>
                      <div>
                        <span className="font-bold text-white">{p.name}</span>
                        <div className="text-[10px] text-green-500 font-black">${p.balance}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
       </div>
    </div>
  );
};

export default TableDealerInterface;
