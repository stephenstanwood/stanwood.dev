import { describe, expect, it } from "vitest";
import { preferredCouncilRecord } from "./types";

describe("preferredCouncilRecord", () => {
  it("prefers a regular session when eScribe lists an executive session first", () => {
    const preferred = preferredCouncilRecord([
      { title: "City Council Executive Session 6/16/2026", date: "June 16, 2026" },
      { title: "City Council Regular Session Meeting 6/16/2026", date: "June 16, 2026" },
    ]);

    expect(preferred?.title).toBe("City Council Regular Session Meeting 6/16/2026");
  });

  it("falls back to the newest record if no regular session is listed", () => {
    const preferred = preferredCouncilRecord([
      { title: "City Council Executive Session 6/16/2026", date: "June 16, 2026" },
      { title: "City Council Study Session 6/9/2026", date: "June 9, 2026" },
    ]);

    expect(preferred?.title).toBe("City Council Executive Session 6/16/2026");
  });
});
