import { useState, useEffect } from "react";

const WORDS = ["sleep", "swim", "build", "dad", "repeat"];

export default function TerminalLoopTile() {
  const [display, setDisplay] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = WORDS[wordIdx];

    if (!deleting && charIdx <= word.length) {
      if (charIdx === word.length) {
        const isLast = wordIdx === WORDS.length - 1;
        // CLEANUP-FLAG: the inner 1500ms reset timer is not tracked by the outer
        // clearTimeout, so it may fire on an unmounted component. Low risk in
        // practice (no crash, just a no-op setState), but worth a useRef fix.
        const timer = setTimeout(() => {
          if (isLast) {
            setTimeout(() => {
              setDisplay("");
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
        setDisplay(word.slice(0, charIdx + 1));
        setCharIdx(charIdx + 1);
      }, 80 + Math.random() * 60);
      return () => clearTimeout(timer);
    }

    if (deleting && charIdx > 0) {
      const timer = setTimeout(() => {
        setCharIdx(charIdx - 1);
        setDisplay(WORDS[wordIdx].slice(0, charIdx - 1));
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
