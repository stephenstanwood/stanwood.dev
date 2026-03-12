import type { VibeResult } from "../../lib/vibePrompt";

interface Props {
  result: VibeResult;
  url: string;
  onCheckAnother: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  design: "Design",
  tone: "Tone",
  speed_feel: "Speed Feel",
  clarity: "Clarity",
  originality: "Originality",
  trust: "Trust",
};

function gradeColor(grade: string): string {
  const letter = grade.charAt(0).toUpperCase();
  if (letter === "A") return "var(--vc-grade-a)";
  if (letter === "B") return "var(--vc-grade-b)";
  if (letter === "C") return "var(--vc-grade-c)";
  if (letter === "D") return "var(--vc-grade-d)";
  return "var(--vc-grade-f)";
}

export default function VibeScorecard({ result, url, onCheckAnother }: Props) {
  const runNumber = Math.floor(Math.random() * 9000) + 1000;
  const timestamp = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const categories = Object.entries(result.categories) as [
    string,
    { grade: string; note: string },
  ][];

  return (
    <div className="vc-scorecard">
      {/* Header strip */}
      <div className="vc-card-header">
        <span className="vc-card-label">VIBE CHECK</span>
        <span className="vc-card-label">OFFICIAL ASSESSMENT</span>
      </div>

      {/* URL + metadata */}
      <div className="vc-card-meta">
        <span className="vc-card-url">{url}</span>
        <span className="vc-card-run">
          RUN #{runNumber} &middot; {timestamp}
        </span>
      </div>

      {/* Overall verdict */}
      <div className="vc-verdict-section">
        <div
          className="vc-overall-grade"
          style={{ color: gradeColor(result.overall_grade) }}
        >
          {result.overall_grade}
        </div>
        <h2 className="vc-overall-vibe">{result.overall_vibe}</h2>
      </div>

      {/* Divider */}
      <div className="vc-dotted-divider" />

      {/* Category rows */}
      <div className="vc-categories">
        {categories.map(([key, { grade, note }]) => (
          <div key={key} className="vc-category-row">
            <div className="vc-category-left">
              <span className="vc-category-label">
                {CATEGORY_LABELS[key] || key}
              </span>
              <span
                className="vc-category-grade"
                style={{ color: gradeColor(grade) }}
              >
                {grade}
              </span>
            </div>
            <p className="vc-category-note">{note}</p>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="vc-dotted-divider" />

      {/* Main read */}
      <div className="vc-main-read">
        <h3 className="vc-section-label">THE READ</h3>
        <p className="vc-main-read-text">{result.main_read}</p>
      </div>

      {/* Gentle nudge */}
      <div className="vc-nudge">
        <h3 className="vc-section-label">ONE THING</h3>
        <p className="vc-nudge-text">{result.gentle_nudge}</p>
      </div>

      {/* Divider */}
      <div className="vc-dotted-divider" />

      {/* Footer stamp */}
      <div className="vc-stamp-footer">
        <div className="vc-stamp">CERTIFIED VIBES INSPECTED</div>
        <p className="vc-stamp-sub">stanwood.dev/vibe-check</p>
      </div>

      {/* Check another */}
      <button className="vc-btn-another" onClick={onCheckAnother}>
        check another
      </button>
    </div>
  );
}
