interface Limit {
  emoji: string;
  title: string;
  reality: string;
  workaround: string;
}

const limits: Limit[] = [
  {
    emoji: "🛣️",
    title: "Most still won't take a freeway",
    reality:
      "Waymo only opened freeway rides in Phoenix and SF in 2025, and Zoox is surface-streets only. Cross-town rides that obviously need 101 or I-10 still get routed down arterials, and a 12-minute Uber can become a 28-minute Waymo.",
    workaround: "Check the upfront ETA before booking. If the quote is suspiciously long, a human driver may be the move.",
  },
  {
    emoji: "📍",
    title: "The geofence is a hard wall",
    reality:
      "Every service is bounded by a polygon on a map. Try to drop a pin one block outside Waymo's SF zone — say, into Daly City — and the app will simply refuse the ride. There is no \"just this once.\"",
    workaround: "Ride to the edge, then transfer. Power users keep both Waymo and Uber installed for cross-boundary trips.",
  },
  {
    emoji: "✈️",
    title: "Airports are a special case",
    reality:
      "Phoenix Sky Harbor is the only major US airport with curbside Waymo pickups. SFO, LAX, and Austin-Bergstrom all force the car to a designated rideshare lot — you walk 5–10 minutes from the terminal each way.",
    workaround: "Time your pickup for the lot walk, and don't expect drop-offs at departures curbs. A human driver is often the better airport play.",
  },
  {
    emoji: "👮",
    title: "Hand-signals trip them up",
    reality:
      "A cop waving you through a flooded intersection, a valet pointing to a parking spot, a construction flagger reversing the flow — these are still hard. The car may stop, idle, or call remote support to figure it out.",
    workaround: "If you spot one ahead, you can ask the in-app support agent to reroute. Otherwise, expect a 30–90 second pause.",
  },
  {
    emoji: "🎤",
    title: "Big events break the routing",
    reality:
      "Game day at Chase Center, a Coachella weekend in LA, a parade route through downtown — high-density events overwhelm the planning stack. Pickups can be flat-out unavailable for blocks around the venue, even if you're in-zone.",
    workaround: "Walk 4–5 blocks away from the venue before requesting. Pickups outside the cordon work normally.",
  },
  {
    emoji: "🌨️",
    title: "Snow, ice, and dense fog stop the show",
    reality:
      "Heavy rain causes a temporary pullover; snow and ice cause the whole fleet to pause. None of the major US services run a winter program, which is why Phoenix, Austin, and SoCal got commercial deployments first.",
    workaround: "Check the in-app status before relying on a robotaxi for an early-morning ride during a storm window.",
  },
];

export default function Limits() {
  return (
    <div className="dl-panel dl-full dl-limits">
      <div className="dl-panel-header">
        <h2 className="dl-panel-title">Where the geofence ends</h2>
        <span className="dl-panel-subtitle">Six things today's robotaxis still can't do — and what to do instead</span>
      </div>

      <p className="dl-limits-lead">
        Robotaxi marketing is mostly highlight reel. These are the seams that show up after a few rides — useful to know before you cancel your Uber account.
      </p>

      <div className="dl-limits-grid">
        {limits.map((l) => (
          <article key={l.title} className="dl-limit">
            <div className="dl-limit-head">
              <span className="dl-limit-emoji" aria-hidden>{l.emoji}</span>
              <h3 className="dl-limit-title">{l.title}</h3>
            </div>
            <p className="dl-limit-reality">{l.reality}</p>
            <p className="dl-limit-workaround">
              <span className="dl-limit-workaround-label">workaround</span>
              {l.workaround}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
