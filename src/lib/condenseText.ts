function capitalize(str: string): string {
  const trimmed = str.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
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
