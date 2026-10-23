import { describe, expect, it } from "vitest";
import { extractText } from "./models";

describe("Claude response text", () => {
  it("keeps JSON readable when adaptive thinking comes before the answer", () => {
    const answer = extractText([
      { type: "thinking" },
      { type: "text", text: '  {"summary":"done"}  ' },
    ]);
    expect(JSON.parse(answer)).toEqual({ summary: "done" });
  });

  it("keeps the first text answer after tool blocks", () => {
    expect(extractText([
      { type: "tool_use" },
      { type: "text", text: " first " },
      { type: "text", text: "second" },
    ])).toBe("first");
  });

  it("returns empty text when the response has no answer", () => {
    expect(extractText([])).toBe("");
    expect(extractText([{ type: "thinking" }])).toBe("");
  });
});
