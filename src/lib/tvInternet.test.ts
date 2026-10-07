import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TOPIC_LABELS, canAddInternetVideo, chooseInternetPicks, eligibleInternetVideo, themeKey, topicKey, topicLabel, type InternetVideo } from "./tvInternet";
const now = Date.parse("2026-09-28T12:00Z");
function video(id: string, topic = "design"): InternetVideo {
  return { id, title: `An unusual ${id} lesson`, channel_id: id, channel_title: id, published_at: "2026-09-27T12:00Z", language: "en", topic, rank_score: 80 };
}
describe("TV internet diversity", () => {
  it("never relaxes source or topic caps to fill the grid", () => {
    const videos = [video("one"), video("two"), video("three"), video("four"), { ...video("five", "how_it_works"), channel_id: "one" }, video("six", "software_craft")];
    expect(chooseInternetPicks(videos, 20, now).map(v => v.id)).toEqual(["one", "two", "three", "six"]);
  });
  it("prevents AI titles from hiding in other metadata categories", () => {
    expect(topicKey({ ...video("x"), title: "My Claude Code design workflow", categories: ["hci"] })).toBe("ai_practice");
  });
  it("gives AI four slots, not a wall", () => {
    const subjects = ["memory", "testing", "billing", "search", "deploys", "parsers"];
    const videos = subjects.map(s => ({ ...video(s, "ai_practice"), title: `Claude for ${s}` }));
    expect(chooseInternetPicks(videos, 20, now)).toHaveLength(4);
  });
  it("shows one video per editor theme", () => {
    const a = { ...video("a"), title: "The death of the code review", theme: "Code Review" };
    const b = { ...video("b", "war_stories"), title: "Rethinking security audits", theme: "code-review" };
    expect(themeKey(b)).toBe("code review");
    expect(canAddInternetVideo(b, [a], now)).toBe(false);
  });
  it("caps hour-plus videos", () => {
    const long = ["compilers", "typography", "outages", "pricing"].map((s, i) => ({
      ...video(s, TOPIC_LABELS[i + 1][0]), title: `${s} keynote`, duration: 2 * 3600,
    }));
    expect(chooseInternetPicks(long, 20, now)).toHaveLength(3);
  });
  it("maps legacy keyword topics onto editor topics", () => {
    expect(topicLabel({ ...video("x", "hci"), title: "Fixing fluid typography" })).toBe("design");
    expect(topicKey({ ...video("x", ""), title: "Postmortem", title_categories: ["war_stories"] })).toBe("war_stories");
  });
  it("keeps the pipeline's novelty order", () => {
    expect(chooseInternetPicks([video("new"), { ...video("repeat", "how_it_works"), rank_score: 99 }], 1, now)[0].id).toBe("new");
  });
  it("rejects stale, undated, non-English and duplicate-title reserve items", () => {
    expect(eligibleInternetVideo({ ...video("x"), published_at: "2026-09-10" }, now)).toBe(false);
    expect(eligibleInternetVideo({ ...video("x"), published_at: "bad" }, now)).toBe(false);
    expect(eligibleInternetVideo({ ...video("x"), language: undefined }, now)).toBe(false);
    const a = { ...video("a"), title: "Debugging browser rendering performance" };
    const b = { ...video("b"), title: "Browser rendering performance debugging explained" };
    expect(canAddInternetVideo(b, [a], now)).toBe(false);
  });
  it("matches the nightly builder's topic list", () => {
    const selection = readFileSync(new URL("../../scripts/tv-queue/selection.py", import.meta.url), "utf8");
    const block = selection.match(/^TOPICS = \{([\s\S]*?)^\}/m)?.[1] ?? "";
    const builderTopics = [...block.matchAll(/"([a-z_]+)":\s*"([^"]+)"/g)].map(m => [m[1], m[2]]);
    expect(builderTopics).toEqual(TOPIC_LABELS);
  });
});
