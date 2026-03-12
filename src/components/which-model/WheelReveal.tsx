import { useEffect, useState, useRef } from "react";
import type { ModelProfile } from "../../lib/whichModel/types";
import { MODELS } from "../../lib/whichModel/models";
import { ModelLogo } from "../../lib/whichModel/logos";

interface Props {
  model: ModelProfile;
  onComplete: () => void;
}

const WHEEL_COLORS = [
  "#f5c542", "#7c5cff", "#ff6b4a", "#3ecf8e",
  "#4a9eff", "#ff4aac", "#f5c542", "#7c5cff",
  "#ff6b4a", "#3ecf8e", "#4a9eff", "#ff4aac",
];

export default function WheelReveal({ model, onComplete }: Props) {
  const [phase, setPhase] = useState<"spinning" | "landing" | "done">("spinning");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const winnerIndex = MODELS.findIndex((m) => m.id === model.id);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReduced) {
      setPhase("done");
      onComplete();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 8;
    const segments = MODELS.length;
    const segAngle = (2 * Math.PI) / segments;

    // Target: land on winning segment (center it at top)
    const targetAngle = -(winnerIndex * segAngle) - segAngle / 2 + Math.PI / 2;
    const totalRotation = targetAngle + Math.PI * 2 * 6; // 6 full spins

    const duration = 2400;
    const start = performance.now();

    function easeOutCubic(t: number) {
      return 1 - Math.pow(1 - t, 3);
    }

    function draw(rotation: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, size, size);

      // Draw segments
      for (let i = 0; i < segments; i++) {
        const startAngle = rotation + i * segAngle;
        const endAngle = startAngle + segAngle;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw short label
        const midAngle = startAngle + segAngle / 2;
        const labelR = radius * 0.65;
        const lx = cx + Math.cos(midAngle) * labelR;
        const ly = cy + Math.sin(midAngle) * labelR;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(midAngle + Math.PI / 2);
        const label = MODELS[i].shortLabel;
        ctx.font = `bold ${label.length > 2 ? 12 : 16}px 'Space Grotesk', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fff";
        ctx.fillText(label, 0, 0);
        ctx.restore();
      }

      // Center circle
      ctx.beginPath();
      ctx.arc(cx, cy, 28, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = "bold 11px 'Space Grotesk', sans-serif";
      ctx.fillStyle = "#111";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SPIN", cx, cy);
    }

    function drawPointer() {
      if (!ctx) return;
      // Triangle pointer at top
      ctx.beginPath();
      ctx.moveTo(cx, 4);
      ctx.lineTo(cx - 12, -10);
      ctx.lineTo(cx + 12, -10);
      ctx.closePath();
      ctx.fillStyle = "#111";
      ctx.fill();
    }

    let frame: number;
    function animate(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(t);
      const rotation = eased * totalRotation;

      draw(rotation - Math.PI / 2); // offset so "top" is 12 o'clock
      drawPointer();

      if (t < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        setPhase("landing");
        setTimeout(() => {
          setPhase("done");
          onComplete();
        }, 800);
      }
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [model, winnerIndex, onComplete]);

  return (
    <div className="wm-wheel-overlay">
      <div className="wm-wheel-scene">
        <div className="wm-wheel-pointer">▼</div>
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          className="wm-wheel-canvas"
        />
        <div className={`wm-wheel-result ${phase === "landing" || phase === "done" ? "show" : ""}`}>
          <ModelLogo org={model.org} size={36} color={model.color} />
          <span className="wm-wheel-result-name">{model.name}!</span>
        </div>
        <p className={`wm-wheel-tagline ${phase === "landing" || phase === "done" ? "show" : ""}`}>
          The wheel has spoken.
        </p>
      </div>
    </div>
  );
}
