import { BlindLevel, BlindInterval } from '../types';

/**
 * Generates blind levels from an array of intervals with optional breaks
 * - Big blind is always 2x small blind
 * - Ante equals big blind value
 * - Each interval defines starting blinds, increment, duration, and number of levels
 */
export function generateBlindStructureFromIntervals(
  intervals: BlindInterval[],
  breakEnabled: boolean = false,
  breakDuration: number = 10,
  breakFrequency: number = 0
): BlindLevel[] {
  const levels: BlindLevel[] = [];
  let levelCount = 0;
  
  intervals.forEach((interval) => {
    let currentSmallBlind = interval.startingSmallBlind;
    
    for (let i = 0; i < interval.numberOfLevels; i++) {
      const bigBlind = currentSmallBlind * 2;
      levels.push({
        smallBlind: currentSmallBlind,
        bigBlind: bigBlind,
        ante: bigBlind,
        duration: interval.levelDuration,
        isBreak: false
      });
      
      levelCount++;
      
      // Add break if enabled and it's time for one
      if (breakEnabled && breakFrequency > 0 && levelCount % breakFrequency === 0) {
        levels.push({
          smallBlind: 0,
          bigBlind: 0,
          ante: 0,
          duration: breakDuration,
          isBreak: true
        });
      }
      
      currentSmallBlind += interval.increment;
    }
  });
  
  return levels;
}

/**
 * Creates a default blind structure with a single interval
 */
export function createDefaultBlindStructure(): { intervals: BlindInterval[], levels: BlindLevel[] } {
  const intervals: BlindInterval[] = [
    {
      startingSmallBlind: 50,
      increment: 50,
      levelDuration: 15,
      numberOfLevels: 10
    }
  ];
  
  const levels = generateBlindStructureFromIntervals(intervals, false, 10, 0);
  
  return { intervals, levels };
}

/**
 * Validates a blind level to ensure big blind = 2x small blind and ante = big blind
 */
export function validateAndFixBlindLevel(level: BlindLevel): BlindLevel {
  const correctedBigBlind = level.smallBlind * 2;
  return {
    ...level,
    bigBlind: correctedBigBlind,
    ante: correctedBigBlind
  };
}
