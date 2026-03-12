import { useEffect, useState } from "react";
import type { ModelProfile } from "../../lib/whichModel/types";

interface Props {
  model: ModelProfile;
  onComplete: () => void;
}

export default function OracleReveal({ model, onComplete }: Props) {
  const [phase, setPhase] = useState<"pulse" | "reveal" | "done">("pulse");

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReduced) {
      setPhase("done");
      onComplete();
      return;
    }

    const t1 = setTimeout(() => setPhase("reveal"), 800);
    const t2 = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  return (
    <div className="wm-oracle-overlay">
      <div className="wm-oracle-scene">
        <div className={`wm-oracle-ring ring-1 ${phase}`} />
        <div className={`wm-oracle-ring ring-2 ${phase}`} />
        <div className={`wm-oracle-ring ring-3 ${phase}`} />

        <div className={`wm-oracle-center ${phase}`}>
          <span className="wm-oracle-emoji">{model.emoji}</span>
          <span className="wm-oracle-name">{model.name}</span>
        </div>

        <p className={`wm-oracle-tagline ${phase}`}>
          The oracle has spoken.
        </p>
      </div>
    </div>
  );
}
