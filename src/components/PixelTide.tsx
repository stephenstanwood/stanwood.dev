import { useRef, useEffect, useCallback, useState } from "react";

/* ── Beach Themes ── */
interface BeachTheme {
  label: string;
  drySand: string[];
  wetSand: string[];
  shallow: string[];
  deep: string[];
  castle: string[];
  foam: string[];
  bg: string;
}

const THEMES: Record<string, BeachTheme> = {
  tropical: {
    label: "Tropical",
    drySand: ["#F5E6C8", "#EDD9B3", "#E8D0A0", "#F0DFC0", "#EADAB5"],
    wetSand: ["#C4A97D", "#B89B6A", "#A88D5A", "#BFA476", "#B09465"],
    shallow: ["#7EC8E3", "#5BB5D5", "#45A5C9", "#6BC0DC", "#52AECE"],
    deep: ["#2E86AB", "#1B6B93", "#0F4C75", "#24799F", "#165F85"],
    castle: ["#D4A76A", "#C49A5C", "#B8884E", "#A67840", "#D0A060"],
    foam: ["#ffffff", "#e0f4ff", "#c8ecff", "#d6f0ff"],
    bg: "#1a1a2e",
  },
  sunset: {
    label: "Sunset",
    drySand: ["#F0D9A0", "#E8CC8A", "#DFC078", "#F2DCA8", "#E5C890"],
    wetSand: ["#C49060", "#B88050", "#A87040", "#BE8858", "#B07848"],
    shallow: ["#E8956A", "#D4805A", "#F0A878", "#DC8A62", "#E89870"],
    deep: ["#C05050", "#A83838", "#922828", "#B84545", "#9E3030"],
    castle: ["#D4A76A", "#C49A5C", "#B8884E", "#A67840", "#D0A060"],
    foam: ["#fff5e6", "#ffe8cc", "#ffddb3", "#ffead9"],
    bg: "#2a1520",
  },
  arctic: {
    label: "Arctic",
    drySand: ["#E8E8F0", "#D8D8E4", "#CECEDE", "#E0E0EA", "#D4D4E0"],
    wetSand: ["#A0A0B8", "#9090A8", "#808098", "#9898B0", "#8888A0"],
    shallow: ["#5588AA", "#4478A0", "#386A92", "#4C80A8", "#40729A"],
    deep: ["#1A4060", "#0E3050", "#082840", "#143858", "#0A2C48"],
    castle: ["#C0C0D0", "#B0B0C0", "#A0A0B0", "#9090A0", "#B8B8C8"],
    foam: ["#ffffff", "#f0f4ff", "#e0e8f8", "#d8e0f0"],
    bg: "#101828",
  },
  night: {
    label: "Night",
    drySand: ["#4A4050", "#3E3648", "#443C4C", "#4C4252", "#403846"],
    wetSand: ["#302830", "#282028", "#2C242C", "#342C34", "#2A222A"],
    shallow: ["#2A3060", "#1E2450", "#283058", "#222852", "#2C3462"],
    deep: ["#141830", "#0E1228", "#181E38", "#121630", "#1A2040"],
    castle: ["#686070", "#5C5464", "#504858", "#6E6678", "#625A6A"],
    foam: ["#9090B0", "#8080A0", "#7878A0", "#8888A8"],
    bg: "#0a0a14",
  },
};

const THEME_KEYS = Object.keys(THEMES) as (keyof typeof THEMES)[];

/* ── Helpers ── */
function pick<T>(arr: T[], i: number): T {
  return arr[((i % arr.length) + arr.length) % arr.length];
}

