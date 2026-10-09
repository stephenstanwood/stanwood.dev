import { useState } from "react";

// Opinionated starting points, not benchmark scores. Link to current product
// documentation rather than hard-coding fast-changing model names or prices.
const PICKS = [
  { task: "Writing & editing", name: "Claude", note: "A useful place to work through a draft, its tone, and its structure.", url: "https://claude.com/product/overview" },
  { task: "Building software", name: "Codex", note: "Start here when the work lives in a codebase: edits, debugging, and tests.", url: "https://openai.com/codex/" },
  { task: "Long documents", name: "Gemini", note: "A starting point for working with a large amount of source material.", url: "https://ai.google.dev/gemini-api/docs/long-context" },
  { task: "Everyday questions", name: "ChatGPT", note: "A handy general-purpose starting point for explaining, planning, and thinking things through.", url: "https://chatgpt.com/" },
  { task: "Making images", name: "Midjourney", note: "Try it when the image itself is the work: visual exploration, mood, and composition.", url: "https://www.midjourney.com/home" },
  { task: "More control", name: "Mistral", note: "Explore its open models when choosing how and where a model runs matters to you.", url: "https://mistral.ai/models" },
];

export default function WhichModel() {
  const [selected, setSelected] = useState(0);
  const pick = PICKS[selected];
  return <div className="wm-tool">
    <fieldset className="wm-tasks"><legend>What are you doing?</legend>
      {PICKS.map((item, i) => <label key={item.task} className={i === selected ? "wm-choice selected" : "wm-choice"}>
        <input type="radio" name="task" value={i} checked={i === selected} onChange={() => setSelected(i)} />
        <span>{item.task}</span>
      </label>)}
    </fieldset>
    <section className="wm-answer" aria-live="polite" aria-atomic="true">
      <span className="wm-answer-label">My starting pick</span>
      <h2>{pick.name}<span aria-hidden="true">↗</span></h2>
      <p>{pick.note}</p>
      <a href={pick.url} target="_blank" rel="noopener noreferrer">Explore {pick.name} <span aria-hidden="true">→</span></a>
    </section>
    <p className="wm-footnote">A starting point, not a leaderboard. Try your actual task; keep the tool that helps.</p>
  </div>;
}
