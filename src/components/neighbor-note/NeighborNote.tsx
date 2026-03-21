import { useState, useCallback } from "react";

/* ── Scenario definitions ─────────────────────────────────────── */
interface Scenario {
  id: string;
  emoji: string;
  label: string;
  placeholder: string;
  outcomePlaceholder: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "dog-out",
    emoji: "🐕",
    label: "Dog got out",
    placeholder: 'e.g. "black lab in front yard around 3pm"',
    outcomePlaceholder: "e.g. just wanted to let you know",
  },
  {
    id: "package",
    emoji: "📦",
    label: "Package came to us",
    placeholder: 'e.g. "Amazon box addressed to 214"',
    outcomePlaceholder: "e.g. happy to drop it off or you can grab it",
  },
  {
    id: "car-lights",
    emoji: "🚗",
    label: "Car lights on",
    placeholder: 'e.g. "silver SUV on Elm Street"',
    outcomePlaceholder: "e.g. didn't want your battery to die",
  },
  {
    id: "tree-branch",
    emoji: "🌳",
    label: "Tree branch issue",
    placeholder: 'e.g. "branch hanging over our driveway"',
    outcomePlaceholder: "e.g. could we figure out trimming it?",
  },
  {
    id: "noise",
    emoji: "🔊",
    label: "Noise / party",
    placeholder: 'e.g. "music was loud around 11:30pm"',
    outcomePlaceholder: "e.g. could you keep it down after 10?",
  },
  {
    id: "other",
    emoji: "💬",
    label: "Other",
    placeholder: "describe the situation",
    outcomePlaceholder: "what would you like to happen?",
  },
];

type Tone = "warm" | "neutral" | "direct";
type AppState = "idle" | "loading" | "result" | "error";

interface NoteResult {
  short: string;
  medium: string;
  text: string;
  printable: string;
  warning: string | null;
}

/* ── Copy button helper ───────────────────────────────────────── */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [text]);

  return (
    <button
      className="nn-copy-btn"
      onClick={handleCopy}
      aria-label={`Copy ${label}`}
    >
      {copied ? "copied!" : "copy"}
    </button>
  );
}

