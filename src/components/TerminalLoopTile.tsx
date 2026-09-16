import { useState, useEffect, useRef } from "react";

const WORDS = ["sleep", "swim", "build", "dad", "repeat"];

export default function TerminalLoopTile() {
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const innerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The visible text is always the current word cut at the cursor, so it is
  // derived rather than mirrored in a fourth piece of state.
  const display = WORDS[wordIdx].slice(0, charIdx);

  useEffect(() => {
    return () => {
      if (innerTimerRef.current !== null) clearTimeout(innerTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const word = WORDS[wordIdx];

    if (!deleting && charIdx <= word.length) {
      if (charIdx === word.length) {
        const isLast = wordIdx === WORDS.length - 1;
        const timer = setTimeout(() => {
          if (isLast) {
            innerTimerRef.current = setTimeout(() => {
              setWordIdx(0);
              setCharIdx(0);
            }, 1500);
          } else {
            setDeleting(true);
          }
        }, isLast ? 800 : 600);
        return () => clearTimeout(timer);
      }
      const timer = setTimeout(() => {
        setCharIdx(charIdx + 1);
      }, 80 + Math.random() * 60);
      return () => clearTimeout(timer);
    }

    if (deleting && charIdx > 0) {
      const timer = setTimeout(() => {
        setCharIdx(charIdx - 1);
      }, 40);
      return () => clearTimeout(timer);
    }

    if (deleting && charIdx === 0) {
      setDeleting(false);
      setWordIdx(wordIdx + 1);
    }
  }, [wordIdx, charIdx, deleting]);

  return (
    <div className="proj-tile spacer-tile">
      <div className="spacer-terminal">
        <span className="spacer-prompt">$</span>
        <span className="spacer-text">{display}</span>
        <span className="spacer-cursor">█</span>
      </div>
    </div>
  );
}
