interface Step {
  num: string;
  title: string;
  body: string;
  hint: string;
}

const steps: Step[] = [
  {
    num: "01",
    title: "Open the app, drop a pin",
    body: "Waymo One, the Tesla app, or the Zoox app — same flow as Uber. Pick your spot, see the wait time and price up front.",
    hint: "Pickups are usually 4–8 minutes. Pricing is a flat upfront quote — no surge.",
  },
  {
    num: "02",
    title: "An empty car shows up",
    body: "A Jaguar I-Pace (Waymo), a Tesla coupe (Cybercab), or a four-seat pod (Zoox) rolls up to the curb. The roof display flashes your initials. There is no driver.",
    hint: "First-timers: yes, the front seat really is empty. Yes, that's the steering wheel turning by itself.",
  },
  {
    num: "03",
    title: "Tap unlock, get in",
    body: "Hit \"unlock\" in the app or use the door button on the car. Doors open. Sit anywhere — the front passenger seat is fair game.",
    hint: "Stuck finding it on a busy block? Tap \"honk\" in the app and it'll chirp.",
  },
  {
    num: "04",
    title: "Press \"Start ride\"",
    body: "A screen on the seatback (or the app) confirms your destination. Hit start. The wheel turns, the car eases into traffic, and that's the ride.",
    hint: "It drives confidently — no jerky stops, no lane-change drama. Most people stop watching the road within five minutes.",
  },
  {
    num: "05",
    title: "It pulls over and you walk away",
    body: "The car finds a legal spot near your address, unlocks, and waits. Step out, close the door, done. Receipt lands in the app.",
    hint: "No tipping. No small talk. No \"what brought you to town today?\"",
  },
];

interface Surprise {
  emoji: string;
  text: string;
}

const surprises: Surprise[] = [
  { emoji: "🎵", text: "You can cast Spotify to the car stereo from your phone." },
  { emoji: "🚸", text: "It nails 4-way stops. No \"you go, no you go\" standoffs." },
  { emoji: "🚧", text: "Construction zones still trip it up — expect the occasional reroute." },
  { emoji: "🆘", text: "There's a 24/7 support button on the screen if anything feels wrong." },
  { emoji: "👶", text: "Car seats are allowed. Bring your own — it has standard LATCH anchors." },
  { emoji: "🌧️", text: "It pulls over in heavy rain or fog rather than risk it. Backup pickup may be needed." },
];

interface ServiceQuirk {
  service: string;
  vehicle: string;
  unique: string;
  cities: string;
}

const quirks: ServiceQuirk[] = [
  {
    service: "Waymo One",
    vehicle: "White Jaguar I-Pace",
    unique: "The original. Largest service area, most consistent experience.",
    cities: "SF · LA · Phoenix · Austin · Atlanta · Miami",
  },
  {
    service: "Tesla Cybercab",
    vehicle: "Two-seat Tesla coupe",
    unique: "No steering wheel, no pedals. Tesla's first true L4 — invite-only pilot.",
    cities: "Austin only",
  },
  {
    service: "Zoox",
    vehicle: "Four-seat carriage pod",
    unique: "No front or back — it drives both directions. Riders face each other.",
    cities: "SF · Las Vegas",
  },
];

export default function FirstRide() {
  return (
    <div className="dl-panel dl-full dl-firstride">
      <div className="dl-panel-header">
        <h2 className="dl-panel-title">What it's actually like to ride one</h2>
        <span className="dl-panel-subtitle">Five steps from app open to drop-off</span>
      </div>

      <ol className="dl-fr-steps">
        {steps.map((s) => (
          <li key={s.num} className="dl-fr-step">
            <div className="dl-fr-step-num">{s.num}</div>
            <div className="dl-fr-step-body">
              <h3 className="dl-fr-step-title">{s.title}</h3>
              <p className="dl-fr-step-text">{s.body}</p>
              <p className="dl-fr-step-hint">{s.hint}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="dl-fr-surprises">
        <p className="dl-fr-section-label">Things that surprise first-timers</p>
        <div className="dl-fr-surprise-grid">
          {surprises.map((s) => (
            <div key={s.text} className="dl-fr-surprise">
              <span className="dl-fr-surprise-emoji" aria-hidden>{s.emoji}</span>
              <span className="dl-fr-surprise-text">{s.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="dl-fr-quirks">
        <p className="dl-fr-section-label">How the three services differ</p>
        <div className="dl-fr-quirk-grid">
          {quirks.map((q) => (
            <div key={q.service} className="dl-fr-quirk">
              <div className="dl-fr-quirk-name">{q.service}</div>
              <div className="dl-fr-quirk-vehicle">{q.vehicle}</div>
              <p className="dl-fr-quirk-unique">{q.unique}</p>
              <div className="dl-fr-quirk-cities">{q.cities}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
