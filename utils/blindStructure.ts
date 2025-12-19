import { BlindLevel } from '../types';

/**
 * Calculates the increment value based on the current blind level
 * - For blinds < 2000: increment = initialIncrement (e.g., 100)
 * - For blinds 2000-19999: increment = 500
 * - For blinds >= 20000: increment = 5000
 */
function getIncrementForBlind(bigBlind: number, initialIncrement: number): number {
  if (bigBlind >= 20000) {
    return 5000;
  } else if (bigBlind >= 2000) {
    return 500;
  } else {
    return initialIncrement;
  }
}

/**
 * Generates a blind structure based on the initial small and big blind values
 * The progression is linear with increments that change based on blind levels:
 * - Initial increment equals the initial small blind value
 * - Increments change to 500 when blinds reach 2000
 * - Increments change to 5000 when blinds reach 20k
 */
export function generateBlindStructure(
  initialSmallBlind: number, 
  initialBigBlind: number,
  levelDuration: number = 15,
  numberOfLevels: number = 20
): BlindLevel[] {
  const levels: BlindLevel[] = [];
  
  // The increment is the initial small blind value
  const initialIncrement = initialSmallBlind;
  
  let currentSmallBlind = initialSmallBlind;
  let currentBigBlind = initialBigBlind;
  
  for (let i = 0; i < numberOfLevels; i++) {
    levels.push({
      smallBlind: currentSmallBlind,
      bigBlind: currentBigBlind,
      duration: levelDuration
    });
    
    // Calculate next level
    const increment = getIncrementForBlind(currentBigBlind, initialIncrement);
    currentSmallBlind += increment;
    currentBigBlind += increment;
  }
  
  return levels;
}

/**
 * Creates a default blind structure (50/100 starting blinds)
 */
export function createDefaultBlindStructure(): BlindLevel[] {
  return generateBlindStructure(50, 100, 15, 20);
}
