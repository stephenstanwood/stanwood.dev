/**
 * Minimal reader for a Next.js App Router page's inline React Server Components payload
 * (the `self.__next_f.push([1, "..."])` chunks). Club LG's Mindbody schedule widget renders
 * a week of classes into that payload, so reading it needs no browser and no private API.
 *
 * Row grammar: `<hex id>:<json>\n`, or `<hex id>:T<hex byte length>,<text>` for long strings.
 * Values reference other rows as "$<hex id>"; "$$" escapes a literal dollar sign.
 */

const CHUNK = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g;

/** Concatenate the payload chunks embedded in the page HTML. */
export function extractFlightPayload(html: string): string {
  let payload = "";
  for (const match of html.matchAll(CHUNK)) {
    try {
      payload += JSON.parse(`"${match[1]}"`) as string;
    } catch {
      // A malformed chunk only loses the rows inside it.
    }
  }
  return payload;
}

/** Parse payload rows into id → value. Text rows become strings; module/hint rows are skipped. */
export function parseFlightRows(payload: string): Map<string, unknown> {
  const bytes = new TextEncoder().encode(payload);
  const decoder = new TextDecoder();
  const rows = new Map<string, unknown>();
  let pos = 0;

  while (pos < bytes.length) {
    const colon = bytes.indexOf(0x3a, pos); // ':'
    if (colon < 0) break;
    const id = decoder.decode(bytes.subarray(pos, colon)).trim();
    pos = colon + 1;

    if (bytes[pos] === 0x54) {
      // 'T' text row: the length is in UTF-8 bytes, and the text can contain newlines.
      const comma = bytes.indexOf(0x2c, pos);
      const length = comma < 0 ? NaN : parseInt(decoder.decode(bytes.subarray(pos + 1, comma)), 16);
      if (!Number.isFinite(length)) break;
      rows.set(id, decoder.decode(bytes.subarray(comma + 1, comma + 1 + length)));
      pos = comma + 1 + length;
      continue;
    }

    let newline = bytes.indexOf(0x0a, pos);
    if (newline < 0) newline = bytes.length;
    const raw = decoder.decode(bytes.subarray(pos, newline));
    pos = newline + 1;
    if (/^[[{"]/.test(raw)) {
      try {
        rows.set(id, JSON.parse(raw));
      } catch {
        // Skip a row we can't read; references to it stay unresolved.
      }
    }
  }
  return rows;
}

const REF = /^\$([0-9a-f]+)$/;

/** Replace "$<id>" references with their rows (depth-limited, so cycles can't hang). */
export function resolveRefs(value: unknown, rows: Map<string, unknown>, depth = 0): unknown {
  if (depth > 12) return value;
  if (typeof value === "string") {
    if (value === "$undefined") return undefined;
    if (value.startsWith("$$")) return value.slice(1);
    const ref = REF.exec(value);
    if (ref && rows.has(ref[1])) return resolveRefs(rows.get(ref[1]), rows, depth + 1);
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => resolveRefs(item, rows, depth + 1));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, resolveRefs(item, rows, depth + 1)]),
    );
  }
  return value;
}

/** Depth-first search for the first object property named `key`. */
export function findKey(value: unknown, key: string, depth = 0): unknown {
  if (depth > 60 || !value || typeof value !== "object") return undefined;
  if (!Array.isArray(value) && Object.hasOwn(value, key)) {
    return (value as Record<string, unknown>)[key];
  }
  for (const item of Object.values(value)) {
    const found = findKey(item, key, depth + 1);
    if (found !== undefined) return found;
  }
  return undefined;
}
