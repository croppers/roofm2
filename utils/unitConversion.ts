/**
 * Convert square meters to square feet.
 */
export function sqmToSqft(m2: number): number {
  return m2 * 10.7639;
}

/**
 * Round a number to one decimal place.
 */
export function roundDecimal(value: number): number {
  return Math.round(value * 10) / 10;
} 