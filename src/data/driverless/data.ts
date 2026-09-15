/* ── Driverless Dashboard — Static Data ─────────────────────────── */

// ── Types ──────────────────────────────────────────────────────────

export type RideAvailability = "available" | "invite-only" | "coming-soon";

interface CityRideOption {
  service: string;
  availability: RideAvailability;
  howToBook: string;
  note?: string;
}

export interface CityRideInfo {
  city: string;
  state: string;
  options: CityRideOption[];
}

// ── Ride Finder Data ──────────────────────────────────────────────

export const cityRideData: CityRideInfo[] = [
  {
    city: "San Francisco",
    state: "CA",
    options: [
      { service: "Waymo One", availability: "available", howToBook: "Download the Waymo One app", note: "Full Bay Area coverage, now including San Jose and SJC airport curbside" },
      { service: "Zoox", availability: "invite-only", howToBook: "Sign up at zoox.com", note: "Explorers program — east side of SF, Marina to the Embarcadero" },
    ],
  },
  {
    city: "Los Angeles",
    state: "CA",
    options: [
      { service: "Waymo One", availability: "available", howToBook: "Download the Waymo One app", note: "Santa Monica, West Hollywood, downtown LA" },
      { service: "Zoox", availability: "coming-soon", howToBook: "Sign up at zoox.com", note: "Testing ahead of a future launch" },
    ],
  },
  {
    city: "Phoenix",
    state: "AZ",
    options: [
      { service: "Waymo One", availability: "available", howToBook: "Download the Waymo One app", note: "Largest Waymo coverage area — Tempe, Chandler, Mesa, plus Sky Harbor curbside" },
    ],
  },
  {
    city: "Austin",
    state: "TX",
    options: [
      { service: "Waymo One", availability: "available", howToBook: "Book through the Uber app", note: "Waymo rides in Austin are dispatched by Uber" },
      { service: "Tesla Robotaxi", availability: "available", howToBook: "Download the Tesla Robotaxi app", note: "Unsupervised Model Ys, 6am–10pm daily" },
      { service: "Zoox", availability: "invite-only", howToBook: "Sign up at zoox.com", note: "Early rides for employees, friends, and family" },
    ],
  },
  {
    city: "Atlanta",
    state: "GA",
    options: [
      { service: "Waymo One", availability: "available", howToBook: "Book through the Uber app", note: "Midtown, Buckhead, Airport area" },
      { service: "Zoox", availability: "coming-soon", howToBook: "Sign up at zoox.com", note: "Announced, not yet carrying public riders" },
    ],
  },
  {
    city: "Miami",
    state: "FL",
    options: [
      { service: "Waymo One", availability: "available", howToBook: "Download the Waymo One app", note: "Public rides since January 2026" },
      { service: "Tesla Robotaxi", availability: "available", howToBook: "Download the Tesla Robotaxi app", note: "Unsupervised rides launched July 2026" },
      { service: "Zoox", availability: "invite-only", howToBook: "Sign up at zoox.com", note: "Early rides for employees, friends, and family" },
    ],
  },
  {
    city: "Dallas",
    state: "TX",
    options: [
      { service: "Waymo One", availability: "available", howToBook: "Download the Waymo One app", note: "Opened to every rider in August 2026" },
      { service: "Tesla Robotaxi", availability: "available", howToBook: "Download the Tesla Robotaxi app", note: "Unsupervised rides launched April 2026" },
    ],
  },
  {
    city: "Houston",
    state: "TX",
    options: [
      { service: "Waymo One", availability: "available", howToBook: "Download the Waymo One app", note: "Opened to every rider in August 2026" },
      { service: "Tesla Robotaxi", availability: "available", howToBook: "Download the Tesla Robotaxi app", note: "Unsupervised rides launched April 2026" },
    ],
  },
  {
    city: "San Antonio",
    state: "TX",
    options: [
      { service: "Waymo One", availability: "available", howToBook: "Download the Waymo One app", note: "Launched February 2026, with airport rides since March" },
    ],
  },
  {
    city: "Orlando",
    state: "FL",
    options: [
      { service: "Waymo One", availability: "available", howToBook: "Download the Waymo One app", note: "Launched February 2026" },
      { service: "Tesla Robotaxi", availability: "available", howToBook: "Download the Tesla Robotaxi app", note: "Unsupervised rides launched July 2026" },
    ],
  },
  {
    city: "Tampa",
    state: "FL",
    options: [
      { service: "Tesla Robotaxi", availability: "available", howToBook: "Download the Tesla Robotaxi app", note: "Unsupervised rides launched July 2026" },
      { service: "Waymo One", availability: "coming-soon", howToBook: "Join the waitlist at waymo.com", note: "Driverless operations began July 2026, employees first" },
    ],
  },
  {
    city: "Nashville",
    state: "TN",
    options: [
      { service: "Waymo One", availability: "available", howToBook: "Download the Waymo One app", note: "Opened to every rider in June 2026 — 60 square miles" },
    ],
  },
  {
    city: "Las Vegas",
    state: "NV",
    options: [
      { service: "Zoox", availability: "available", howToBook: "Download the Zoox app", note: "Paid rides on and around the Strip since August 2026" },
      { service: "Waymo One", availability: "coming-soon", howToBook: "Join the waitlist at waymo.com", note: "Driverless operations began July 2026, employees first" },
    ],
  },
  {
    city: "San Diego",
    state: "CA",
    options: [
      { service: "Waymo One", availability: "coming-soon", howToBook: "Join the waitlist at waymo.com", note: "Cleared to run driverless; about 40 square miles to start" },
    ],
  },
  {
    city: "Denver",
    state: "CO",
    options: [
      { service: "Waymo One", availability: "coming-soon", howToBook: "Join the waitlist at waymo.com", note: "Waymo's first real winter city — roughly 50 square miles downtown" },
    ],
  },
  {
    city: "Washington DC",
    state: "DC",
    options: [
      { service: "Waymo One", availability: "coming-soon", howToBook: "Join the waitlist at waymo.com", note: "Announced for 2026, still waiting on a DC driverless law" },
    ],
  },
];


