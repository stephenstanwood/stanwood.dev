interface Props {
  onJustTellMe: () => void;
  onGuideMe: () => void;
}

export default function StartScreen({ onJustTellMe, onGuideMe }: Props) {
  return (
    <div className="wm-start">
      <div className="wm-hero">
        <h1 className="wm-title">Which Model?</h1>
        <p className="wm-subtitle">
          Stop overthinking it. Tell us what you need, we'll tell you what to use.
        </p>
      </div>

      <div className="wm-paths">
        <button className="wm-path-card" onClick={onJustTellMe}>
          <span className="wm-path-emoji">🎯</span>
          <span className="wm-path-label">Just tell me</span>
          <span className="wm-path-desc">
            Describe what you want to do and get an instant recommendation
          </span>
        </button>

        <button className="wm-path-card" onClick={onGuideMe}>
          <span className="wm-path-emoji">🔮</span>
          <span className="wm-path-label">Guide me</span>
          <span className="wm-path-desc">
            Answer 5 quick questions and the oracle will decide
          </span>
        </button>
      </div>

      <div className="wm-examples">
        <p className="wm-examples-label">People ask things like:</p>
        <div className="wm-example-chips">
          {[
            "write marketing copy",
            "analyze a CSV",
            "generate an image",
            "code a React app",
            "summarize a long PDF",
            "something cheap and fast",
          ].map((ex) => (
            <span key={ex} className="wm-chip">{ex}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
