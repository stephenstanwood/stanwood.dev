import { describe, expect, it } from "vitest";
import { compactAge, compactDuration } from "./tvFormat";

describe("compactDuration", () => {
  it("shows minutes under an hour and zero-pads past it", () => {
    expect(compactDuration(45 * 60)).toBe("45m");
    expect(compactDuration(65 * 60)).toBe("1h05");
  });
});

describe("compactAge", () => {
  const now = Date.parse("2026-10-31T12:00:00Z");
  it("buckets by days, weeks, then months", () => {
    expect(compactAge("2026-10-31T08:00:00Z", now)).toBe("today");
    expect(compactAge("2026-10-28T12:00:00Z", now)).toBe("3d ago");
    expect(compactAge("2026-10-17T12:00:00Z", now)).toBe("2w ago");
    expect(compactAge("2026-07-01T12:00:00Z", now)).toBe("4mo ago");
  });
});