export type LegislationStatus = "active" | "permitted" | "testing" | "none";

export interface StateData {
  code: string;
  name: string;
  legislation: LegislationStatus;
  registeredVehicles: number; // total
  avCount?: number;           // autonomous vehicles operating
  testMiles?: number;         // annual AV test miles
}

export interface SafetyMetric {
  category: string;
  humanRate: number;   // normalized baseline = 100
  waymoRate: number;   // as % of human
  reduction: number;   // e.g. 90 means "90% fewer"
}

export interface GrowthPoint {
  date: string;        // "Jan 2025" display format
  ridesK: number;      // rides per week in thousands
}

export interface Company {
  name: string;
  type: string;
  vehicles: number | null;
  cities: string[];
  status: "active" | "testing" | "shut-down" | "l2-only";
  note?: string;
}

export interface DisengagementEntry {
  company: string;
  milesPerDisengagement: number;
}

// ── Constants ──────────────────────────────────────────────────────

export const LEGISLATION_COLORS: Record<LegislationStatus, string> = {
  active: "#16a34a",
  permitted: "#3b82f6",
  testing: "#d97706",
  none: "#d4d4d8",
};

export const LEGISLATION_LABELS: Record<LegislationStatus, string> = {
  active: "Self-Driving Cars on the Road",
  permitted: "Laws Passed",
  testing: "Testing Only",
  none: "No Laws Yet",
};

// ── Hero Stats ─────────────────────────────────────────────────────

export const heroStats = [
  { label: "Self-Driving Cars", value: "4,500+", icon: "🚗" },
  { label: "Rides / Week", value: "500K+", icon: "🚕" },
  { label: "Miles Driven", value: "220M+", icon: "🛣️" },
  { label: "Safer Than Human Drivers", value: "10x", icon: "🛡️" },
];

// ── Safety Comparison (Waymo safety hub, 220.6M rider-only miles thru Mar 2026)

export const safetyData: SafetyMetric[] = [
  { category: "Serious Injury", humanRate: 100, waymoRate: 6, reduction: 94 },
  { category: "Major Crash", humanRate: 100, waymoRate: 18, reduction: 82 },
  { category: "Any Injury", humanRate: 100, waymoRate: 18, reduction: 82 },
  { category: "Pedestrian Injury", humanRate: 100, waymoRate: 7, reduction: 93 },
];

// ── Growth (Waymo rides/week, approximate monthly) ────────────────

