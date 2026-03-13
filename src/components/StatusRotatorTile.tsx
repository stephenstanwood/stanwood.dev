import { useState, useEffect } from "react";

const STATUSES = [
  "currently shipping",
  "probably overthinking css",
  "one more commit...",
  "refactoring for fun",
  "powered by coffee",
  "fixing what ain't broke",
  "deploying on a friday",
  "rm -rf node_modules",
  "it works on my machine",
  "squash and merge",
  "needs more cowbell",
  "vibes: immaculate",
  "ctrl+z ctrl+z ctrl+z",
  "git push --force (jk)",
  "tailwind goes brr",
];

function pick(): string {
  return STATUSES[Math.floor(Math.random() * STATUSES.length)];
}

export default function StatusRotatorTile() {
  const [status, setStatus] = useState(pick);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setStatus(pick());
        setFading(false);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="proj-tile spacer-tile">
      <div className="spacer-terminal">
        <span className="spacer-prompt">~</span>
        <span
          className="spacer-text"
          style={{
            opacity: fading ? 0 : 1,
            transition: "opacity 0.4s ease",
            fontStyle: "italic",
          }}
        >
          {status}
        </span>
      </div>
    </div>
  );
}
