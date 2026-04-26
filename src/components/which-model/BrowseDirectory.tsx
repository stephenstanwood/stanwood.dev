import { useState, useMemo } from "react";
import { MODELS } from "../../lib/whichModel/models";
import { TRAIT_LABELS, type Trait } from "../../lib/whichModel/types";
import type { ModelProfile } from "../../lib/whichModel/types";

type Category = "all" | "text" | "image" | "open";

const CATEGORY_OPTIONS: { id: Category; label: string; emoji: string }[] = [
  { id: "all",   label: "All",          emoji: "🌐" },
  { id: "text",  label: "Text + Code",  emoji: "💬" },
  { id: "image", label: "Image gen",    emoji: "🎨" },
  { id: "open",  label: "Open source",  emoji: "🔓" },
];

const SORT_TRAITS: Trait[] = [
  "reasoning",
  "coding",
  "writing",
  "speed",
  "cost",
  "long_context",
  "image_gen",
  "image_understanding",
  "open_source",
];

function isImageModel(m: ModelProfile): boolean {
  return m.traits.image_gen >= 7 && m.traits.writing === 0;
}

function passesFilter(m: ModelProfile, cat: Category): boolean {
  if (cat === "all") return true;
  if (cat === "image") return isImageModel(m);
  if (cat === "text") return !isImageModel(m);
  if (cat === "open") return m.traits.open_source >= 6;
  return true;
}

function scoreLabel(score: number): string {
  if (score >= 9) return "elite";
  if (score >= 7) return "strong";
  if (score >= 5) return "solid";
  if (score >= 3) return "okay";
  if (score >= 1) return "weak";
  return "n/a";
}

interface TraitBarProps {
  trait: Trait;
  score: number;
  highlight: boolean;
  color: string;
}

function TraitBar({ trait, score, highlight, color }: TraitBarProps) {
  const filledPct = Math.min(100, score * 10);
  return (
    <div className={`wm-trait-row${highlight ? " wm-trait-row--hot" : ""}`}>
      <span className="wm-trait-label">{TRAIT_LABELS[trait]}</span>
      <div className="wm-trait-track">
        <div
          className="wm-trait-fill"
          style={{
            width: `${filledPct}%`,
            background: highlight ? color : "var(--wm-ink)",
            opacity: score === 0 ? 0.15 : 1,
          }}
        />
      </div>
      <span className="wm-trait-score">{score === 0 ? "—" : score}</span>
    </div>
  );
}

const CARD_TRAITS: Trait[] = [
  "reasoning",
  "coding",
  "writing",
  "speed",
  "cost",
  "long_context",
];

const IMAGE_CARD_TRAITS: Trait[] = [
  "image_gen",
  "image_understanding",
  "speed",
  "cost",
  "open_source",
  "ecosystem",
];

export default function BrowseDirectory() {
  const [category, setCategory] = useState<Category>("all");
  const [sortBy, setSortBy] = useState<Trait>("reasoning");

  const visible = useMemo(() => {
    const filtered = MODELS.filter((m) => passesFilter(m, category));
    return [...filtered].sort((a, b) => {
      const diff = (b.traits[sortBy] ?? 0) - (a.traits[sortBy] ?? 0);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });
  }, [category, sortBy]);

  const totalCount = MODELS.length;

  return (
    <div className="wm-directory">
      <div className="wm-directory-head">
        <h2 className="wm-directory-title" id="directory-heading">
          All {totalCount} models, side-by-side
        </h2>
        <p className="wm-directory-sub">
          Hand-curated from the live frontier as of April 2026. Each model is rated
          0–10 across 11 traits — filter, sort, and see how they actually stack up.
        </p>
      </div>

      <div className="wm-dir-controls">
        <div className="wm-dir-controls-row">
          <span className="wm-dir-controls-label">Filter</span>
          <div className="wm-dir-chip-row">
            {CATEGORY_OPTIONS.map((opt) => {
              const count = MODELS.filter((m) => passesFilter(m, opt.id)).length;
              const active = category === opt.id;
              return (
                <button
                  key={opt.id}
                  className={`wm-dir-chip${active ? " wm-dir-chip--active" : ""}`}
                  onClick={() => setCategory(opt.id)}
                  aria-pressed={active}
                >
                  <span className="wm-dir-chip-emoji">{opt.emoji}</span>
                  {opt.label}
                  <span className="wm-dir-chip-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="wm-dir-controls-row">
          <span className="wm-dir-controls-label">Sort by</span>
          <div className="wm-dir-sort-wrap">
            <select
              className="wm-dir-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as Trait)}
              aria-label="Sort models by trait"
            >
              {SORT_TRAITS.map((t) => (
                <option key={t} value={t}>{TRAIT_LABELS[t]}</option>
              ))}
            </select>
            <span className="wm-dir-sort-hint">highest first</span>
          </div>
        </div>
      </div>

      <p className="wm-dir-count">
        Showing <strong>{visible.length}</strong> {visible.length === 1 ? "model" : "models"}
        {" "}— top score for <strong>{TRAIT_LABELS[sortBy].toLowerCase()}</strong>
      </p>

      <div className="wm-directory-grid">
        {visible.map((m, idx) => {
          const isImg = isImageModel(m);
          const traits = isImg ? IMAGE_CARD_TRAITS : CARD_TRAITS;
          const sortScore = m.traits[sortBy] ?? 0;
          return (
            <article
              key={m.id}
              className="wm-mod-card"
              style={{ ["--mod-color" as string]: m.color }}
            >
              <div className="wm-mod-rank">#{idx + 1}</div>
              <header className="wm-mod-head">
                <span className="wm-mod-emoji" aria-hidden="true">{m.emoji}</span>
                <div>
                  <h4 className="wm-mod-name">{m.name}</h4>
                  <p className="wm-mod-org">{m.org}</p>
                </div>
                <div className="wm-mod-sortbadge" title={`${TRAIT_LABELS[sortBy]} score`}>
                  <span className="wm-mod-sortbadge-num">{sortScore}</span>
                  <span className="wm-mod-sortbadge-label">{scoreLabel(sortScore)}</span>
                </div>
              </header>

              <p className="wm-mod-tag">{m.tagline}</p>

              <div className="wm-mod-traits">
                {traits.map((t) => (
                  <TraitBar
                    key={t}
                    trait={t}
                    score={m.traits[t] ?? 0}
                    highlight={t === sortBy}
                    color={m.color}
                  />
                ))}
              </div>

              <ul className="wm-mod-best">
                {m.bestFor.slice(0, 3).map((b) => <li key={b}>{b}</li>)}
              </ul>
            </article>
          );
        })}
      </div>

      {visible.length === 0 && (
        <p className="wm-dir-empty">
          No models match this filter. Try a broader category.
        </p>
      )}

      <p className="wm-directory-foot">
        Models retire and new ones land. Spot something missing? <a href="mailto:stephen@stanwood.dev">let me know</a>.
      </p>
    </div>
  );
}
