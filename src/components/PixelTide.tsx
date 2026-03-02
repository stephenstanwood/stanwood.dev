import { useRef, useEffect, useCallback } from "react";

/* ── Color Palettes ── */
const DRY_SAND = ["#F5E6C8", "#EDD9B3", "#E8D0A0", "#F0DFC0", "#EADAB5"];
const WET_SAND = ["#C4A97D", "#B89B6A", "#A88D5A", "#BFA476", "#B09465"];
const SHALLOW = ["#7EC8E3", "#5BB5D5", "#45A5C9", "#6BC0DC", "#52AECE"];
const DEEP = ["#2E86AB", "#1B6B93", "#0F4C75", "#24799F", "#165F85"];
const CASTLE = ["#D4A76A", "#C49A5C", "#B8884E", "#A67840", "#D0A060"];
const FOAM = ["#ffffff", "#e0f4ff", "#c8ecff", "#d6f0ff"];

/* ── Helpers ── */
function pick<T>(arr: T[], i: number): T {
  return arr[((i % arr.length) + arr.length) % arr.length];
}

/** Shift a hex color's hue by `deg` degrees */
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

/* ── Sandcastle type ── */
interface Castle {
  col: number;
  baseRow: number;
  height: number;
  erosion: number;
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

  /* ── Tide line for a given column at a given time ── */
  const getTideLine = useCallback((col: number, time: number, rows: number) => {
    const base = rows * 0.45;
    const w1 = Math.sin(time * 0.78 + col * 0.18) * 5;
    const w2 = Math.sin(time * 1.26 + col * 0.12 + 1.3) * 2;
    const w3 = Math.sin(time * 2.1 + col * 0.25 + 2.7) * 1;
    return base + w1 + w2 + w3;
  }, []);

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

    /* Noise seed per cell for sand texture */
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

    /* ── Sparkle tracker ── */
    const sparkles: { col: number; row: number; ttl: number }[] = [];

    function draw(time: number) {
      if (!ctx || stopped) return;
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
            color = pick(DRY_SAND, Math.floor(noise * DRY_SAND.length + r + c));
          } else if (r < tideLine) {
            color = pick(WET_SAND, Math.floor(noise * WET_SAND.length + r + c));
          } else if (r < tideLine + 2) {
            const foamChance = 0.3 + 0.4 * Math.sin(t * 3 + c * 0.5);
            if (noise < foamChance) {
              color = pick(FOAM, Math.floor(noise * FOAM.length + c));
            } else {
              color = shiftHue(
                pick(SHALLOW, Math.floor(noise * SHALLOW.length + c)),
                hueShift
              );
            }
          } else {
            const depth = (r - tideLine) / (rows - tideLine);
            if (depth < 0.4) {
              color = shiftHue(
                pick(SHALLOW, Math.floor(noise * SHALLOW.length + r + c)),
                hueShift
              );
            } else {
              color = shiftHue(
                pick(DEEP, Math.floor(noise * DEEP.length + r + c)),
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
      for (let i = castles.length - 1; i >= 0; i--) {
        const castle = castles[i];
        for (let b = 0; b < castle.height; b++) {
          const blockRow = castle.baseRow - b;
          if (blockRow < 0 || blockRow >= rows) continue;

          const bx = castle.col * cellSize;
          const by = blockRow * cellSize;

          const shade = pick(CASTLE, b);
          ctx.fillStyle = shade;
          ctx.fillRect(bx, by, cellSize, cellSize);

          // Brick lines
          ctx.fillStyle = "rgba(0,0,0,0.12)";
          ctx.fillRect(bx, by + cellSize - 1, cellSize, 1);
          if (b % 2 === 0) {
            ctx.fillRect(bx + Math.floor(cellSize / 2), by, 1, cellSize);
          } else {
            ctx.fillRect(bx + Math.floor(cellSize / 4), by, 1, cellSize);
          }

          // Crenellation on top block
          if (b === castle.height - 1) {
            ctx.fillStyle = pick(CASTLE, b + 2);
            const cw = Math.floor(cellSize / 3);
            ctx.fillRect(bx, by - Math.floor(cellSize * 0.3), cw, Math.floor(cellSize * 0.3));
            ctx.fillRect(bx + cellSize - cw, by - Math.floor(cellSize * 0.3), cw, Math.floor(cellSize * 0.3));
          }
        }

        // Erosion: check if bottom block is submerged
        const tideLine = getTideLine(castle.col, t, rows);
        if (castle.baseRow >= tideLine) {
          castle.erosion += 0.012;
          if (castle.erosion >= 1) {
            for (let p = 0; p < 4; p++) {
              particlesRef.current.push({
                x: castle.col * cellSize + cellSize / 2,
                y: castle.baseRow * cellSize + cellSize / 2,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 1.5,
                life: 30,
                maxLife: 30,
                color: pick(CASTLE, p),
              });
            }
            castle.baseRow--;
            castle.height--;
            castle.erosion = 0;
          }
        } else {
          castle.erosion = Math.max(0, castle.erosion - 0.003);
        }

        if (castle.height <= 0) {
          castles.splice(i, 1);
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
      const col = Math.floor((mx * scaleX) / cellSize);
      const row = Math.floor((my * scaleY) / cellSize);

      if (col < 0 || col >= cols || row < 0 || row >= rows) return;

      const time = performance.now() / 1000;
      const tideLine = getTideLine(col, time, rows);
      if (row > tideLine + 3) return;

      const existing = castlesRef.current.find((c) => c.col === col);
      if (existing) return;

      const height = 3 + Math.floor(Math.random() * 3);
      castlesRef.current.push({
        col,
        baseRow: row,
        height,
        erosion: 0,
      });
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
    <div className="w-full flex flex-col items-center gap-6">
      <div className="w-full max-w-3xl">
        <canvas
          ref={canvasRef}
          className="w-full rounded-2xl shadow-2xl cursor-crosshair"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
      <p className="text-white/40 text-sm tracking-wide">
        click anywhere to build a sandcastle
      </p>
    </div>
  );
}
