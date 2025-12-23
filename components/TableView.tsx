
import React, { useState, useMemo } from 'react';
import { GameState, PlayerStatus, Player } from '../types';

interface TableViewProps {
  state: GameState;
  tableId: number;
  onPlayerClick?: (player: Player) => void;
  onSeatClick?: (seatNumber: number) => void;
  showEmptySeats?: boolean;
  currentPlayerId?: string; // ID of the logged-in player to highlight
}

const TableView: React.FC<TableViewProps> = ({ 
  state, 
  tableId, 
  onPlayerClick, 
  onSeatClick, 
  showEmptySeats = true,
  currentPlayerId
}) => {
  const [showingRealNames, setShowingRealNames] = useState<Record<string, boolean>>({});
  const tableState = state.tableStates.find(t => t.id === tableId);
  const tournament = state.tournaments.find(t => t.id === tableState?.tournamentId);
  
  // Memoize the registry lookup map for performance
  const registryMap = useMemo(() => {
    const map = new Map<string, { name: string; nickname?: string }>();
    state.registry.forEach(person => {
      map.set(person.id, { name: person.name, nickname: person.nickname });
    });
    return map;
  }, [state.registry]);
  
  if (!tableState || !tournament || !tournament.isActive) return <div className="h-full w-full flex items-center justify-center text-white/10 font-black uppercase tracking-[10px]">MESA DESATIVADA</div>;

  const maxSeats = tournament.config.maxSeats;
  const tablePlayers = state.players.filter(p => p.tableId === tableId);
  
  // Get current blinds from the blind structure
  const currentBlindLevel = tournament.config.blindStructure?.levels?.[tableState.currentBlindLevel] || {
    smallBlind: state.smallBlind,
    bigBlind: state.bigBlind,
    ante: state.bigBlind,
    duration: 15,
    isBreak: false
  };

  const getSeatStyle = (seatNumber: number) => {
    const angleOffset = Math.PI / 2; 
    const angle = angleOffset + ((seatNumber - 1) / maxSeats) * 2 * Math.PI;
    const rx = 42; 
    const ry = 35;
    const x = 50 + rx * Math.cos(angle);
    const y = 48 + ry * Math.sin(angle);
    return { 
      left: `${x}%`, 
      top: `${y}%`,
      transform: 'translate(-50%, -50%)'
    };
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-4 sm:p-8 overflow-hidden relative poker-felt">
      <div className="relative w-full max-w-6xl aspect-[1.8/1] sm:aspect-[2.1/1] rounded-[150px] sm:rounded-[300px] border-[12px] sm:border-[22px] border-[#2a1a15] shadow-[0_10px_60px_rgba(0,0,0,0.8)] flex items-center justify-center bg-[#1a472a]">
        <div className="absolute inset-0 rounded-[140px] sm:rounded-[280px] border-2 sm:border-4 border-white/5 opacity-30"></div>
        
        <div className="text-center z-10 select-none px-4">
          <div className="text-yellow-500/30 text-[7px] sm:text-[10px] font-black uppercase tracking-[4px] sm:tracking-[10px] mb-1 sm:mb-2">{tournament.acronym} • MESA {tableId}</div>
          
          {/* Community Cards */}
          {tableState.handInProgress && tableState.bettingRound && tableState.bettingRound !== 'PRE_FLOP' && (
            <div className="flex justify-center gap-1 sm:gap-2 mb-3 sm:mb-4">
              {/* Flop */}
              {(tableState.bettingRound === 'FLOP' || tableState.bettingRound === 'TURN' || tableState.bettingRound === 'RIVER' || tableState.bettingRound === 'SHOWDOWN') && (
                <>
                  <div className="w-8 h-11 sm:w-12 sm:h-16 bg-white/10 border border-white/20 rounded opacity-40 flex items-center justify-center">
                    <span className="text-white/30 text-xs sm:text-sm">🂠</span>
                  </div>
                  <div className="w-8 h-11 sm:w-12 sm:h-16 bg-white/10 border border-white/20 rounded opacity-40 flex items-center justify-center">
                    <span className="text-white/30 text-xs sm:text-sm">🂠</span>
                  </div>
                  <div className="w-8 h-11 sm:w-12 sm:h-16 bg-white/10 border border-white/20 rounded opacity-40 flex items-center justify-center">
                    <span className="text-white/30 text-xs sm:text-sm">🂠</span>
                  </div>
                </>
              )}
              {/* Turn */}
              {(tableState.bettingRound === 'TURN' || tableState.bettingRound === 'RIVER' || tableState.bettingRound === 'SHOWDOWN') && (
                <div className="w-8 h-11 sm:w-12 sm:h-16 bg-white/10 border border-white/20 rounded opacity-40 flex items-center justify-center ml-1 sm:ml-2">
                  <span className="text-white/30 text-xs sm:text-sm">🂠</span>
                </div>
              )}
              {/* River */}
              {(tableState.bettingRound === 'RIVER' || tableState.bettingRound === 'SHOWDOWN') && (
                <div className="w-8 h-11 sm:w-12 sm:h-16 bg-white/10 border border-white/20 rounded opacity-40 flex items-center justify-center">
                  <span className="text-white/30 text-xs sm:text-sm">🂠</span>
                </div>
              )}
            </div>
          )}
          
          <div className="text-4xl sm:text-8xl font-outfit font-black text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
            ${tableState.pot}
          </div>
          <div className="mt-2 sm:mt-4 flex flex-wrap justify-center gap-2 sm:gap-6">
             <div className="text-white/40 text-[7px] sm:text-[9px] font-black uppercase tracking-widest bg-black/20 px-2 sm:px-4 py-0.5 sm:py-1 rounded-full border border-white/5">
                SB/BB: {currentBlindLevel.smallBlind}/{currentBlindLevel.bigBlind}
             </div>
             {currentBlindLevel.ante > 0 && (
               <div className="text-blue-400 text-[7px] sm:text-[9px] font-black uppercase tracking-widest bg-blue-900/20 px-2 sm:px-4 py-0.5 sm:py-1 rounded-full border border-blue-500/20">
                  Ante: {currentBlindLevel.ante}
               </div>
             )}
             <div className="text-white/40 text-[7px] sm:text-[9px] font-black uppercase tracking-widest bg-black/20 px-2 sm:px-4 py-0.5 sm:py-1 rounded-full border border-white/5">
                Nível {tableState.currentBlindLevel + 1}
             </div>
             <div className="text-white/40 text-[7px] sm:text-[9px] font-black uppercase tracking-widest bg-black/20 px-2 sm:px-4 py-0.5 sm:py-1 rounded-full border border-white/5">
                {maxSeats}-MAX
             </div>
          </div>
        </div>

        <div className="absolute bottom-[-6px] sm:bottom-[-10px] left-1/2 -translate-x-1/2 z-30">
           <div className="bg-[#111] border-2 sm:border-4 border-[#2a1a15] px-6 sm:px-10 py-1 sm:py-3 rounded-t-2xl sm:rounded-t-3xl shadow-xl">
              <span className="text-white/30 text-[7px] sm:text-[9px] font-black uppercase tracking-[3px] sm:tracking-[5px]">DEALER</span>
           </div>
        </div>

        {Array.from({ length: maxSeats }).map((_, i) => {
          const seatNum = i + 1;
          const player = tablePlayers.find(p => p.seatNumber === seatNum);
          const style = getSeatStyle(seatNum);
          const isDealerSeat = seatNum === 1;

          if (!player) {
            if (!showEmptySeats) return null;
            // Seat 1 is reserved for the physical dealer (no visual indicator needed)
            if (isDealerSeat) {
              return null; // Don't show seat 1 at all
            }
            return (
              <div 
                key={`seat-${seatNum}`}
                style={style}
                onClick={() => onSeatClick?.(seatNum)}
                className="absolute w-16 h-12 sm:w-28 sm:h-20 rounded-xl sm:rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all group"
              >
                <span className="text-white/10 text-[8px] sm:text-[10px] font-black">{seatNum}</span>
              </div>
            );
          }

          const isActive = tableState.currentTurn === player.id;
          const isFolded = player.status === PlayerStatus.FOLDED;
          const isDealerButton = tableState.dealerButtonPosition === seatNum;
          const isCurrentPlayer = currentPlayerId === player.id;
          
          // Get the registered person to access their real name and nickname (using memoized map)
          const registeredPerson = registryMap.get(player.personId);
          // By default, show nickname if available, otherwise show real name
          const displayName = showingRealNames[player.id] 
            ? (registeredPerson?.name || player.name)  // Show real name when toggled
            : (registeredPerson?.nickname || registeredPerson?.name || player.name); // Show nickname by default
          const canToggle = registeredPerson?.nickname && registeredPerson.nickname !== '';

          return (
            <div 
              key={player.id} 
              style={style}
              className={`absolute transition-all duration-500 z-20 ${isFolded ? 'opacity-30 grayscale' : 'opacity-100'}`}
            >
              <div 
                onClick={() => onPlayerClick?.(player)}
                className={`flex flex-col items-center p-2 sm:p-4 rounded-xl sm:rounded-[32px] glass min-w-[70px] sm:min-w-[140px] transition-all cursor-pointer relative group ${
                  isActive && isCurrentPlayer
                    ? 'ring-2 sm:ring-4 ring-yellow-500 scale-110 shadow-[0_0_20px_rgba(234,179,8,0.4)] bg-blue-500/10'
                    : isActive 
                    ? 'ring-2 sm:ring-4 ring-yellow-500 scale-110 shadow-[0_0_20px_rgba(234,179,8,0.4)]' 
                    : isCurrentPlayer 
                    ? 'ring-2 sm:ring-4 ring-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                    : 'hover:scale-105'
                }`}
              >
                <div 
                  onClick={(e) => {
                    if (canToggle) {
                      e.stopPropagation();
                      setShowingRealNames(prev => ({ ...prev, [player.id]: !prev[player.id] }));
                    }
                  }}
                  className={`text-[7px] sm:text-[10px] font-black text-white/70 mb-0.5 sm:mb-1 uppercase truncate max-w-[60px] sm:max-w-full ${canToggle ? 'hover:text-yellow-400 cursor-pointer' : ''}`}
                  title={canToggle ? 'Clique para alternar nome/apelido' : ''}
                >
                  {displayName}
                </div>
                <div className="text-sm sm:text-2xl font-outfit font-black text-green-400">${player.balance}</div>
                <div className="absolute -top-1.5 -left-1.5 sm:-top-3 sm:-left-3 w-4 h-4 sm:w-7 sm:h-7 bg-black border border-white/10 rounded-md sm:rounded-lg flex items-center justify-center text-[6px] sm:text-[10px] font-black text-white/40">{seatNum}</div>
                
                {/* Current Player Indicator */}
                {isCurrentPlayer && (
                  <div 
                    className="absolute top-0 right-0 w-5 h-5 sm:w-8 sm:h-8 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center text-[10px] sm:text-sm font-black text-white shadow-lg shadow-blue-500/50" 
                    title="Você"
                    role="img"
                    aria-label="Você - jogador atual"
                  >
                    👤
                  </div>
                )}
                
                {/* Dealer Button Indicator */}
                {isDealerButton && (
                  <div className="absolute -top-1.5 -right-1.5 sm:-top-3 sm:-right-3 w-6 h-6 sm:w-10 sm:h-10 bg-yellow-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] sm:text-sm font-black text-black shadow-lg shadow-yellow-500/50">
                    D
                  </div>
                )}
                
                {player.currentBet > 0 && (
                  <div className="absolute -bottom-6 sm:-bottom-10 bg-yellow-600 px-2 sm:px-5 py-0.5 sm:py-2 rounded-full text-white font-black text-[8px] sm:text-xs shadow-xl border border-white/10 whitespace-nowrap">
                    ${player.currentBet}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TableView;
