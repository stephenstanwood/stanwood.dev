interface Sensor {
  emoji: string;
  name: string;
  fullName: string;
  range: string;
  job: string;
  waymo: string;
  tesla: string;
  teslaOk: boolean;
}

const sensors: Sensor[] = [
  {
    emoji: "📡",
    name: "LiDAR",
    fullName: "Light Detection and Ranging",
    range: "~300 m",
    job: "Spins out millions of laser pulses a second to build a real-time 3D point cloud of everything around the car. Sees a pedestrian's silhouette in pitch black, dense fog, or direct sun glare — the conditions cameras hate most.",
    waymo: "5 long-range + multiple short-range LiDARs (5th-gen hardware)",
    tesla: "None — Musk calls LiDAR \"a crutch\"",
    teslaOk: false,
  },
  {
    emoji: "📷",
    name: "Cameras",
    fullName: "High-resolution color vision",
    range: "~250 m",
    job: "Read color, texture, and symbols nothing else can: brake lights, hand-painted signs, school-zone flashers, the cop's high-vis vest. 8–12 cameras stitched into a 360° view, run through perception models every few milliseconds.",
    waymo: "29 cameras across the 6th-gen Driver",
    tesla: "8 cameras — the entire stack relies on this layer",
    teslaOk: true,
  },
  {
    emoji: "📶",
    name: "Radar",
    fullName: "Radio-wave ranging",
    range: "~200 m",
    job: "Bounces radio waves off objects to clock their speed and distance — works through rain, fog, snow, and darkness where cameras and LiDAR start to struggle. The all-weather backup that keeps the car driving when visibility drops.",
    waymo: "6 imaging radars covering 360°",
    tesla: "Removed in 2021, partially reintroduced 2024",
    teslaOk: false,
  },
  {
    emoji: "🔊",
    name: "Ultrasonics",
    fullName: "Short-range sonar",
    range: "~5 m",
    job: "Pings sound waves off nearby objects to handle the close stuff — curbs, parked cars, pedestrians right next to the door. Used at parking-lot speeds where the long-range sensors aren't precise enough.",
    waymo: "Used across the fleet for low-speed maneuvering",
    tesla: "Removed in 2022 — \"Tesla Vision\" handles it from cameras",
    teslaOk: false,
  },
  {
    emoji: "🗺️",
    name: "HD maps + GPS",
    fullName: "Centimeter-accurate prior",
    range: "Whole city",
    job: "A pre-built 3D map of every street the car is allowed on — lane lines, traffic-light positions, stop bars, curb cuts, school zones. The car knows what the road looks like before it turns the corner, so the live sensors only need to spot what's changed.",
    waymo: "Backbone of the system — geofence equals mapped area",
    tesla: "Skipped on principle — claims \"vision-only\" generalizes better",
    teslaOk: false,
  },
  {
    emoji: "🧠",
    name: "Compute & fusion",
    fullName: "Onboard inference brain",
    range: "10× per second",
    job: "Custom silicon that fuses every sensor feed into a single picture, predicts what every nearby object will do for the next 8 seconds, and plans the car's trajectory — all in under 100 ms. Around a kilowatt of compute under the trunk floor.",
    waymo: "Dual-redundant compute with fail-operational design",
    tesla: "HW4 board, ~720 W — half the redundancy of an L4 stack",
    teslaOk: false,
  },
];

export default function SensorStack() {
  return (
    <div className="dl-panel dl-full dl-sensors">
      <div className="dl-panel-header">
        <h2 className="dl-panel-title">How a robotaxi sees the world</h2>
        <span className="dl-panel-subtitle">Six sensor layers — and what Waymo has that Tesla skips</span>
      </div>

      <p className="dl-sensors-lead">
        A modern L4 car runs perception through redundant, overlapping senses — each one covers what
        the others miss. Tesla's bet is that cameras alone are enough; everyone else stacks four
        sensor types on top of HD maps and dedicated compute. Here's what each layer is actually for.
      </p>

      <div className="dl-sensors-grid">
        {sensors.map((s) => (
          <article key={s.name} className="dl-sensor">
            <div className="dl-sensor-head">
              <span className="dl-sensor-emoji" aria-hidden>{s.emoji}</span>
              <div className="dl-sensor-head-text">
                <h3 className="dl-sensor-name">{s.name}</h3>
                <span className="dl-sensor-fullname">{s.fullName}</span>
              </div>
              <span className="dl-sensor-range">{s.range}</span>
            </div>
            <p className="dl-sensor-job">{s.job}</p>
            <div className="dl-sensor-compare">
              <div className="dl-sensor-row dl-sensor-row--waymo">
                <span className="dl-sensor-row-label">Waymo</span>
                <span className="dl-sensor-row-val">{s.waymo}</span>
              </div>
              <div className={`dl-sensor-row ${s.teslaOk ? "dl-sensor-row--ok" : "dl-sensor-row--skip"}`}>
                <span className="dl-sensor-row-label">Tesla</span>
                <span className="dl-sensor-row-val">{s.tesla}</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="dl-sensors-foot">
        The debate that matters: Tesla argues humans drive with two eyes, so cameras should be enough.
        L4 operators argue humans crash 40,000 times a year in the US, so "enough to match a human"
        isn't the bar — the bar is dramatically better, and that needs sensors humans don't have.
        Eight years into commercial driverless service, the LiDAR-heavy stacks are the ones logging
        the miles.
      </p>
    </div>
  );
}
