import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { APIContext } from "astro";
import { GET } from "../pages/api/espn/[...path]";
import { rateLimit } from "./rateLimit";

vi.mock("./rateLimit", () => ({ rateLimit: vi.fn(() => true) }));

function request(path = "basketball/nba/scoreboard", search = "") {
  return GET({
    params: { path },
    url: new URL("https://www.stanwood.dev/api/espn/" + path + search),
    clientAddress: "203.0.113.42",
  } as unknown as APIContext);
}

describe("bounded ESPN scoreboard endpoint", () => {
  beforeEach(() => vi.mocked(rateLimit).mockReturnValue(true));
  afterEach(() => vi.unstubAllGlobals());

  it("returns actual events and a short shared cache lifetime", async () => {
    const events = [{ id: "123", date: "2026-11-08T20:00Z" }];
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ events, unrelated: "metadata" })));
    vi.stubGlobal("fetch", fetchMock);
    const response = await request("basketball/nba/scoreboard", "?dates=20261108");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ events });
    expect(response.headers.get("cache-control")).toContain("s-maxage=15");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=20261108",
      expect.objectContaining({ redirect: "error" }),
    );
  });

  it("preserves a verified empty scoreboard", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ events: [] }))));
    expect(await (await request()).json()).toEqual({ events: [] });
  });

  it.each(["football/nfl/teams", "basketball/unknown/scoreboard", "https://example.com", "../scoreboard"])(
    "rejects unrecognized paths without contacting upstream: %s", async (path) => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      expect((await request(path)).status).toBe(404);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each(["?dates=20260230", "?dates=20261108-20261114", "?dates=", "?url=https://example.com",
    "?dates=20261108&dates=20261109", "?dates=20261108&limit=99999"])(
    "rejects invalid dates or extra query input: %s", async (query) => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      expect((await request("basketball/nba/scoreboard", query)).status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each([() => new Response("Denied", { status: 403 }),
    () => new Response("Rate limited", { status: 429 }),
    () => new Response(JSON.stringify({ message: "upstream failed" })),
    () => new Response("<html>Unavailable</html>")])(
    "keeps upstream failures distinct from empty games", async (upstream) => {
      vi.stubGlobal("fetch", vi.fn(async () => upstream()));
      const response = await request();
      expect(response.status).toBe(502);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(await response.json()).toHaveProperty("error");
    },
  );

  it("keeps network failures uncacheable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new DOMException("Timed out", "TimeoutError"); }));
    const response = await request();
    expect(response.status).toBe(502);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("honors the existing request limiter", async () => {
    vi.mocked(rateLimit).mockReturnValue(false);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await request()).status).toBe(429);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
