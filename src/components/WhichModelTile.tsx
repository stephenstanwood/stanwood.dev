import { useState, useEffect } from "react";
import { ModelLogo } from "../lib/whichModel/logos";

const EXAMPLES = [
  { task: "write marketing copy", model: "Claude", org: "Anthropic" },
  { task: "build a React app", model: "GPT-4o", org: "OpenAI" },
  { task: "generate product photos", model: "Midjourney", org: "Midjourney" },
  { task: "analyze 500-page PDFs", model: "Gemini", org: "Google" },
  { task: "self-host for privacy", model: "Llama", org: "Meta" },
  { task: "fast chatbot prototype", model: "Gemini Flash", org: "Google" },
];

const SEGMENTS = [
  { org: "Anthropic", color: "#d97706" },
  { org: "OpenAI", color: "#10a37f" },
  { org: "Google", color: "#4285f4" },
  { org: "Meta", color: "#0668e1" },
  { org: "Mistral", color: "#ff7000" },
  { org: "Midjourney", color: "#e84393" },
  { org: "Black Forest Labs", color: "#ff4500" },
];

const SPIN_CSS = `
@keyframes wmWheelSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes wmLogoCounterSpin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(-360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .wm-roulette, .wm-roulette-logo {
    animation: none !important;
  }
}
`;

function buildConicGradient(segments: typeof SEGMENTS): string {
  const n = segments.length;
  const sliceAngle = 360 / n;
  const stops: string[] = [];
  segments.forEach((seg, i) => {
    const start = i * sliceAngle;
    const end = (i + 1) * sliceAngle;
    stops.push(`${seg.color} ${start}deg ${end}deg`);
  });
  return `conic-gradient(from 0deg, ${stops.join(", ")})`;
}

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
  const wheelSize = 140;
  const logoRadius = wheelSize / 2 - 20; // place logos inside segments

  return (
    <a
      href="/which-model"
      style={{
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "8px",
        padding: "20px",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: SPIN_CSS }} />

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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

      {/* Roulette wheel with pointer */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Pointer triangle at top */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) translateY(${-wheelSize / 2 - 8}px)`,
            width: 0,
            height: 0,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderTop: "14px solid #111",
            zIndex: 2,
            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
          }}
        />

        {/* Spinning wheel */}
        <div
          className="wm-roulette"
          style={{
            width: wheelSize,
            height: wheelSize,
            borderRadius: "50%",
            background: buildConicGradient(SEGMENTS),
            animation: "wmWheelSpin 12s linear infinite",
            position: "relative",
            boxShadow: "0 0 0 3px #222, 0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          {/* Center hub */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "#222",
              border: "2px solid #fff",
              zIndex: 1,
            }}
          />

          {/* Segment divider lines */}
          {SEGMENTS.map((_, i) => {
            const angle = (i * 360) / SEGMENTS.length;
            return (
              <div
                key={`line-${i}`}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: wheelSize / 2,
                  height: "1.5px",
                  background: "rgba(255,255,255,0.5)",
                  transformOrigin: "0 50%",
                  transform: `rotate(${angle}deg)`,
                }}
              />
            );
          })}

          {/* Logos inside each segment, counter-rotating to stay upright */}
          {SEGMENTS.map((seg, i) => {
            const midAngle = ((i + 0.5) / SEGMENTS.length) * Math.PI * 2 - Math.PI / 2;
            const lx = Math.cos(midAngle) * logoRadius;
            const ly = Math.sin(midAngle) * logoRadius;
            return (
              <div
                key={seg.org}
                className="wm-roulette-logo"
                style={{
                  position: "absolute",
                  top: `calc(50% + ${ly}px)`,
                  left: `calc(50% + ${lx}px)`,
                  transform: "translate(-50%, -50%)",
                  animation: "wmLogoCounterSpin 12s linear infinite",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.9)",
                }}
              >
                <ModelLogo org={seg.org} size={14} color="#222" />
              </div>
            );
          })}
        </div>
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
        <span style={{ color: "#aaa" }}>&rarr;</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#7c5cff", fontWeight: 600 }}>
          <ModelLogo org={ex.org} size={16} color="#7c5cff" /> {ex.model}
        </span>
      </div>
    </a>
  );
}