export const growthData: GrowthPoint[] = [
  { date: "Dec '18", ridesK: 0 },    // Waymo One launches in Phoenix
  { date: "Jun '19", ridesK: 1 },
  { date: "Dec '19", ridesK: 2 },
  { date: "Jun '20", ridesK: 1 },     // COVID dip
  { date: "Dec '20", ridesK: 3 },
  { date: "Jun '21", ridesK: 5 },
  { date: "Dec '21", ridesK: 10 },
  { date: "Jun '22", ridesK: 15 },
  { date: "Dec '22", ridesK: 25 },
  { date: "Jun '23", ridesK: 50 },    // SF expansion
  { date: "Dec '23", ridesK: 80 },
  { date: "Jun '24", ridesK: 100 },   // LA launch
  { date: "Dec '24", ridesK: 130 },
  { date: "Mar '25", ridesK: 150 },
  { date: "Jun '25", ridesK: 210 },
  { date: "Sep '25", ridesK: 320 },
  { date: "Dec '25", ridesK: 400 },
  { date: "Mar '26", ridesK: 500 },
  { date: "Aug '26", ridesK: 500 },   // current — held flat since Q1 2026
];

// ── Companies ──────────────────────────────────────────────────────

export const companies: Company[] = [
  {
    name: "Waymo",
    type: "Self-driving rides, no human driver",
    vehicles: 3791,
    cities: ["SF Bay Area", "Los Angeles", "Phoenix", "Austin", "Atlanta", "Miami", "Dallas", "Houston", "San Antonio", "Orlando", "Nashville"],
    status: "active",
    note: "500K rides/week across 11 metros. Driving without a human in Denver, Las Vegas, San Diego, and Tampa ahead of public launches.",
  },
  {
    name: "Zoox",
    type: "Self-driving rides, no human driver",
    vehicles: 105,
    cities: ["Las Vegas", "San Francisco", "Austin", "Miami", "Atlanta", "Los Angeles"],
    status: "active",
    note: "Amazon-backed, fully custom vehicle (drives both directions). First robotaxi with no steering wheel cleared by NHTSA to charge fares — paid Las Vegas rides began August 2026.",
  },
  {
    name: "Aurora",
    type: "Self-driving semi trucks, no human driver",
    vehicles: 25,
    cities: ["Dallas \u2194 Houston", "Fort Worth \u2194 El Paso", "Fort Worth \u2194 Phoenix"],
    status: "active",
    note: "Nearly 440K driverless freight miles with no collisions blamed on the Aurora Driver. 10 commercial routes; aiming for 200 trucks by the end of 2026.",
  },
  {
    name: "Cruise",
    type: "Self-driving rides (was)",
    vehicles: null,
    cities: [],
    status: "shut-down",
    note: "Shut down by GM after incidents in San Francisco",
  },
  {
    name: "Tesla Robotaxi",
    type: "Self-driving rides (six metros) + driver-assist fleet",
    vehicles: 2900000,
    cities: ["Austin", "Dallas", "Houston", "Miami", "Orlando", "Tampa"],
    status: "active",
    note: "Unsupervised rides with nobody in the front seat now run in six metros, 6am–10pm daily. The wider Tesla fleet is still driver-assist that needs a human at the wheel.",
  },
];

// ── Disengagement Rates (CA DMV report for Dec 2024–Nov 2025, released Feb 2026)

export const disengagementData: DisengagementEntry[] = [
  { company: "Zoox", milesPerDisengagement: 60682 },
  { company: "Waymo", milesPerDisengagement: 19234 },
  { company: "Nuro", milesPerDisengagement: 646 },
  { company: "AutoX", milesPerDisengagement: 245 },
];

// ── State Data (all 50 + DC) ──────────────────────────────────────
// AV counts for active states; registeredVehicles from FHWA 2023

