import { useState, useEffect } from "react";

const MESSAGES = [
  "taking a snapshot...",
  "reading the room...",
  "inspecting the typography...",
  "finding alternate timelines...",
  "raiding the font library...",
  "restyling reality...",
  "picking palettes from parallel universes...",
  "loading the rolodex...",
];

export default function LoadingSequence() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIdx((i) => (i + 1) % MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rr-loading">
      <div className="rr-loading-spinner">
        <div className="rr-spinner-card rr-sc-1" />
        <div className="rr-spinner-card rr-sc-2" />
        <div className="rr-spinner-card rr-sc-3" />
      </div>
      <p className="rr-loading-text" key={idx}>
        {MESSAGES[idx]}
      </p>
    </div>
  );
}
