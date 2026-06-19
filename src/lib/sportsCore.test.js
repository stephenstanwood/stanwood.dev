import { describe, expect, it } from "vitest";
import { isPostponedLike } from "./sportsCore";

// Minimal ESPN-shaped game with a single competition + status.
function game({ state, completed, name, awayScore = "0", homeScore = "0" }) {
  return {
    competitions: [
      {
        status: { type: { state, completed, name } },
        competitors: [
          { homeAway: "away", score: awayScore },
          { homeAway: "home", score: homeScore },
        ],
      },
    ],
  };
}

describe("isPostponedLike", () => {
  it("flags a postponed game (post state, not completed, 0–0)", () => {
    // Real ESPN shape for SF @ ATL on 2026-06-18.
    expect(
      isPostponedLike(
        game({ state: "post", completed: false, name: "STATUS_POSTPONED" }),
      ),
    ).toBe(true);
  });

  it("flags canceled / suspended games by status name", () => {
    for (const name of [
      "STATUS_CANCELED",
      "STATUS_CANCELLED",
      "STATUS_SUSPENDED",
    ]) {
      expect(
        isPostponedLike(game({ state: "post", completed: false, name })),
      ).toBe(true);
    }
  });

  it("does not flag a genuinely completed final", () => {
    expect(
      isPostponedLike(
        game({
          state: "post",
          completed: true,
          name: "STATUS_FINAL",
          awayScore: "5",
          homeScore: "3",
        }),
      ),
    ).toBe(false);
  });

  it("does not flag scheduled or live games", () => {
    expect(isPostponedLike(game({ state: "pre", completed: false }))).toBe(
      false,
    );
    expect(
      isPostponedLike(
        game({ state: "in", completed: false, name: "STATUS_IN_PROGRESS" }),
      ),
    ).toBe(false);
  });

  it("falls back to post-state + not-completed for unknown status names", () => {
    expect(
      isPostponedLike(
        game({ state: "post", completed: false, name: "STATUS_SOME_NEW_NAME" }),
      ),
    ).toBe(true);
  });
});