export const stateData: StateData[] = [
  // Commercial deployment active
  { code: "CA", name: "California", legislation: "active", registeredVehicles: 31057329, avCount: 2819, testMiles: 9000000 },
  { code: "AZ", name: "Arizona", legislation: "active", registeredVehicles: 6447062, avCount: 500 },
  { code: "TX", name: "Texas", legislation: "active", registeredVehicles: 23477492, avCount: 1400 },
  { code: "FL", name: "Florida", legislation: "active", registeredVehicles: 19519552, avCount: 50 },
  { code: "GA", name: "Georgia", legislation: "active", registeredVehicles: 9437843, avCount: 100 },
  { code: "NV", name: "Nevada", legislation: "active", registeredVehicles: 2681539, avCount: 50 },
  { code: "TN", name: "Tennessee", legislation: "active", registeredVehicles: 6200000 },
  // Legislation enacted / permitted
  { code: "AL", name: "Alabama", legislation: "permitted", registeredVehicles: 4900000 },
  { code: "AR", name: "Arkansas", legislation: "permitted", registeredVehicles: 2700000 },
  { code: "CO", name: "Colorado", legislation: "permitted", registeredVehicles: 5400000 },
  { code: "CT", name: "Connecticut", legislation: "permitted", registeredVehicles: 3100000 },
  { code: "IN", name: "Indiana", legislation: "permitted", registeredVehicles: 5900000 },
  { code: "IA", name: "Iowa", legislation: "permitted", registeredVehicles: 3400000 },
  { code: "KY", name: "Kentucky", legislation: "permitted", registeredVehicles: 3800000 },
  { code: "LA", name: "Louisiana", legislation: "permitted", registeredVehicles: 4200000 },
  { code: "MI", name: "Michigan", legislation: "permitted", registeredVehicles: 8300000 },
  { code: "MS", name: "Mississippi", legislation: "permitted", registeredVehicles: 2700000 },
  { code: "NE", name: "Nebraska", legislation: "permitted", registeredVehicles: 1900000 },
  { code: "NC", name: "North Carolina", legislation: "permitted", registeredVehicles: 8900000 },
  { code: "ND", name: "North Dakota", legislation: "permitted", registeredVehicles: 850000 },
  { code: "OH", name: "Ohio", legislation: "permitted", registeredVehicles: 10300000 },
  { code: "OK", name: "Oklahoma", legislation: "permitted", registeredVehicles: 3800000 },
  { code: "PA", name: "Pennsylvania", legislation: "permitted", registeredVehicles: 10800000 },
  { code: "SC", name: "South Carolina", legislation: "permitted", registeredVehicles: 4800000 },
  { code: "SD", name: "South Dakota", legislation: "permitted", registeredVehicles: 1000000 },
  { code: "UT", name: "Utah", legislation: "permitted", registeredVehicles: 2800000 },
  { code: "VA", name: "Virginia", legislation: "permitted", registeredVehicles: 7500000 },
  { code: "WI", name: "Wisconsin", legislation: "permitted", registeredVehicles: 5300000 },
  // Testing only / task force / executive order
  { code: "DC", name: "Washington DC", legislation: "testing", registeredVehicles: 310000 },
  { code: "HI", name: "Hawaii", legislation: "testing", registeredVehicles: 1100000 },
  { code: "ID", name: "Idaho", legislation: "testing", registeredVehicles: 1600000 },
  { code: "IL", name: "Illinois", legislation: "testing", registeredVehicles: 10400000 },
  { code: "MA", name: "Massachusetts", legislation: "testing", registeredVehicles: 5500000 },
  { code: "MN", name: "Minnesota", legislation: "testing", registeredVehicles: 5100000 },
  { code: "NJ", name: "New Jersey", legislation: "testing", registeredVehicles: 7300000 },
  { code: "NY", name: "New York", legislation: "testing", registeredVehicles: 11300000 },
  { code: "OR", name: "Oregon", legislation: "testing", registeredVehicles: 3700000 },
  { code: "WA", name: "Washington", legislation: "testing", registeredVehicles: 6600000 },
  { code: "NH", name: "New Hampshire", legislation: "testing", registeredVehicles: 1200000 },
  { code: "ME", name: "Maine", legislation: "testing", registeredVehicles: 1200000 },
  { code: "MD", name: "Maryland", legislation: "testing", registeredVehicles: 4900000 },
  // No AV legislation
  { code: "AK", name: "Alaska", legislation: "none", registeredVehicles: 750000 },
  { code: "DE", name: "Delaware", legislation: "none", registeredVehicles: 850000 },
  { code: "KS", name: "Kansas", legislation: "none", registeredVehicles: 2600000 },
  { code: "MO", name: "Missouri", legislation: "none", registeredVehicles: 5400000 },
  { code: "MT", name: "Montana", legislation: "none", registeredVehicles: 1200000 },
  { code: "NM", name: "New Mexico", legislation: "none", registeredVehicles: 1800000 },
  { code: "RI", name: "Rhode Island", legislation: "none", registeredVehicles: 820000 },
  { code: "VT", name: "Vermont", legislation: "none", registeredVehicles: 620000 },
  { code: "WV", name: "West Virginia", legislation: "none", registeredVehicles: 1500000 },
  { code: "WY", name: "Wyoming", legislation: "none", registeredVehicles: 700000 },
];
