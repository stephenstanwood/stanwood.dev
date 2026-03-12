import { useState, useEffect, useRef, memo } from "react";
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

const EXAMPLES = [
  { task: "marketing copy", model: "Claude", org: "Anthropic" },
  { task: "React app", model: "GPT-4o", org: "OpenAI" },
  { task: "product photos", model: "Midjourney", org: "Midjourney" },
  { task: "500-page PDFs", model: "Gemini", org: "Google" },
  { task: "self-host", model: "Llama", org: "Meta" },
  { task: "fast prototype", model: "Gemini Flash", org: "Google" },
];

const SLICES = [
  "Anthropic", "OpenAI", "Google", "Meta", "Mistral", "Midjourney", "Black Forest Labs",
];

function slicePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`;
}

/** Centered spinning wheel. Memoized — never re-renders. */
const SpinningWheel = memo(function SpinningWheel() {
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    if (styleRef.current) return;
    const style = document.createElement("style");
    style.textContent = `
      @keyframes wmSpin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @media (prefers-reduced-motion: reduce) {
        .wm-wheel-spin { animation: none !important; }
      }
    `;
    document.head.appendChild(style);
    styleRef.current = style;
    return () => { style.remove(); };
  }, []);

  const n = SLICES.length;
  const svgSize = 130;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const r = 58;
  const sliceAngle = (Math.PI * 2) / n;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
        {/* Pointer */}
        <div
          style={{
            position: "absolute",
            top: -10,
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
        <svg
          className="wm-wheel-spin"
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          style={{ display: "block", animation: "wmSpin 14s linear infinite" }}
        >
          {SLICES.map((org, i) => {
            const start = i * sliceAngle - Math.PI / 2;
            const end = (i + 1) * sliceAngle - Math.PI / 2;
            return (
              <path
                key={org}
                d={slicePath(cx, cy, r, start, end)}
                fill={BRAND_COLORS[org]}
                stroke="#fff"
                strokeWidth="1.5"
              />
            );
          })}
          <circle cx={cx} cy={cy} r={9} fill="#222" />
          <circle cx={cx} cy={cy} r={6} fill="#fff" />
          <circle cx={cx} cy={cy} r={2.5} fill="#222" />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#222" strokeWidth="2.5" />
        </svg>
      </div>
    </div>
  );
});

/** Cycling text — isolated so state changes never touch the wheel */
function CyclingExample() {
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
  const brandColor = BRAND_COLORS[ex.org] || "#7c5cff";

  return (
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
  );
}

export default function WhichModelTile() {
  return (
    <a
      href="/which-model"
      style={{
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
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
          flexShrink: 0,
        }}
      >
        Which Model?
      </span>

      {/* Wheel fills available space */}
      <SpinningWheel />

      {/* Cycling example at bottom */}
      <CyclingExample />
    </a>
  );
}
