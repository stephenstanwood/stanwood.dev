import { useCallback, useEffect, useRef, useState } from "react";

const LS_KEY = "idea-shuffler:v2";

function capitalize(str) {
  const s = str.trim();
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function loadIdeas() {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    if (Array.isArray(saved.ideas)) return saved.ideas;
  } catch {}
  return [];
}

function persistIdeas(ideas) {
  localStorage.setItem(LS_KEY, JSON.stringify({ ideas }));
}

async function condenseText(raw) {
  const trimmed = raw.trim();
  if (trimmed.split(/\s+/).length <= 8) return capitalize(trimmed);
  try {
    const res = await fetch("/api/condense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
    });
    if (!res.ok) throw new Error("API error");
    const { title } = await res.json();
    return title || capitalize(trimmed);
  } catch {
    const first = trimmed.split(/[.!?]\s/)[0];
    return capitalize(first);
  }
}

const styles = `
  .rolodex-wrapper { perspective: 800px; }
  .rolodex-card {
    cursor: pointer;
    user-select: none;
    transform-origin: center center;
    transition: box-shadow 0.2s;
  }
  .rolodex-card:hover { box-shadow: 0 8px 30px rgba(0,0,0,0.07); }

  @keyframes flipDown {
    0%   { transform: rotateX(0deg);   opacity: 1; }
    40%  { transform: rotateX(-90deg); opacity: 0; }
    60%  { transform: rotateX(90deg);  opacity: 0; }
    100% { transform: rotateX(0deg);   opacity: 1; }
  }
  @keyframes flipUp {
    0%   { transform: rotateX(0deg);  opacity: 1; }
    40%  { transform: rotateX(90deg); opacity: 0; }
    60%  { transform: rotateX(-90deg);opacity: 0; }
    100% { transform: rotateX(0deg);  opacity: 1; }
  }
  .rolodex-card.flip-down { animation: flipDown 0.4s ease-in-out; }
  .rolodex-card.flip-up   { animation: flipUp   0.4s ease-in-out; }

  .nav-btn { transition: all 0.15s; }
  .nav-btn:active { transform: scale(0.9); }

  .manage-body {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.3s ease;
  }
  .manage-body.open { grid-template-rows: 1fr; }
  .manage-body > div { overflow: hidden; }
`;

