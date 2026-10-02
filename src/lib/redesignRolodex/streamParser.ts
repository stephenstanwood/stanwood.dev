/**
 * Progressive JSON parser for streaming Claude responses.
 * Extracts siteAnalysis and individual direction objects as they complete.
 */

export interface StreamEvent {
  type: "analysis" | "direction" | "done" | "error";
  data: unknown;
}

// Bound per-chunk work when an upstream response contains many directions.
const MAX_DIRECTIONS_PER_CHUNK = 20;

export class ProgressiveJsonParser {
  private buffer = "";
  private analysisExtracted = false;
  private directionsExtracted = 0;

  /** Release the buffer after streaming is complete. */
  clear() {
    this.buffer = "";
  }

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

    for (let extracted = 0; extracted < MAX_DIRECTIONS_PER_CHUNK; extracted++) {
      const direction = this.tryExtractNextDirection();
      if (!direction) break;
      this.directionsExtracted++;
      // ids are 1-based — the card UI renders them as "Card {id}"
      events.push({ type: "direction", data: { ...direction, id: this.directionsExtracted } });
    }

    return events;
  }

  private tryExtractAnalysis(): Record<string, unknown> | null {
    const key = '"siteAnalysis"';
    const keyIndex = this.buffer.indexOf(key);
    if (keyIndex === -1) return null;

    const colonIndex = this.buffer.indexOf(":", keyIndex + key.length);
    if (colonIndex === -1) return null;

    let objectStart = colonIndex + 1;
    while (objectStart < this.buffer.length && /\s/.test(this.buffer[objectStart])) objectStart++;
    if (this.buffer[objectStart] !== "{") return null;

    return this.parseObjectAt(objectStart);
  }

  private tryExtractNextDirection(): Record<string, unknown> | null {
    const key = '"directions"';
    const keyIndex = this.buffer.indexOf(key);
    if (keyIndex === -1) return null;

    const arrayStart = this.buffer.indexOf("[", keyIndex + key.length);
    if (arrayStart === -1) return null;

    // Skip past already-extracted directions
    let position = arrayStart + 1;
    let skipped = 0;
    while (skipped < this.directionsExtracted) {
      const objectStart = this.findNextChar("{", position);
      if (objectStart === -1) return null;
      const objectEnd = this.findMatchingBrace(objectStart);
      if (objectEnd === -1) return null;
      position = objectEnd + 1;
      skipped++;
    }

    const objectStart = this.findNextChar("{", position);
    if (objectStart === -1) return null;
    return this.parseObjectAt(objectStart);
  }

  private parseObjectAt(start: number): Record<string, unknown> | null {
    const end = this.findMatchingBrace(start);
    if (end === -1) return null;

    try {
      return JSON.parse(this.buffer.slice(start, end + 1));
    } catch {
      return null;
    }
  }

  private findNextChar(target: string, from: number): number {
    for (let i = from; i < this.buffer.length; i++) {
      if (this.buffer[i] === target) return i;
      // Only whitespace and commas may sit between array elements; anything
      // else (including the closing `]`) means there is no next element.
      if (!/[\s,]/.test(this.buffer[i])) return -1;
    }
    return -1;
  }

  private findMatchingBrace(start: number): number {
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < this.buffer.length; i++) {
      const character = this.buffer[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (character === "\\" && inString) {
        escaped = true;
        continue;
      }

      if (character === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (character === "{") depth++;
      else if (character === "}") {
        depth--;
        if (depth === 0) return i;
      }
    }

    return -1;
  }
}
