import { describe, expect, it } from "vitest";
import { ProgressiveJsonParser, type StreamEvent } from "./streamParser";

describe("ProgressiveJsonParser", () => {
  it("emits complete objects once when JSON arrives one character at a time", () => {
    const parser = new ProgressiveJsonParser();
    const analysis = { summary: 'Quoted "words", {braces}, and a \\ path' };
    const directions = [
      { name: "First {direction}", details: { text: 'An escaped "quote"' } },
      { name: "Second direction", notes: ["nested", "values"] },
    ];
    const response = JSON.stringify({ siteAnalysis: analysis, directions });
    const events: StreamEvent[] = [];

    for (const character of response) events.push(...parser.feed(character));

    expect(events).toEqual([
      { type: "analysis", data: analysis },
      ...directions.map((direction, index) => ({
        type: "direction",
        data: { ...direction, id: index + 1 },
      })),
    ]);
    expect(parser.feed("")).toEqual([]);
  });

  it("waits for a complete object before emitting it", () => {
    const parser = new ProgressiveJsonParser();

    expect(parser.feed('{"siteAnalysis": {"summary": "unfinished')).toEqual([]);
    expect(parser.feed('"}, "directions": [{"name": "First"')).toEqual([
      { type: "analysis", data: { summary: "unfinished" } },
    ]);
    expect(parser.feed("}]}")).toEqual([
      { type: "direction", data: { name: "First", id: 1 } },
    ]);
  });

  it("stops at the end of the directions array before unrelated objects", () => {
    const parser = new ProgressiveJsonParser();

    expect(parser.feed(JSON.stringify({
      directions: [{ name: "Only direction" }],
      metadata: { name: "Not a direction" },
    }))).toEqual([
      { type: "direction", data: { name: "Only direction", id: 1 } },
    ]);
    expect(parser.feed("")).toEqual([]);
  });

  it("caps per-chunk work while preserving direction IDs for the next chunk", () => {
    const parser = new ProgressiveJsonParser();
    const directions = Array.from({ length: 25 }, (_, index) => ({ name: `Direction ${index + 1}` }));

    const first = parser.feed(JSON.stringify({ directions }));
    const remaining = parser.feed("");

    expect(first).toHaveLength(20);
    expect(remaining).toHaveLength(5);
    expect([...first, ...remaining].map((event) => event.data)).toEqual(
      directions.map((direction, index) => ({ ...direction, id: index + 1 })),
    );
  });
});
