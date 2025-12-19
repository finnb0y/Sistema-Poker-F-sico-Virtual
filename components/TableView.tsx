
import React from 'react';
import { GameState, PlayerStatus, Player } from '../types';

interface TableViewProps {
  state: GameState;
  tableId: number;
  onPlayerClick?: (player: Player) => void;
  onSeatClick?: (seatNumber: number) => void;
  showEmptySeats?: boolean;
}

const TableView: React.FC<TableViewProps> = ({ 
  state, 
  tableId, 
  onPlayerClick, 
  onSeatClick, 
  showEmptySeats = true 
}) => {
  const tableState = state.tableStates.find(t => t.id === tableId);
  const tournament = state.tournaments.find(t => t.id === tableState?.tournamentId);
  
  if (!tableState || !tournament || !tournament.isActive) return <div className="h-full w-full flex items-center justify-center text-white/10 font-black uppercase tracking-[10px]">MESA DESATIVADA</div>;

  const maxSeats = tournament.config.maxSeats;
  const tablePlayers = state.players.filter(p => p.tableId === tableId);

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
          <div className="text-4xl sm:text-8xl font-outfit font-black text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
            ${tableState.pot}
          </div>
          <div className="mt-2 sm:mt-4 flex flex-wrap justify-center gap-2 sm:gap-6">
             <div className="text-white/40 text-[7px] sm:text-[9px] font-black uppercase tracking-widest bg-black/20 px-2 sm:px-4 py-0.5 sm:py-1 rounded-full border border-white/5">
                {state.smallBlind}/{state.bigBlind}
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

          if (!player) {
            if (!showEmptySeats) return null;
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

          return (
            <div 
              key={player.id} 
              style={style}
              className={`absolute transition-all duration-500 z-20 ${isFolded ? 'opacity-30 grayscale' : 'opacity-100'}`}
            >
              <div 
                onClick={() => onPlayerClick?.(player)}
                className={`flex flex-col items-center p-2 sm:p-4 rounded-xl sm:rounded-[32px] glass min-w-[70px] sm:min-w-[140px] transition-all cursor-pointer relative group ${isActive ? 'ring-2 sm:ring-4 ring-yellow-500 scale-110 shadow-[0_0_20px_rgba(234,179,8,0.4)]' : 'hover:scale-105'}`}
              >
                <div className="text-[7px] sm:text-[10px] font-black text-white/70 mb-0.5 sm:mb-1 uppercase truncate max-w-[60px] sm:max-w-full">{player.name}</div>
                <div className="text-sm sm:text-2xl font-outfit font-black text-green-400">${player.balance}</div>
                <div className="absolute -top-1.5 -left-1.5 sm:-top-3 sm:-left-3 w-4 h-4 sm:w-7 sm:h-7 bg-black border border-white/10 rounded-md sm:rounded-lg flex items-center justify-center text-[6px] sm:text-[10px] font-black text-white/40">{seatNum}</div>
                
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
