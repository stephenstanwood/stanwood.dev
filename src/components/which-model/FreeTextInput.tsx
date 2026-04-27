import { useState } from "react";

interface Props {
  onSubmit: (text: string) => void;
  onBack: () => void;
}

const EXAMPLES = [
  "write marketing copy for a landing page",
  "help me code a React app",
  "analyze a CSV and find trends",
  "generate an image for a blog header",
  "summarize a giant PDF",
  "I need something cheap and fast",
  "self-host a model for privacy",
  "brainstorm product ideas",
];

export default function FreeTextInput({ onSubmit, onBack }: Props) {
  const [text, setText] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (text.trim()) onSubmit(text.trim());
  }

  function handleExample(ex: string) {
    setText(ex);
    onSubmit(ex);
  }

  return (
    <div className="wm-freetext">
      <button className="wm-back" onClick={onBack}>
        ← back
      </button>

      <h2 className="wm-section-title">What are you trying to do?</h2>
      <p className="wm-section-desc">
        Be specific or be vague — the wheel decides.
      </p>

      <form onSubmit={handleSubmit} className="wm-input-form">
        <textarea
          className="wm-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. write marketing copy for a landing page..."
          rows={3}
          autoFocus
        />
        <button
          type="submit"
          className="wm-submit"
          disabled={!text.trim()}
        >
          Spin the wheel
        </button>
      </form>

      <div className="wm-example-grid">
        <p className="wm-examples-label">Or try one of these:</p>
        <div className="wm-example-buttons">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              className="wm-example-btn"
              onClick={() => handleExample(ex)}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
