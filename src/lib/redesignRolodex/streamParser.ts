/**
 * Progressive JSON parser for streaming Claude responses.
 * Extracts siteAnalysis and individual direction objects as they complete.
 */

export interface StreamEvent {
  type: "analysis" | "direction" | "done" | "error";
  data: unknown;
}

export class ProgressiveJsonParser {
  private buffer = "";
  private analysisExtracted = false;
  private directionsExtracted = 0;

  feed(chunk: string): StreamEvent[] {
    this.buffer += chunk;
    const events: StreamEvent[] = [];

    if (!this.analysisExtracted) {
      const analysis = this.tryExtractAnalysis();
      if (analysis) {
        events.push({ type: "analysis", data: analysis });
        this.analysisExtracted = true;
      }
    }

    // Try to extract directions one by one
    let safety = 0;
    while (safety < 20) {
      const dir = this.tryExtractNextDirection();
      if (!dir) break;
      this.directionsExtracted++;
      events.push({ type: "direction", data: { ...dir, id: this.directionsExtracted + 1 } });
      safety++;
    }

    return events;
  }

  private tryExtractAnalysis(): Record<string, unknown> | null {
    const key = '"siteAnalysis"';
    const idx = this.buffer.indexOf(key);
    if (idx === -1) return null;

    const colonIdx = this.buffer.indexOf(":", idx + key.length);
    if (colonIdx === -1) return null;

    // Skip whitespace after colon
    let objStart = colonIdx + 1;
    while (objStart < this.buffer.length && /\s/.test(this.buffer[objStart])) objStart++;
    if (this.buffer[objStart] !== "{") return null;

    const objEnd = this.findMatchingBrace(objStart);
    if (objEnd === -1) return null;

    try {
      return JSON.parse(this.buffer.slice(objStart, objEnd + 1));
    } catch {
      return null;
    }
  }

  private tryExtractNextDirection(): Record<string, unknown> | null {
    const key = '"directions"';
    const idx = this.buffer.indexOf(key);
    if (idx === -1) return null;

    const arrStart = this.buffer.indexOf("[", idx + key.length);
    if (arrStart === -1) return null;

    // Skip past already-extracted directions
    let pos = arrStart + 1;
    let skipped = 0;
    while (skipped < this.directionsExtracted) {
      const nextObj = this.findNextChar("{", pos);
      if (nextObj === -1) return null;
      const end = this.findMatchingBrace(nextObj);
      if (end === -1) return null;
      pos = end + 1;
      skipped++;
    }

    // Find next direction object
    const nextObj = this.findNextChar("{", pos);
    if (nextObj === -1) return null;
    const end = this.findMatchingBrace(nextObj);
    if (end === -1) return null;

    try {
      return JSON.parse(this.buffer.slice(nextObj, end + 1));
    } catch {
      return null;
    }
  }

  private findNextChar(ch: string, from: number): number {
    for (let i = from; i < this.buffer.length; i++) {
      if (this.buffer[i] === ch) return i;
      // Skip whitespace and commas between array elements
      if (/[\s,]/.test(this.buffer[i])) continue;
      // If we hit ] that means array ended
      if (this.buffer[i] === "]") return -1;
      // If we hit anything else unexpected, stop
      if (this.buffer[i] !== ch) return -1;
    }
    return -1;
  }

  private findMatchingBrace(start: number): number {
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < this.buffer.length; i++) {
      const ch = this.buffer[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (ch === "\\" && inString) {
        escaped = true;
        continue;
      }

      if (ch === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) return i;
      }
    }

    return -1;
  }
}
