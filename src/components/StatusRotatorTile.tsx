import { useCycling } from "../hooks/useCycling";

const STATUSES = [
  "currently shipping",
  "probably overthinking css",
  "one more commit...",
  "refactoring for fun",
  "powered by coffee",
  "deploying on a friday",
  "rm -rf node_modules",
  "it works on my machine",
  "squash and merge",
  "needs more cowbell",
  "vibes: immaculate",
  "ctrl+z ctrl+z ctrl+z",
  "git push --force (jk)",
  "tailwind goes brr",
  "npm install hope",
  "to-do: fix later",
  "works locally ¯\\_(ツ)_/¯",
  "commit early commit often",
  "just one more feature",
  "shipping > perfecting",
  "404: sleep not found",
  "lgtm, ship it",
  "the tests pass (probably)",
  "built different (literally)",
  "console.log everything",
];

export default function StatusRotatorTile() {
  const { value: status, fading } = useCycling(STATUSES, 4000, 400);

  return (
    <div className="proj-tile spacer-tile">
      <div
        className="spacer-terminal"
        style={{
          opacity: fading ? 0 : 1,
          transition: "opacity 0.4s ease",
        }}
      >
        <span className="spacer-prompt">~</span>
        <span className="spacer-text" style={{ fontStyle: "italic" }}>
          {status}
        </span>
      </div>
    </div>
  );
}
