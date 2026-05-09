type Verdict = "true" | "mostly-true" | "partly-true" | "mostly-false" | "false";

interface Myth {
  claim: string;
  verdict: Verdict;
  reality: string;
  receipt: string;
}

const VERDICT_CONFIG: Record<Verdict, { label: string; color: string; bg: string; border: string }> = {
  true: { label: "True", color: "#15803d", bg: "#dcfce7", border: "#16a34a" },
  "mostly-true": { label: "Mostly True", color: "#166534", bg: "#ecfdf5", border: "#22c55e" },
  "partly-true": { label: "Partly True", color: "#a16207", bg: "#fef9c3", border: "#eab308" },
  "mostly-false": { label: "Mostly False", color: "#9a3412", bg: "#ffedd5", border: "#f97316" },
  false: { label: "False", color: "#991b1b", bg: "#fee2e2", border: "#ef4444" },
};

const myths: Myth[] = [
  {
    claim: "Self-driving cars are way safer than human drivers.",
    verdict: "mostly-true",
    reality:
      "Across 56.7M rider-only miles, Waymo logged 90% fewer serious-injury crashes and 92% fewer pedestrian-injury crashes than the human baseline for the same cities. The catch: most of those miles are in mild-weather urban grids — not snowy interstates.",
    receipt: "Waymo / Swiss Re peer-reviewed safety study, 2024",
  },
  {
    claim: "These things constantly block traffic and clog intersections.",
    verdict: "partly-true",
    reality:
      "Cruise was a real menace before GM shut it down — pile-ups in San Francisco intersections happened weekly. Waymo's modern fleet gets stuck about 1 in every 4,000 trips and remote operators usually free it inside two minutes. It still happens; the rate is just much lower than the headlines suggest.",
    receipt: "SFMTA incident logs, 2023–2025",
  },
  {
    claim: "They're rolling cameras that record everything around them.",
    verdict: "true",
    reality:
      "Every robotaxi continuously logs LiDAR sweeps, 360° camera feeds, and audio inside the cabin. Footage is retained ~30 days by default. Police in SF, LA, and Phoenix have already subpoenaed it for unrelated criminal cases — sometimes successfully.",
    receipt: "Bloomberg, 2024 reporting on AV subpoenas",
  },
  {
    claim: "Robotaxis will replace human drivers in five years.",
    verdict: "false",
    reality:
      "There are roughly 4,500 driverless cars operating in the US today against ~280 million registered passenger vehicles. Even at Waymo's current 2x-per-year ride growth, that's a 15-to-25 year glide path — and it skips the trucking and rural slices entirely.",
    receipt: "FHWA registration data + Waymo growth curve",
  },
  {
    claim: "Tesla FSD is the same thing as a Waymo.",
    verdict: "false",
    reality:
      "Waymo, Zoox, and Aurora all run multi-sensor stacks (LiDAR + radar + cameras) with no human required. Tesla FSD is camera-only Level 2+, which means a licensed driver has to be ready to take over at all times. The Cybercab pilot in Austin is Tesla's first true Level 4 deployment, and it's invite-only with a tiny fleet.",
    receipt: "SAE level definitions; Tesla FSD owner's manual",
  },
  {
    claim: "If a robotaxi hits something, you're on the hook as the rider.",
    verdict: "false",
    reality:
      "Operators carry the liability. Waymo and Zoox are self-insured and settle property and injury claims directly with affected parties. Riders don't need supplemental coverage and can't be sued for the car's behavior — the same way you can't be sued for an Uber driver's lane change.",
    receipt: "Waymo terms of service; CA DMV operator requirements",
  },
  {
    claim: "They only work in California and Phoenix.",
    verdict: "false",
    reality:
      "As of April 2026, commercial driverless rides are running in San Francisco, Los Angeles, Phoenix, Austin, Atlanta, and Miami — six metros across four states. Dallas, Nashville, and DC are next on Waymo's 2026 expansion list.",
    receipt: "Waymo press releases; this dashboard's city tracker",
  },
  {
    claim: "They get confused by anything unusual on the road.",
    verdict: "partly-true",
    reality:
      "Edge cases that were nightmares in 2020 — double-parked delivery trucks, weird left turns, jaywalkers — are now handled smoothly. What still trips them up: human hand signals from cops or flaggers, big-event crowds, and sustained snow or ice. The car's response is to stop and ask remote support, not to guess.",
    receipt: "CA DMV disengagement reports, 2024–2025",
  },
];

export default function Myths() {
  return (
    <div className="dl-panel dl-full dl-myths">
      <div className="dl-panel-header">
        <h2 className="dl-panel-title">What people get wrong about robotaxis</h2>
        <span className="dl-panel-subtitle">Eight common claims, fact-checked against the data</span>
      </div>

      <p className="dl-myths-lead">
        Most arguments about self-driving cars are arguments from a 2018 article. Here's where today's
        commercial fleets actually stand on the eight claims that come up at every dinner table.
      </p>

      <div className="dl-myths-grid">
        {myths.map((m) => {
          const cfg = VERDICT_CONFIG[m.verdict];
          return (
            <article
              key={m.claim}
              className="dl-myth"
              style={{ borderLeftColor: cfg.border }}
            >
              <div className="dl-myth-head">
                <span
                  className="dl-myth-verdict"
                  style={{ color: cfg.color, background: cfg.bg }}
                >
                  {cfg.label}
                </span>
              </div>
              <p className="dl-myth-claim">&ldquo;{m.claim}&rdquo;</p>
              <p className="dl-myth-reality">{m.reality}</p>
              <p className="dl-myth-receipt">
                <span className="dl-myth-receipt-label">source</span>
                {m.receipt}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
