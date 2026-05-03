/** Percentage of `numerator / denominator`, rounded to `decimals`. Returns 0 if denominator is 0/undefined. */
export function percent(numerator: number, denominator: number | undefined, decimals = 1): number {
  if (!denominator) return 0;
  return parseFloat(((numerator / denominator) * 100).toFixed(decimals));
}
