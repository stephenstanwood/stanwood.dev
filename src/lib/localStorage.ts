function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function safeSet(key: string, value: unknown): void {
  try {
    getBrowserStorage()?.setItem(key, JSON.stringify(value));
  } catch {}
}

export function safeGet<T = unknown>(key: string): T | null {
  try {
    const raw = getBrowserStorage()?.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Read a versioned record, discarding anything written by an older schema. Returning null
 * on a version mismatch is what lets each tool bump its `version` to invalidate saved
 * state instead of writing a migration.
 */
export function safeGetVersioned<T extends { version: number }>(
  key: string,
  version: number,
): T | null {
  const data = safeGet<T>(key);
  return data && data.version === version ? data : null;
}

export function safeRemove(key: string): void {
  try {
    getBrowserStorage()?.removeItem(key);
  } catch {}
}

export function safeGetString(key: string): string {
  try {
    return getBrowserStorage()?.getItem(key) ?? "";
  } catch {
    return "";
  }
}

export function safeSetString(key: string, value: string): void {
  try {
    getBrowserStorage()?.setItem(key, value);
  } catch {}
}
