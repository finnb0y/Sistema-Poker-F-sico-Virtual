/**
 * Utility functions for handling form inputs
 */

/**
 * Default duration for breaks in minutes
 */
export const DEFAULT_BREAK_DURATION = 10;

/**
 * Helper function to handle numeric input without leading zeros
 * Treats "0" as an empty placeholder
 * @param value - The input value as a string
 * @returns The cleaned numeric value
 */
export const handleNumericInput = (value: string): number => {
  if (value === '' || value === '0') return 0;
  // Remove leading zeros only when followed by other digits
  const cleaned = value.replace(/^0+(?=\d)/, '');
  return Number(cleaned) || 0;
};
