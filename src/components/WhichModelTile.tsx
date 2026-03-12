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

// Brand colors per company
const SLICES = [
  { org: "Anthropic", bg: "#d97706", logoColor: "#fff" },
  { org: "OpenAI", bg: "#10a37f", logoColor: "#fff" },
  { org: "Google", bg: "#4285f4", logoColor: "#fff" },
  { org: "Meta", bg: "#0668e1", logoColor: "#fff" },
  { org: "Mistral", bg: "#ff7000", logoColor: "#fff" },
  { org: "Midjourney", bg: "#9b59b6", logoColor: "#fff" },
  { org: "Black Forest Labs", bg: "#e74c3c", logoColor: "#fff" },
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

/** Build an SVG arc path for a pie slice */
function slicePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`;
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
  const n = SLICES.length;
  const svgSize = 160;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const r = 68;
  const sliceAngle = (Math.PI * 2) / n;
  // Logo placement radius — 60% out from center
  const logoR = r * 0.62;

  return (
    <a
      href="/which-model"
      style={{
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "6px",
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

      {/* Wheel container */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Pointer triangle */}
        <div
          style={{
            position: "absolute",
            top: `calc(50% - ${r + 14}px)`,
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "7px solid transparent",
            borderRight: "7px solid transparent",
            borderTop: "12px solid #222",
            zIndex: 2,
          }}
        />

        {/* Spinning SVG wheel */}
        <div
          className="wm-wheel-spin"
          style={{
            width: svgSize,
            height: svgSize,
            animation: "wmSpin 14s linear infinite",
            position: "relative",
          }}
        >
          <svg
            width={svgSize}
            height={svgSize}
            viewBox={`0 0 ${svgSize} ${svgSize}`}
            style={{ display: "block" }}
          >
            {/* Pie slices */}
            {SLICES.map((slice, i) => {
              // Offset by -90° so first slice starts at top
              const start = i * sliceAngle - Math.PI / 2;
              const end = (i + 1) * sliceAngle - Math.PI / 2;
              return (
                <path
                  key={slice.org}
                  d={slicePath(cx, cy, r, start, end)}
                  fill={slice.bg}
                  stroke="#fff"
                  strokeWidth="1.5"
                />
              );
            })}
            {/* Center hub */}
            <circle cx={cx} cy={cy} r={10} fill="#222" />
            <circle cx={cx} cy={cy} r={7} fill="#fff" />
            <circle cx={cx} cy={cy} r={3} fill="#222" />
            {/* Outer ring */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#222" strokeWidth="2.5" />
          </svg>

          {/* Logos positioned in each slice, counter-rotating */}
          {SLICES.map((slice, i) => {
            const midAngle = (i + 0.5) * sliceAngle - Math.PI / 2;
            const lx = cx + Math.cos(midAngle) * logoR;
            const ly = cy + Math.sin(midAngle) * logoR;
            return (
              <div
                key={`logo-${slice.org}`}
                style={{
                  position: "absolute",
                  left: lx,
                  top: ly,
                  transform: "translate(-50%, -50%)",
                  // Counter-rotate to keep logos upright
                  animation: "wmSpin 14s linear infinite reverse",
                  width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ModelLogo org={slice.org} size={20} color={slice.logoColor} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Cycling recommendation */}
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
            color: "#7c5cff",
            fontWeight: 600,
          }}
        >
          <ModelLogo org={ex.org} size={16} color="#7c5cff" /> {ex.model}
        </span>
      </div>
    </a>
  );
}
