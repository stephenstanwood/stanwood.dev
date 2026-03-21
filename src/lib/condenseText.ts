function capitalize(str: string): string {
  const s = str.trim();
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function condenseText(raw: string): Promise<string> {
  const trimmed = raw.trim();
  if (trimmed.split(/\s+/).length <= 8) return capitalize(trimmed);
  try {
    const res = await fetch("/api/condense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
    });
    if (!res.ok) throw new Error("API error");
    const { title } = await res.json();
    return title || capitalize(trimmed);
  } catch (err) {
    console.error("condenseText API error:", err);
    const first = trimmed.split(/[.!?]\s/)[0];
    return capitalize(first);
  }
}
