export function safeSet(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function safeGet<T = unknown>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function safeRemove(key: string): void {
  try { localStorage.removeItem(key); } catch {}
}

export function safeGetString(key: string): string {
  try { return localStorage.getItem(key) ?? ""; } catch { return ""; }
}

export function safeSetString(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch {}
}
