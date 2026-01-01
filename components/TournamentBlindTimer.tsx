import React, { useEffect, useState } from 'react';
import { Tournament, ActionMessage, GameState } from '../types';

interface TournamentBlindTimerProps {
  tournament: Tournament;
  state: GameState;
  onDispatch: (action: ActionMessage) => void;
}

const TournamentBlindTimer: React.FC<TournamentBlindTimerProps> = ({ tournament, state, onDispatch }) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);

  // Get current blind level from first table assigned to this tournament
  const firstTable = state.tableStates.find(ts => ts.tournamentId === tournament.id);
  const currentBlindLevelIndex = firstTable?.currentBlindLevel || 0;
  const currentBlindLevel = tournament.config.blindStructure.levels[currentBlindLevelIndex];

  useEffect(() => {
    if (!tournament.isStarted || !tournament.currentBlindLevelStartTime || isPaused) {
      return;
    }

    // Track if we've already advanced to prevent multiple dispatches
    let hasAdvanced = false;

    // Calculate time remaining
    const calculateTimeRemaining = () => {
      if (!tournament.currentBlindLevelStartTime || !currentBlindLevel) {
        return 0;
      }

      const startTime = new Date(tournament.currentBlindLevelStartTime).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000); // seconds
      const duration = currentBlindLevel.duration * 60; // convert minutes to seconds
      const remaining = Math.max(0, duration - elapsed);

      return remaining;
    };

    // Update timer every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      // Auto-advance when time runs out (only once per level)
      if (remaining === 0 && !hasAdvanced) {
        hasAdvanced = true;
        onDispatch({
          type: 'AUTO_ADVANCE_BLIND_LEVEL',
          payload: { tournamentId: tournament.id },
          senderId: 'SYSTEM'
        });
      }
    }, 1000);

    // Initial calculation
    setTimeRemaining(calculateTimeRemaining());

    return () => clearInterval(interval);
  }, [tournament, currentBlindLevel, isPaused, onDispatch]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!tournament.isStarted) {
    return null;
  }

  const percentage = currentBlindLevel ? (timeRemaining / (currentBlindLevel.duration * 60)) * 100 : 0;

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 p-6 rounded-3xl border border-purple-500/30 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Timer de Blinds</div>
          <div className="text-2xl font-black text-white mt-1">{formatTime(timeRemaining)}</div>
        </div>
        <button
          onClick={() => setIsPaused(!isPaused)}
          className={`px-4 py-2 rounded-xl font-black text-xs uppercase transition-all ${
            isPaused 
              ? 'bg-green-600 hover:bg-green-500 text-white' 
              : 'bg-orange-600 hover:bg-orange-500 text-white'
          }`}
        >
          {isPaused ? '▶ Retomar' : '⏸ Pausar'}
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${
            percentage > 50 ? 'bg-green-500' : percentage > 25 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-black/40 p-3 rounded-xl">
          <div className="text-[8px] font-black text-white/40 uppercase tracking-widest">Small Blind</div>
          <div className="text-lg font-black text-yellow-400">{currentBlindLevel?.smallBlind || 0}</div>
        </div>
        <div className="bg-black/40 p-3 rounded-xl">
          <div className="text-[8px] font-black text-white/40 uppercase tracking-widest">Big Blind</div>
          <div className="text-lg font-black text-yellow-400">{currentBlindLevel?.bigBlind || 0}</div>
        </div>
        <div className="bg-black/40 p-3 rounded-xl">
          <div className="text-[8px] font-black text-white/40 uppercase tracking-widest">Ante</div>
          <div className="text-lg font-black text-yellow-400">{currentBlindLevel?.ante || 0}</div>
        </div>
      </div>
    </div>
  );
};

export default TournamentBlindTimer;
