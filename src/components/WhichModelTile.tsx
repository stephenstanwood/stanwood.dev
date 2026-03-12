import { useState, useEffect, memo } from "react";
import { ModelLogo } from "../lib/whichModel/logos";

// Brand colors per company — shared between wheel and examples
const BRAND_COLORS: Record<string, string> = {
  Anthropic: "#d97706",
  OpenAI: "#10a37f",
  Google: "#4285f4",
  Meta: "#0668e1",
  Mistral: "#ff7000",
  Midjourney: "#9b59b6",
  "Black Forest Labs": "#e74c3c",
};

const EXAMPLES = [
  { task: "write marketing copy", model: "Claude", org: "Anthropic" },
  { task: "build a React app", model: "GPT-4o", org: "OpenAI" },
  { task: "generate product photos", model: "Midjourney", org: "Midjourney" },
  { task: "analyze 500-page PDFs", model: "Gemini", org: "Google" },
  { task: "self-host for privacy", model: "Llama", org: "Meta" },
  { task: "fast chatbot prototype", model: "Gemini Flash", org: "Google" },
];

const SLICES = [
  { org: "Anthropic", label: "Claude" },
  { org: "OpenAI", label: "GPT" },
  { org: "Google", label: "Gemini" },
  { org: "Meta", label: "Llama" },
  { org: "Mistral", label: "Mistral" },
  { org: "Midjourney", label: "MJ" },
  { org: "Black Forest Labs", label: "Flux" },
];

const SPIN_CSS = `
@keyframes wmSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .wm-wheel-spin { animation: none !important; }
}
`;

function slicePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`;
}

/** Memoized wheel so it never re-renders when example text cycles */
const SpinningWheel = memo(function SpinningWheel() {
  const n = SLICES.length;
  const svgSize = 120;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const r = 52;
  const sliceAngle = (Math.PI * 2) / n;

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      {/* Pointer */}
      <div
        style={{
          position: "absolute",
          top: -10,
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: "10px solid #222",
          zIndex: 2,
        }}
      />
      <svg
        className="wm-wheel-spin"
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        style={{ display: "block", animation: "wmSpin 14s linear infinite" }}
      >
        {SLICES.map((slice, i) => {
          const start = i * sliceAngle - Math.PI / 2;
          const end = (i + 1) * sliceAngle - Math.PI / 2;
          return (
            <path
              key={slice.org}
              d={slicePath(cx, cy, r, start, end)}
              fill={BRAND_COLORS[slice.org]}
              stroke="#fff"
              strokeWidth="1.5"
            />
          );
        })}
        <circle cx={cx} cy={cy} r={8} fill="#222" />
        <circle cx={cx} cy={cy} r={5} fill="#fff" />
        <circle cx={cx} cy={cy} r={2} fill="#222" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#222" strokeWidth="2" />
      </svg>
    </div>
  );
});

export default function WhichModelTile() {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex((i) => (i + 1) % EXAMPLES.length);
        setFading(false);
      }, 3000);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const ex = EXAMPLES[index];
  const brandColor = BRAND_COLORS[ex.org] || "#7c5cff";

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

      {/* Title */}
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

      {/* Wheel + legend side by side */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "14px",
        }}
      >
        <SpinningWheel />

        {/* Logo legend */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {SLICES.map((slice) => (
            <div
              key={slice.org}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "11px",
                fontWeight: 600,
                color: BRAND_COLORS[slice.org],
              }}
            >
              <ModelLogo org={slice.org} size={14} color={BRAND_COLORS[slice.org]} />
              <span>{slice.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cycling recommendation — color-coded to brand */}
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
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            color: brandColor,
            fontWeight: 600,
          }}
        >
          <ModelLogo org={ex.org} size={16} color={brandColor} /> {ex.model}
        </span>
      </div>
    </a>
  );
}
