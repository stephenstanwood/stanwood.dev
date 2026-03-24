import type { WeirdnessMode } from "../../lib/redesignRolodex/types";

const modes: { value: WeirdnessMode; label: string; desc: string }[] = [
  { value: "client-safe", label: "Client-safe", desc: "Polished & plausible" },
  { value: "designer", label: "Designer", desc: "Daring & expressive" },
  {
    value: "alternate-timeline",
    label: "Alt Timeline",
    desc: "Weird & wonderful",
  },
];

export default function WeirdnessModeToggle({
  value,
  onChange,
}: {
  value: WeirdnessMode;
  onChange: (m: WeirdnessMode) => void;
}) {
  return (
    <div className="rr-mode-toggle">
      {modes.map((m) => (
        <button
          key={m.value}
          className={`rr-mode-btn ${value === m.value ? "rr-mode-active" : ""}`}
          onClick={() => onChange(m.value)}
          title={m.desc}
          type="button"
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
