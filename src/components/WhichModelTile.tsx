import { useState, useEffect } from "react";
import { ModelLogo } from "../lib/whichModel/logos";

const BRAND_COLORS: Record<string, string> = {
  Anthropic: "#d97706",
  OpenAI: "#10a37f",
  Google: "#4285f4",
  Meta: "#0668e1",
  Mistral: "#ff7000",
  Midjourney: "#9b59b6",
  "Black Forest Labs": "#e74c3c",
};

const MODELS = [
  { label: "Claude", org: "Anthropic" },
  { label: "ChatGPT", org: "OpenAI" },
  { label: "Gemini", org: "Google" },
  { label: "Llama", org: "Meta" },
  { label: "Mistral", org: "Mistral" },
  { label: "Midjourney", org: "Midjourney" },
  { label: "Flux", org: "Black Forest Labs" },
];

const ALL_EXAMPLES = [
  { task: "marketing copy", model: "Claude", org: "Anthropic" },
  { task: "React app", model: "ChatGPT", org: "OpenAI" },
  { task: "product photos", model: "Midjourney", org: "Midjourney" },
  { task: "500-page PDFs", model: "Gemini", org: "Google" },
  { task: "self-host", model: "Llama", org: "Meta" },
  { task: "fast prototype", model: "Gemini Flash", org: "Google" },
  { task: "code review", model: "Claude", org: "Anthropic" },
  { task: "blog post", model: "ChatGPT", org: "OpenAI" },
  { task: "album art", model: "Midjourney", org: "Midjourney" },
  { task: "YouTube summary", model: "Gemini", org: "Google" },
  { task: "logo concepts", model: "Flux", org: "Black Forest Labs" },
  { task: "debug Python", model: "Claude", org: "Anthropic" },
  { task: "email drafts", model: "ChatGPT", org: "OpenAI" },
  { task: "on-device AI", model: "Llama", org: "Meta" },
  { task: "French tutor", model: "Mistral", org: "Mistral" },
  { task: "landing page", model: "Claude", org: "Anthropic" },
  { task: "meal planner", model: "ChatGPT", org: "OpenAI" },
  { task: "hero images", model: "Flux", org: "Black Forest Labs" },
  { task: "research paper", model: "Gemini", org: "Google" },
  { task: "API docs", model: "Claude", org: "Anthropic" },
  { task: "travel itinerary", model: "ChatGPT", org: "OpenAI" },
  { task: "texture packs", model: "Midjourney", org: "Midjourney" },
  { task: "EU compliance", model: "Mistral", org: "Mistral" },
  { task: "data pipeline", model: "Claude", org: "Anthropic" },
  { task: "social captions", model: "ChatGPT", org: "OpenAI" },
  { task: "video thumbnail", model: "Flux", org: "Black Forest Labs" },
  { task: "chat with docs", model: "Gemini", org: "Google" },
  { task: "privacy-first", model: "Llama", org: "Meta" },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function WhichModelTile() {
  const [examples] = useState(() => shuffleArray(ALL_EXAMPLES));
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex((i) => (i + 1) % examples.length);
        setFading(false);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, [examples.length]);

  const ex = examples[index];
  const brandColor = BRAND_COLORS[ex.org] || "#666";

  return (
    <a
      href="/which-model"
      style={{
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "16px",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Title */}
      <span
        style={{
          fontFamily: "'Bangers', cursive",
          fontSize: "16px",
          letterSpacing: "1px",
          color: "#111",
        }}
      >
        Which Model?
      </span>

      {/* Color-coded model list */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 12px",
          padding: "4px 0",
        }}
      >
        {MODELS.map((m) => (
          <div
            key={m.org}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              fontWeight: 600,
              color: BRAND_COLORS[m.org],
            }}
          >
            <ModelLogo org={m.org} size={14} color={BRAND_COLORS[m.org]} />
            {m.label}
          </div>
        ))}
      </div>

      {/* Cycling example */}
      <div
        style={{
          height: "18px",
          display: "flex",
          alignItems: "center",
          gap: "5px",
          fontSize: "12px",
          transition: "opacity 0.3s ease",
          opacity: fading ? 0 : 1,
        }}
      >
        <span style={{ color: "#888" }}>{ex.task}</span>
        <span style={{ color: "#ccc" }}>→</span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
            color: brandColor,
            fontWeight: 600,
          }}
        >
          <ModelLogo org={ex.org} size={14} color={brandColor} />
          {ex.model}
        </span>
      </div>
    </a>
  );
}
