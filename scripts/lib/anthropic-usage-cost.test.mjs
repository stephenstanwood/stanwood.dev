import { describe, expect, it } from "vitest";
import { anthropicUsageDollars } from "./anthropic-usage-cost.mjs";

describe("Anthropic API usage cost", () => {
  it("prices mixed Sonnet 5.5 token categories at their published rates", () => {
    expect(anthropicUsageDollars({
      input: 1_000_000, output: 1_000_000, cacheRead: 1_000_000,
      cacheCreate5m: 1_000_000, cacheCreate1h: 1_000_000,
    }, { in: 2, out: 10, crMult: 0.05 })).toBeCloseTo(18.6);
  });

  it("charges an hour-long write at twice the input rate", () => {
    expect(anthropicUsageDollars({ cacheCreate1h: 1_000_000 }, { in: 2, out: 10 })).toBe(4);
  });

  it("keeps older models' standard read and five-minute write rates", () => {
    expect(anthropicUsageDollars({
      input: 1_000_000, output: 1_000_000, cacheRead: 1_000_000, cacheCreate5m: 1_000_000,
    }, { in: 2, out: 10 })).toBeCloseTo(14.7);
  });
});
