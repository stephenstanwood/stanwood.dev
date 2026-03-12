import { useState, useEffect } from "react";

const MESSAGES = [
  "examining the energy...",
  "reading the room...",
  "consulting the design spirits...",
  "checking fonts, vibes, and emotional residue...",
  "please hold while we judge this website gently",
  "inspecting the gradient confidence...",
  "measuring the whitespace energy...",
  "detecting startup dialect patterns...",
  "evaluating typographic sincerity...",
];

export default function LoadingState() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % MESSAGES.length);
        setFade(true);
      }, 200);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="vc-loading">
      <div className="vc-scanner">
        <div className="vc-scanner-line" />
      </div>
      <p className={`vc-loading-text ${fade ? "vc-fade-in" : "vc-fade-out"}`}>
        {MESSAGES[index]}
      </p>
    </div>
  );
}
