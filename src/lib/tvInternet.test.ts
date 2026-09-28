import { describe, expect, it } from "vitest";
import { canAddInternetVideo, chooseInternetPicks, eligibleInternetVideo, topicKey, type InternetVideo } from "./tvInternet";
const now = Date.parse("2026-09-28T12:00Z");
function video(id: string, topic = "hci"): InternetVideo {
  return { id, title: `An unusual ${id} lesson`, channel_id: id, channel_title: id, published_at: "2026-09-27T12:00Z", language: "en", topic, rank_score: 80 };
}
describe("TV internet diversity", () => {
  it("never relaxes source or topic caps to fill the grid", () => {
    const videos = [video("one"), video("two"), video("three"), video("four"), { ...video("five", "systems_db"), channel_id: "one" }, video("six", "swe_craft")];
    expect(chooseInternetPicks(videos, 20, now).map(v => v.id)).toEqual(["one", "two", "three", "six"]);
  });
  it("prevents AI titles from hiding in other metadata categories", () => {
    expect(topicKey({ ...video("x"), title: "My Claude Code design workflow", categories: ["hci"] })).toBe("applied_ai");
  });
  it("keeps the pipeline's novelty order", () => {
    expect(chooseInternetPicks([video("new"), { ...video("repeat", "systems_db"), rank_score: 99 }], 1, now)[0].id).toBe("new");
  });
  it("rejects stale, undated, non-English and duplicate-title reserve items", () => {
    expect(eligibleInternetVideo({ ...video("x"), published_at: "2026-08-01" }, now)).toBe(false);
    expect(eligibleInternetVideo({ ...video("x"), published_at: "bad" }, now)).toBe(false);
    expect(eligibleInternetVideo({ ...video("x"), language: undefined }, now)).toBe(false);
    const a = { ...video("a"), title: "Debugging browser rendering performance" };
    const b = { ...video("b"), title: "Browser rendering performance debugging explained" };
    expect(canAddInternetVideo(b, [a], now)).toBe(false);
  });
});
