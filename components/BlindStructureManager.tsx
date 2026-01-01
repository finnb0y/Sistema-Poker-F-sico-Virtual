import React, { useState } from 'react';
import { BlindInterval, BlindLevel } from '../types';
import { generateBlindStructureFromIntervals } from '../utils/blindStructure';
import { handleNumericInput, DEFAULT_BREAK_DURATION } from '../utils/inputHelpers';

// Default frequency for breaks when first enabled (every X levels)
const DEFAULT_BREAK_FREQUENCY = 5;

interface BlindStructureManagerProps {
  initialIntervals: BlindInterval[];
  initialLevels: BlindLevel[];
  breakEnabled: boolean;
  breakDuration: number;
  breakFrequency: number;
  onSave: (intervals: BlindInterval[], levels: BlindLevel[], breakEnabled: boolean, breakDuration: number, breakFrequency: number) => void;
  onClose: () => void;
}

const BlindStructureManager: React.FC<BlindStructureManagerProps> = ({
  initialIntervals,
  initialLevels,
  breakEnabled: initialBreakEnabled,
  breakDuration: initialBreakDuration,
  breakFrequency: initialBreakFrequency,
  onSave,
  onClose
}) => {
  const [intervals, setIntervals] = useState<BlindInterval[]>(initialIntervals);
  const [levels, setLevels] = useState<BlindLevel[]>(initialLevels);
  const [breakEnabled, setBreakEnabled] = useState(initialBreakEnabled);
  const [breakDuration, setBreakDuration] = useState(initialBreakDuration);
  const [breakFrequency, setBreakFrequency] = useState(initialBreakFrequency);

  const addInterval = () => {
    const lastInterval = intervals[intervals.length - 1];
    const lastLevel = levels.filter(l => !l.isBreak)[levels.filter(l => !l.isBreak).length - 1];
    
    const newInterval: BlindInterval = {
      startingSmallBlind: lastLevel ? lastLevel.smallBlind + lastInterval.increment : 100,
      increment: lastInterval?.increment || 100,
      levelDuration: lastInterval?.levelDuration || 15,
      numberOfLevels: 5
    };
    
    setIntervals([...intervals, newInterval]);
    regenerateLevels([...intervals, newInterval]);
  };

  const updateInterval = (index: number, field: keyof BlindInterval, value: number) => {
    const newIntervals = [...intervals];
    newIntervals[index] = { ...newIntervals[index], [field]: value };
    setIntervals(newIntervals);
    regenerateLevels(newIntervals);
  };

  const removeInterval = (index: number) => {
    if (intervals.length > 1) {
      const newIntervals = intervals.filter((_, i) => i !== index);
      setIntervals(newIntervals);
      regenerateLevels(newIntervals);
    }
  };

  const addManualBreak = (afterIndex: number) => {
    const newLevels = [...levels];
    newLevels.splice(afterIndex + 1, 0, {
      smallBlind: 0,
      bigBlind: 0,
      ante: 0,
      duration: breakDuration || DEFAULT_BREAK_DURATION,
      isBreak: true
    });
    setLevels(newLevels);
  };

  const removeBreak = (index: number) => {
    const newLevels = levels.filter((_, i) => i !== index);
    setLevels(newLevels);
  };

  const regenerateLevels = (
    currentIntervals: BlindInterval[] = intervals,
    currentBreakEnabled: boolean = breakEnabled,
    currentBreakDuration: number = breakDuration,
    currentBreakFrequency: number = breakFrequency
  ) => {
    const newLevels = generateBlindStructureFromIntervals(
      currentIntervals,
      currentBreakEnabled,
      currentBreakDuration,
      currentBreakFrequency
    );
    setLevels(newLevels);
  };

  const updateLevel = (index: number, field: 'smallBlind' | 'bigBlind' | 'ante' | 'duration', value: number) => {
    const newLevels = [...levels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    
    // Issue 3 fix: Remove automatic validation for Big Blind in generated structure
    // Users should be able to edit both Small and Big Blind independently
    
    setLevels(newLevels);
  };

  const toggleBreaks = (enabled: boolean) => {
    setBreakEnabled(enabled);
    // When activating breaks, set default frequency if not already set
    const newFrequency = enabled && breakFrequency === 0 ? DEFAULT_BREAK_FREQUENCY : breakFrequency;
    setBreakFrequency(newFrequency);
    // Pass the new values directly to regenerateLevels to avoid state update race condition
    regenerateLevels(intervals, enabled, breakDuration, newFrequency);
  };

  const updateBreakSettings = (duration?: number, frequency?: number) => {
    const newDuration = duration !== undefined ? duration : breakDuration;
    const newFrequency = frequency !== undefined ? frequency : breakFrequency;
    
    if (duration !== undefined) setBreakDuration(duration);
    if (frequency !== undefined) setBreakFrequency(frequency);
    
    // Pass the new values directly to regenerateLevels to avoid state update race condition
    regenerateLevels(intervals, breakEnabled, newDuration, newFrequency);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] flex items-center justify-center p-8 animate-in fade-in" onClick={onClose}>
      <div className="glass max-w-7xl w-full max-h-[90vh] rounded-[50px] p-10 border-2 border-white/10 overflow-y-auto animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl font-outfit font-black text-white italic tracking-tighter uppercase">Gerenciar Estrutura de Blinds</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-3xl font-black">✕</button>
        </div>

        {/* Intervals Configuration */}
        <div className="space-y-6 mb-10">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black text-white">Intervalos de Progressão</h3>
            <button 
              onClick={addInterval}
              className="bg-green-600 hover:bg-green-500 text-white font-black px-6 py-3 rounded-2xl text-[10px] uppercase shadow-lg transition-all"
            >
              + Adicionar Intervalo
            </button>
          </div>

          {intervals.map((interval, index) => (
            <div key={index} className="bg-white/5 rounded-3xl p-6 border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-black text-yellow-500">Intervalo {index + 1}</h4>
                {intervals.length > 1 && (
                  <button 
                    onClick={() => removeInterval(index)}
                    className="text-red-500 hover:text-red-400 text-sm font-black"
                  >
                    🗑️ Remover
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Small Blind Inicial</label>
                  <input 
                    type="number" 
                    value={interval.startingSmallBlind || ''}
                    onChange={(e) => updateInterval(index, 'startingSmallBlind', handleNumericInput(e.target.value))}
                    placeholder="0"
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white font-bold outline-none focus:border-yellow-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Incremento</label>
                  <input 
                    type="number" 
                    value={interval.increment || ''}
                    onChange={(e) => updateInterval(index, 'increment', handleNumericInput(e.target.value))}
                    placeholder="0"
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-yellow-500 font-bold outline-none focus:border-yellow-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Duração (min)</label>
                  <input 
                    type="number" 
                    value={interval.levelDuration || ''}
                    onChange={(e) => updateInterval(index, 'levelDuration', handleNumericInput(e.target.value))}
                    placeholder="0"
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white font-bold outline-none focus:border-yellow-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Nº de Níveis</label>
                  <input 
                    type="number" 
                    value={interval.numberOfLevels || ''}
                    onChange={(e) => updateInterval(index, 'numberOfLevels', handleNumericInput(e.target.value))}
                    placeholder="0"
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white font-bold outline-none focus:border-yellow-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Big Blind Inicial</label>
                  <div className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-green-500 font-bold">
                    {interval.startingSmallBlind * 2}
                  </div>
                  <div className="text-[7px] text-white/30 font-black">Auto: 2x Small Blind</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Break Configuration */}
        <div className="bg-white/5 rounded-3xl p-6 border border-white/10 mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black text-white">Intervalos (Breaks)</h3>
            <button 
              onClick={() => toggleBreaks(!breakEnabled)}
              className={`w-16 h-8 rounded-full relative transition-all duration-300 border border-white/10 ${breakEnabled ? 'bg-blue-600' : 'bg-white/5'}`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md ${breakEnabled ? 'left-9' : 'left-1'}`} />
            </button>
          </div>

          {breakEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Duração do Break (min)</label>
                <input 
                  type="number" 
                  value={breakDuration || ''}
                  onChange={(e) => updateBreakSettings(handleNumericInput(e.target.value), undefined)}
                  placeholder="0"
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white font-bold outline-none focus:border-yellow-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Break a Cada X Níveis (0 = sem breaks)</label>
                <input 
                  type="number" 
                  value={breakFrequency || ''}
                  onChange={(e) => updateBreakSettings(undefined, handleNumericInput(e.target.value))}
                  placeholder="0"
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white font-bold outline-none focus:border-yellow-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Generated Levels Preview */}
        <div className="bg-black/40 rounded-3xl p-6 mb-10">
          <h3 className="text-xl font-black text-white mb-4">Níveis Gerados ({levels.length} níveis)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto pr-2">
            {levels.map((level, idx) => (
              <div key={idx}>
                <div className={`rounded-xl p-4 border ${level.isBreak ? 'bg-blue-600/20 border-blue-500/30' : 'bg-white/5 border-white/5'}`}>
                  {level.isBreak ? (
                    <>
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Break</div>
                        <button 
                          onClick={() => removeBreak(idx)}
                          className="text-red-500 hover:text-red-400 text-xs font-black"
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[7px] text-blue-300 font-black">Duração (min)</label>
                        <input 
                          type="number" 
                          value={level.duration || ''}
                          onChange={(e) => updateLevel(idx, 'duration', handleNumericInput(e.target.value))}
                          placeholder="0"
                          className="w-full bg-black/40 border border-blue-500/30 rounded p-2 text-lg font-black text-blue-400 outline-none focus:border-blue-500"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Nível {levels.filter((l, i) => i < idx && !l.isBreak).length + 1}</div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <div className="text-[7px] text-white/30 font-black">SB</div>
                          <input 
                            type="number" 
                            value={level.smallBlind || ''}
                            onChange={(e) => updateLevel(idx, 'smallBlind', handleNumericInput(e.target.value))}
                            placeholder="0"
                            className="w-full bg-black/40 border border-white/5 rounded p-1 text-sm font-black text-yellow-500 outline-none focus:border-yellow-500"
                          />
                        </div>
                        <div>
                          <div className="text-[7px] text-white/30 font-black">BB</div>
                          <input 
                            type="number" 
                            value={level.bigBlind || ''}
                            onChange={(e) => updateLevel(idx, 'bigBlind', handleNumericInput(e.target.value))}
                            placeholder="0"
                            className="w-full bg-black/40 border border-white/5 rounded p-1 text-sm font-black text-green-500 outline-none focus:border-green-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[7px] text-white/30 font-black">Ante</div>
                          <div className="w-full bg-black/20 border border-white/5 rounded p-1 text-xs font-black text-blue-400">
                            {level.ante}
                          </div>
                        </div>
                        <div>
                          <div className="text-[7px] text-white/30 font-black">Tempo</div>
                          <input 
                            type="number" 
                            value={level.duration || ''}
                            onChange={(e) => updateLevel(idx, 'duration', handleNumericInput(e.target.value))}
                            placeholder="0"
                            className="w-full bg-black/40 border border-white/5 rounded p-1 text-xs font-black text-white outline-none focus:border-yellow-500"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {/* Add Break Button - appears after each level/break */}
                {!level.isBreak && (
                  <button 
                    onClick={() => addManualBreak(idx)}
                    className="w-full mt-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded-lg text-blue-400 text-[8px] font-black uppercase transition-all"
                  >
                    + Adicionar Break Aqui
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button 
            onClick={() => onSave(intervals, levels, breakEnabled, breakDuration, breakFrequency)}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-black py-6 rounded-3xl text-lg uppercase shadow-2xl transition-all"
          >
            Salvar Estrutura
          </button>
          <button 
            onClick={onClose}
            className="px-10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-black py-6 rounded-3xl text-lg uppercase transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlindStructureManager;
