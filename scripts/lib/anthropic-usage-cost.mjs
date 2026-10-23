/** API list-price estimate; preserve each cache-write duration from usage_report. */
export function anthropicUsageDollars(tokens, price) {
  return (
    ((tokens.input ?? 0) / 1_000_000) * price.in +
    ((tokens.output ?? 0) / 1_000_000) * price.out +
    ((tokens.cacheRead ?? 0) / 1_000_000) * price.in * (price.crMult ?? 0.1) +
    ((tokens.cacheCreate5m ?? 0) / 1_000_000) * price.in * 1.25 +
    ((tokens.cacheCreate1h ?? 0) / 1_000_000) * price.in * 2
  );
}