function shiftHue(hex: string, deg: number): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  h = (h + deg / 360) % 1;
  if (h < 0) h += 1;

  const i2 = Math.floor(h * 6);
  const f = h * 6 - i2;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let ro: number, go: number, bo: number;
  switch (i2 % 6) {
    case 0: ro = v; go = t; bo = p; break;
    case 1: ro = q; go = v; bo = p; break;
    case 2: ro = p; go = v; bo = t; break;
    case 3: ro = p; go = q; bo = v; break;
    case 4: ro = t; go = p; bo = v; break;
    default: ro = v; go = p; bo = q; break;
  }

  const toHex = (n: number) =>
    Math.round(n * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(ro)}${toHex(go)}${toHex(bo)}`;
}

/* ── Castle: now multi-column ── */
interface CastleBlock {
  col: number;
  row: number;
  erosion: number;
}

interface Castle {
  blocks: CastleBlock[];
}

/* ── Particle type ── */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export default function PixelTide() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const castlesRef = useRef<Castle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef(0);
  const reducedMotion = useRef(false);
  const themeRef = useRef<BeachTheme>(THEMES.tropical);
  const [activeTheme, setActiveTheme] = useState<string>("tropical");

  // Keep themeRef in sync
  useEffect(() => {
    themeRef.current = THEMES[activeTheme] ?? THEMES.tropical;
    // Update page bg
    document.body.style.background = themeRef.current.bg;
  }, [activeTheme]);

  /* ── Tide line: waves wash UP and DOWN the shore ── */
  const getTideLine = useCallback((col: number, time: number, rows: number) => {
    const base = rows * 0.45;
    // Main vertical surge — the whole shoreline rises and falls
    const surge = Math.sin(time * 0.4) * 6;
    // Waves sweep across the shore (left to right)
    const sweep = Math.sin(time * 0.78 - col * 0.08) * 3;
    // Small surface ripple
    const ripple = Math.sin(time * 1.8 + col * 0.3) * 1;
    return base + surge + sweep + ripple;
  }, []);

  function handleReset() {
    castlesRef.current = [];
    particlesRef.current = [];
  }

  /* ── Main setup + animation loop ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    reducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let cellSize = 8;
    let cols = 0;
    let rows = 0;
    let animId = 0;
    let stopped = false;

    let noiseSeed: number[][] = [];

    function resize() {
      const container = canvas!.parentElement;
      if (!container) return;
      const w = container.clientWidth;
      const aspect = 3 / 4;
      const h = Math.floor(w * aspect);

      cellSize = Math.max(6, Math.min(10, Math.floor(w / 80)));
      cols = Math.floor(w / cellSize);
      rows = Math.floor(h / cellSize);

      canvas!.width = cols * cellSize;
      canvas!.height = rows * cellSize;
      canvas!.style.width = `${cols * cellSize}px`;
      canvas!.style.height = `${rows * cellSize}px`;

      noiseSeed = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => Math.random())
      );
    }

    resize();
    window.addEventListener("resize", resize);

    const sparkles: { col: number; row: number; ttl: number }[] = [];

    function draw(time: number) {
      if (!ctx || stopped) return;
      const theme = themeRef.current;
      const t = reducedMotion.current ? time * 0.2 : time;
      const hueShift = ((t / 30) % 1) * 20 - 10;

      ctx.clearRect(0, 0, canvas!.width, canvas!.height);

      /* ── Draw grid cells ── */
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const tideLine = getTideLine(c, t, rows);
          const noise = noiseSeed[r]?.[c] ?? 0.5;
          const x = c * cellSize;
          const y = r * cellSize;

          let color: string;

          if (r < tideLine - 2) {
            color = pick(theme.drySand, Math.floor(noise * theme.drySand.length + r + c));
          } else if (r < tideLine) {
            color = pick(theme.wetSand, Math.floor(noise * theme.wetSand.length + r + c));
          } else if (r < tideLine + 2) {
            const foamChance = 0.3 + 0.4 * Math.sin(t * 3 + c * 0.5);
            if (noise < foamChance) {
              color = pick(theme.foam, Math.floor(noise * theme.foam.length + c));
            } else {
              color = shiftHue(
                pick(theme.shallow, Math.floor(noise * theme.shallow.length + c)),
                hueShift
              );
            }
          } else {
            const depth = (r - tideLine) / (rows - tideLine);
            if (depth < 0.4) {
              color = shiftHue(
                pick(theme.shallow, Math.floor(noise * theme.shallow.length + r + c)),
                hueShift
              );
            } else {
              color = shiftHue(
                pick(theme.deep, Math.floor(noise * theme.deep.length + r + c)),
                hueShift
              );
            }
          }

          ctx.fillStyle = color;
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      }

      /* ── Sand sparkles ── */
      if (Math.random() < 0.15) {
        const sc = Math.floor(Math.random() * cols);
        const tideLine = getTideLine(sc, t, rows);
        const sr = Math.floor(Math.random() * Math.max(1, tideLine - 3));
        sparkles.push({ col: sc, row: sr, ttl: 12 });
      }

      for (let i = sparkles.length - 1; i >= 0; i--) {
        const sp = sparkles[i];
        sp.ttl--;
        if (sp.ttl <= 0) {
          sparkles.splice(i, 1);
          continue;
        }
        const alpha = sp.ttl / 12;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
        ctx.fillRect(
          sp.col * cellSize + 1,
          sp.row * cellSize + 1,
          cellSize - 2,
          cellSize - 2
        );
      }

      /* ── Draw sandcastles ── */
      const castles = castlesRef.current;
      for (let ci = castles.length - 1; ci >= 0; ci--) {
        const castle = castles[ci];

        // Draw all blocks
        for (const block of castle.blocks) {
          if (block.row < 0 || block.row >= rows || block.col < 0 || block.col >= cols) continue;

          const bx = block.col * cellSize;
          const by = block.row * cellSize;

          const shade = pick(theme.castle, block.col + block.row);
          ctx.fillStyle = shade;
          ctx.fillRect(bx, by, cellSize, cellSize);

          // Brick lines
          ctx.fillStyle = "rgba(0,0,0,0.12)";
          ctx.fillRect(bx, by + cellSize - 1, cellSize, 1);
          if (block.row % 2 === 0) {
            ctx.fillRect(bx + Math.floor(cellSize / 2), by, 1, cellSize);
          } else {
            ctx.fillRect(bx + Math.floor(cellSize / 4), by, 1, cellSize);
          }
        }

        // Crenellation on topmost blocks per column
        const colMap = new Map<number, number>();
        for (const block of castle.blocks) {
          const cur = colMap.get(block.col);
          if (cur === undefined || block.row < cur) {
            colMap.set(block.col, block.row);
          }
        }
        for (const [col, topRow] of colMap) {
          const bx = col * cellSize;
          const by = topRow * cellSize;
          ctx.fillStyle = pick(theme.castle, col + 2);
          const cw = Math.floor(cellSize / 3);
          ctx.fillRect(bx, by - Math.floor(cellSize * 0.3), cw, Math.floor(cellSize * 0.3));
          ctx.fillRect(bx + cellSize - cw, by - Math.floor(cellSize * 0.3), cw, Math.floor(cellSize * 0.3));
        }

        // Erosion: erode bottom-most blocks that are submerged
        let eroded = false;
        for (let bi = castle.blocks.length - 1; bi >= 0; bi--) {
          const block = castle.blocks[bi];
          const tideLine = getTideLine(block.col, t, rows);
          if (block.row >= tideLine) {
            block.erosion += 0.008;
            if (block.erosion >= 1) {
              // Spawn particles
              for (let p = 0; p < 3; p++) {
                particlesRef.current.push({
                  x: block.col * cellSize + cellSize / 2,
                  y: block.row * cellSize + cellSize / 2,
                  vx: (Math.random() - 0.5) * 2,
                  vy: -Math.random() * 1.5,
                  life: 30,
                  maxLife: 30,
                  color: pick(theme.castle, p),
                });
              }
              castle.blocks.splice(bi, 1);
              eroded = true;
            }
          }
        }

        // Remove castle if no blocks left
        if (castle.blocks.length === 0) {
          castles.splice(ci, 1);
        } else if (eroded) {
          // Remove floating blocks (blocks with nothing below them)
          const occupied = new Set(castle.blocks.map(b => `${b.col},${b.row}`));
          let changed = true;
          while (changed) {
            changed = false;
            for (let bi = castle.blocks.length - 1; bi >= 0; bi--) {
              const block = castle.blocks[bi];
              const below = `${block.col},${block.row + 1}`;
              // A block is supported if it's the bottom of its column or has a block below
              const isBottom = !castle.blocks.some(
                b => b.col === block.col && b.row > block.row
              );
              if (!isBottom && !occupied.has(below)) {
                // Floating — remove it
                occupied.delete(`${block.col},${block.row}`);
                castle.blocks.splice(bi, 1);
                changed = true;
                // Spawn particle
                particlesRef.current.push({
                  x: block.col * cellSize + cellSize / 2,
                  y: block.row * cellSize + cellSize / 2,
                  vx: (Math.random() - 0.5) * 1.5,
                  vy: -Math.random(),
                  life: 20,
                  maxLife: 20,
                  color: pick(theme.castle, block.col),
                });
              }
            }
          }
          if (castle.blocks.length === 0) {
            castles.splice(ci, 1);
          }
        }
      }

      /* ── Particles ── */
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.life--;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        const s = Math.max(2, cellSize * 0.4 * alpha);
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;

      frameRef.current++;
      animId = requestAnimationFrame(() => draw(performance.now() / 1000));
    }

    animId = requestAnimationFrame(() => draw(performance.now() / 1000));

    /* ── Click / touch handler ── */
    function handlePlace(clientX: number, clientY: number) {
      const rect = canvas!.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;
      const scaleX = canvas!.width / rect.width;
      const scaleY = canvas!.height / rect.height;
      const centerCol = Math.floor((mx * scaleX) / cellSize);
      const centerRow = Math.floor((my * scaleY) / cellSize);

      if (centerCol < 3 || centerCol >= cols - 3 || centerRow < 0 || centerRow >= rows) return;

      const time = performance.now() / 1000;
      const tideLine = getTideLine(centerCol, time, rows);
      if (centerRow > tideLine + 3) return;

      // Check for overlap with existing castles
      const occupied = new Set<string>();
      for (const c of castlesRef.current) {
        for (const b of c.blocks) {
          occupied.add(`${b.col},${b.row}`);
        }
      }

      // Build a chunky pyramid castle: 7 wide at base, tapering up
      const height = 8 + Math.floor(Math.random() * 5); // 8-12 tall
      const blocks: CastleBlock[] = [];

      for (let level = 0; level < height; level++) {
        const row = centerRow - level;
        if (row < 0) break;

        // Width tapers: wide base → narrow tower
        const progress = level / height;
        let width: number;
        if (progress < 0.4) {
          width = 7; // wide base
        } else if (progress < 0.6) {
          width = 5; // mid section
        } else if (progress < 0.8) {
          width = 3; // upper tower
        } else {
          width = 1; // top spire
        }

        const halfW = Math.floor(width / 2);
        for (let dc = -halfW; dc <= halfW; dc++) {
          const col = centerCol + dc;
          if (col < 0 || col >= cols) continue;
          const key = `${col},${row}`;
          if (occupied.has(key)) continue;
          blocks.push({ col, row, erosion: 0 });
          occupied.add(key);
        }
      }

      if (blocks.length > 0) {
        castlesRef.current.push({ blocks });
      }
    }

    function onClick(e: MouseEvent) {
      handlePlace(e.clientX, e.clientY);
    }

    function onTouch(e: TouchEvent) {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) handlePlace(touch.clientX, touch.clientY);
    }

    canvas.addEventListener("click", onClick);
    canvas.addEventListener("touchstart", onTouch, { passive: false });

    return () => {
      stopped = true;
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("touchstart", onTouch);
    };
  }, [getTideLine]);

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Theme selector */}
      <div className="flex items-center gap-2">
        {THEME_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => setActiveTheme(key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeTheme === key
                ? "bg-white/20 text-white shadow-sm"
                : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
            }`}
          >
            {THEMES[key].label}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div className="w-full max-w-3xl">
        <canvas
          ref={canvasRef}
          className="w-full rounded-2xl shadow-2xl cursor-crosshair"
          style={{ imageRendering: "pixelated" }}
        />
      </div>

      {/* Hint + reset */}
      <div className="flex items-center gap-4">
        <p className="text-white/40 text-sm tracking-wide">
          click anywhere to build a sandcastle
        </p>
        <button
          onClick={handleReset}
          className="text-white/25 text-xs hover:text-white/50 transition-colors"
        >
          reset
        </button>
      </div>
    </div>
  );
}