/* ── Main component ───────────────────────────────────────────── */
export default function NeighborNote() {
  const [state, setState] = useState<AppState>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<NoteResult | null>(null);

  // Form state
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(
    null,
  );
  const [details, setDetails] = useState("");
  const [neighborName, setNeighborName] = useState("");
  const [address, setAddress] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [outcome, setOutcome] = useState("");
  const [tone, setTone] = useState<Tone>("warm");

  const reset = useCallback(() => {
    setState("idle");
    setResult(null);
    setError("");
    setSelectedScenario(null);
    setDetails("");
    setNeighborName("");
    setAddress("");
    setContactInfo("");
    setOutcome("");
    setTone("warm");
  }, []);

  const generate = useCallback(
    async (overrideTone?: Tone) => {
      if (!selectedScenario) return;

      const activeTone = overrideTone ?? tone;
      setState("loading");
      setError("");

      try {
        const scenarioText =
          selectedScenario.id === "other"
            ? details
            : `${selectedScenario.label}${details ? `: ${details}` : ""}`;

        const res = await fetch("/api/neighbor-note", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scenario: scenarioText,
            details,
            neighborName: neighborName || undefined,
            address: address || undefined,
            contactInfo: contactInfo || undefined,
            outcome: outcome || undefined,
            tone: activeTone,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Something went wrong");
          setState("error");
          return;
        }

        setResult(data);
        setTone(activeTone);
        setState("result");
      } catch {
        setError("Network error — check your connection");
        setState("error");
      }
    },
    [selectedScenario, details, neighborName, address, contactInfo, outcome, tone],
  );

  const regenerateWithTone = useCallback(
    (newTone: Tone) => {
      generate(newTone);
    },
    [generate],
  );

  /* ── Idle / Form state ──────────────────────────────────────── */
  if (state === "idle" || state === "error") {
    return (
      <div className="nn-form-container nn-fade-in">
        <h1 className="nn-title">Neighbor Note</h1>
        <p className="nn-subtitle">
          write the note you wish you had words for
        </p>

        {/* Scenario cards */}
        <div className="nn-scenarios">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              className={`nn-scenario-card ${selectedScenario?.id === s.id ? "nn-selected" : ""}`}
              onClick={() => setSelectedScenario(s)}
            >
              <span className="nn-scenario-emoji">{s.emoji}</span>
              <span className="nn-scenario-label">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Dynamic form */}
        {selectedScenario && (
          <div className="nn-form nn-fade-in">
            <div className="nn-field">
              <label className="nn-label">What happened?</label>
              <textarea
                className="nn-input nn-textarea"
                placeholder={selectedScenario.placeholder}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={2}
              />
            </div>

            <div className="nn-field-row">
              <div className="nn-field nn-field-half">
                <label className="nn-label">
                  Neighbor's name{" "}
                  <span className="nn-optional">optional</span>
                </label>
                <input
                  className="nn-input"
                  placeholder="e.g. Sarah"
                  value={neighborName}
                  onChange={(e) => setNeighborName(e.target.value)}
                />
              </div>
              <div className="nn-field nn-field-half">
                <label className="nn-label">
                  Address / unit{" "}
                  <span className="nn-optional">optional</span>
                </label>
                <input
                  className="nn-input"
                  placeholder="e.g. 214"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="nn-field">
              <label className="nn-label">
                What you'd like{" "}
                <span className="nn-optional">optional</span>
              </label>
              <input
                className="nn-input"
                placeholder={selectedScenario.outcomePlaceholder}
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
              />
            </div>

            <div className="nn-field">
              <label className="nn-label">
                Your contact info{" "}
                <span className="nn-optional">optional</span>
              </label>
              <input
                className="nn-input"
                placeholder="e.g. unit 212 or 555-1234"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
              />
            </div>

            {/* Tone picker */}
            <div className="nn-tone-section">
              <label className="nn-label">Tone</label>
              <div className="nn-tone-row">
                {(["warm", "neutral", "direct"] as Tone[]).map((t) => (
                  <button
                    key={t}
                    className={`nn-tone-btn ${tone === t ? "nn-tone-active" : ""}`}
                    onClick={() => setTone(t)}
                  >
                    {t === "warm" && "warm"}
                    {t === "neutral" && "neutral"}
                    {t === "direct" && "friendly but direct"}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="nn-error">
                <p>{error}</p>
              </div>
            )}

            <button
              className="nn-btn-primary"
              onClick={() => generate()}
              disabled={
                !selectedScenario ||
                (selectedScenario.id === "other" && !details.trim())
              }
            >
              write my note
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── Loading state ──────────────────────────────────────────── */
  if (state === "loading") {
    return (
      <div className="nn-loading nn-fade-in">
        <div className="nn-pencil-animation">
          <span className="nn-pencil-icon">✏️</span>
        </div>
        <p className="nn-loading-text">writing something neighborly...</p>
      </div>
    );
  }

  /* ── Result state ───────────────────────────────────────────── */
  if (state === "result" && result) {
    const cards = [
      { key: "short", label: "Short note", text: result.short },
      { key: "medium", label: "Medium note", text: result.medium },
      { key: "text", label: "Text message", text: result.text },
      { key: "printable", label: "Door note", text: result.printable },
    ];

    return (
      <div className="nn-results nn-fade-in">
        {result.warning && (
          <div className="nn-warning">
            <span className="nn-warning-icon">⚡</span>
            {result.warning}
          </div>
        )}

        <div className="nn-cards">
          {cards.map((c) => (
            <div key={c.key} className={`nn-result-card ${c.key === "printable" ? "nn-printable-card" : ""}`}>
              <div className="nn-card-top">
                <span className="nn-card-label">{c.label}</span>
                <CopyButton text={c.text} label={c.label} />
              </div>
              <p className="nn-card-text">{c.text}</p>
              {c.key === "printable" && (
                <span className="nn-door-badge">safe for doors</span>
              )}
            </div>
          ))}
        </div>

        {/* Tone adjust */}
        <div className="nn-adjust-section">
          <span className="nn-adjust-label">adjust tone:</span>
          <div className="nn-adjust-row">
            <button
              className={`nn-adjust-btn ${tone === "warm" ? "nn-adjust-active" : ""}`}
              onClick={() => regenerateWithTone("warm")}
            >
              less stiff
            </button>
            <button
              className={`nn-adjust-btn ${tone === "direct" ? "nn-adjust-active" : ""}`}
              onClick={() => regenerateWithTone("direct")}
            >
              more direct
            </button>
            <button
              className={`nn-adjust-btn ${tone === "neutral" ? "nn-adjust-active" : ""}`}
              onClick={() => regenerateWithTone("neutral")}
            >
              more neutral
            </button>
          </div>
        </div>

        <button className="nn-btn-start-over" onClick={reset}>
          start over
        </button>
      </div>
    );
  }

  return null;
}