export default function IdeaShuffler() {
  const [ideas, setIdeas] = useState(() => loadIdeas());
  const [currentIdx, setCurrentIdx] = useState(() => {
    const saved = loadIdeas();
    return saved.length > 0 ? Math.floor(Math.random() * saved.length) : -1;
  });
  const [manageOpen, setManageOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [flipClass, setFlipClass] = useState("");
  const [displayText, setDisplayText] = useState("");

  const textareaRef = useRef(null);
  const flippingRef = useRef(false);
  const wheelLockRef = useRef(false);
  const ideasRef = useRef(ideas);
  const currentIdxRef = useRef(currentIdx);

  // Keep refs in sync
  ideasRef.current = ideas;
  currentIdxRef.current = currentIdx;

  // Compute display text from state
  useEffect(() => {
    if (ideas.length === 0) {
      setDisplayText("Add a few ideas to get started!");
    } else if (currentIdx >= 0 && currentIdx < ideas.length) {
      setDisplayText(ideas[currentIdx]);
    }
  }, [ideas, currentIdx]);

  // Persist on change
  useEffect(() => {
    persistIdeas(ideas);
  }, [ideas]);

  const flip = useCallback((direction, newText) => {
    if (flippingRef.current) return;
    flippingRef.current = true;

    const cls = direction === "down" ? "flip-down" : "flip-up";
    setFlipClass(cls);

    setTimeout(() => {
      setDisplayText(newText);
    }, 180);

    setTimeout(() => {
      setFlipClass("");
      flippingRef.current = false;
    }, 400);
  }, []);

  const step = useCallback((delta) => {
    const n = ideasRef.current.length;
    if (n === 0) return;
    const newIdx = ((currentIdxRef.current + delta) % n + n) % n;
    setCurrentIdx(newIdx);
    flip(delta > 0 ? "down" : "up", ideasRef.current[newIdx]);
  }, [flip]);

  // Keyboard nav
  useEffect(() => {
    function onKeyDown(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = document.activeElement?.tagName || "";
      if (tag === "TEXTAREA" || tag === "INPUT") return;

      if (e.key === "ArrowUp") { e.preventDefault(); step(-1); }
      if (e.key === "ArrowDown" || e.key === " ") { e.preventDefault(); step(1); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [step]);

  // Scroll nav
  useEffect(() => {
    function onWheel(e) {
      if (ideasRef.current.length === 0 || wheelLockRef.current) return;
      if (Math.abs(e.deltaY) < 8) return;
      wheelLockRef.current = true;
      setTimeout(() => (wheelLockRef.current = false), 300);
      step(e.deltaY > 0 ? 1 : -1);
    }
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, [step]);

  async function handleAdd() {
    const raw = textareaRef.current?.value || "";
    const trimmed = raw.trim();
    if (!trimmed) return;

    setAdding(true);
    const title = await condenseText(trimmed);
    setAdding(false);

    if (!title) return;

    setIdeas((prev) => {
      const next = [...prev, title];
      if (next.length === 1) {
        setCurrentIdx(0);
        flip("down", title);
      }
      return next;
    });
    textareaRef.current.value = "";
  }

  function handleDelete(i) {
    setIdeas((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      if (next.length === 0) {
        setCurrentIdx(-1);
        flip("down", "Add a few ideas to get started!");
      } else if (currentIdxRef.current >= next.length) {
        setCurrentIdx(0);
      }
      return next;
    });
  }

  function handleClearAll() {
    setIdeas([]);
    setCurrentIdx(-1);
    flip("down", "Add a few ideas to get started!");
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      {/* Rolodex Card */}
      <section className="mt-10">
        <div className="rolodex-wrapper">
          <div
            className={`rolodex-card rounded-3xl border border-neutral-200 bg-white shadow-sm ${flipClass}`}
            onClick={() => step(1)}
          >
            <div className="px-10 py-16">
              <div className="text-center min-h-[4.5rem] flex items-center justify-center">
                <p className="text-2xl sm:text-3xl font-semibold leading-snug tracking-tight text-neutral-900">
                  {displayText}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Nav arrows */}
        <div className="mt-4 flex justify-center gap-3">
          <button
            className="nav-btn h-10 w-10 rounded-full border border-neutral-200 bg-white text-sm font-semibold text-neutral-500 shadow-sm hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Previous idea"
            onClick={() => step(-1)}
          >
            &uarr;
          </button>
          <button
            className="nav-btn h-10 w-10 rounded-full border border-neutral-200 bg-white text-sm font-semibold text-neutral-500 shadow-sm hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Next idea"
            onClick={() => step(1)}
          >
            &darr;
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-neutral-400">
          Click the card, use arrows, or scroll.
        </p>
      </section>

      {/* Collapsible Manage Section */}
      <section className="mt-14">
        <button
          className="flex w-full items-center justify-between rounded-xl px-1 py-2 text-left transition-colors hover:bg-neutral-100"
          onClick={() => setManageOpen((o) => !o)}
        >
          <span className="text-sm font-semibold text-neutral-500">
            Manage ideas
            <span className="ml-1 text-neutral-400">({ideas.length})</span>
          </span>
          <svg
            className="h-4 w-4 text-neutral-400 transition-transform duration-300"
            style={{ transform: manageOpen ? "rotate(180deg)" : "" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div className={`manage-body ${manageOpen ? "open" : ""}`}>
          <div>
            {/* Add idea */}
            <div className="mt-3 flex gap-3">
              <textarea
                ref={textareaRef}
                className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-6 outline-none resize-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition-colors"
                placeholder="Type or paste an idea here. Long descriptions get auto-condensed!"
                rows={2}
                spellCheck={false}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
              />
              <button
                className="shrink-0 self-end rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 transition-colors disabled:opacity-40"
                disabled={adding}
                onClick={handleAdd}
              >
                {adding ? "..." : "Add"}
              </button>
            </div>

            {/* Idea list */}
            <div className="mt-4 space-y-2">
              {ideas.map((text, i) => (
                <div
                  key={`${i}-${text}`}
                  className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3"
                >
                  <span className="flex-1 text-sm text-neutral-800 truncate">
                    {text}
                  </span>
                  <button
                    className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                    onClick={() => handleDelete(i)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>

            {/* Clear all */}
            {ideas.length > 0 && (
              <div className="mt-4">
                <button
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                  onClick={handleClearAll}
                >
                  Clear all ideas
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
