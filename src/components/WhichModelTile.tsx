import { useState, useEffect } from "react";

const EXAMPLES = [
  { task: "write marketing copy", model: "Claude", emoji: "✍️" },
  { task: "build a React app", model: "GPT-4o", emoji: "💻" },
  { task: "generate product photos", model: "Midjourney", emoji: "🎨" },
  { task: "analyze 500-page PDFs", model: "Gemini", emoji: "📄" },
  { task: "self-host for privacy", model: "Llama", emoji: "🦙" },
  { task: "fast chatbot prototype", model: "Gemini Flash", emoji: "⚡" },
];

export default function WhichModelTile() {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex((i) => (i + 1) % EXAMPLES.length);
        setFading(false);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const ex = EXAMPLES[index];

  return (
    <a
      href="/which-model"
      style={{
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "12px",
        padding: "20px",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "20px" }}>🎡</span>
        <span
          style={{
            fontFamily: "'Bangers', cursive",
            fontSize: "18px",
            letterSpacing: "1px",
            color: "#111",
          }}
        >
          Which Model?
        </span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "13px",
          transition: "opacity 0.3s ease",
          flexWrap: "wrap",
          opacity: fading ? 0 : 1,
        }}
      >
        <span style={{ color: "#666" }}>{ex.task}</span>
        <span style={{ color: "#aaa" }}>→</span>
        <span style={{ color: "#7c5cff", fontWeight: 600 }}>
          {ex.emoji} {ex.model}
        </span>
      </div>
    </a>
  );
}
