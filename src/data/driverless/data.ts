/* ── Driverless Dashboard — Static Data ─────────────────────────── */

// ── Types ──────────────────────────────────────────────────────────

export type RideAvailability = "available" | "invite-only" | "coming-soon";

export interface CityRideOption {
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
      { service: "Waymo One", availability: "available", howToBook: "Download the Waymo One app", note: "Full SF + Peninsula coverage" },
      { service: "Zoox", availability: "invite-only", howToBook: "Sign up at zoox.com/waitlist", note: "Custom bidirectional vehicle, limited pilot" },
    ],
  },
  {
    city: "Los Angeles",
    state: "CA",
    options: [
      { service: "Waymo One", availability: "available", howToBook: "Download the Waymo One app", note: "Santa Monica, West Hollywood, downtown LA" },
    ],
  },
  {
    city: "Phoenix",
    state: "AZ",
    options: [
      { service: "Waymo One", availability: "available", howToBook: "Download the Waymo One app", note: "Largest Waymo coverage area — Tempe, Chandler, Mesa" },
    ],
  },
  {
    city: "Austin",
    state: "TX",
    options: [
      { service: "Waymo One", availability: "available", howToBook: "Download the Waymo One app", note: "Launched late 2024" },
      { service: "Tesla Cybercab", availability: "invite-only", howToBook: "Request access via the Tesla app", note: "Paid unsupervised robotaxi pilot launched April 2026" },
    ],
  },
  {
    city: "Atlanta",
    state: "GA",
    options: [
      { service: "Waymo One", availability: "available", howToBook: "Download the Waymo One app", note: "Midtown, Buckhead, Airport area" },
    ],
  },
  {
    city: "Miami",
    state: "FL",
    options: [
      { service: "Waymo One", availability: "available", howToBook: "Download the Waymo One app", note: "Launched 2025" },
    ],
  },
  {
    city: "Las Vegas",
    state: "NV",
    options: [
      { service: "Zoox", availability: "invite-only", howToBook: "Sign up at zoox.com/waitlist", note: "Strip area pilot" },
    ],
  },
  {
    city: "Dallas",
    state: "TX",
    options: [
      { service: "Waymo One", availability: "coming-soon", howToBook: "Join waitlist at waymo.com", note: "Expected 2026" },
    ],
  },
  {
    city: "Nashville",
    state: "TN",
    options: [
      { service: "Waymo One", availability: "coming-soon", howToBook: "Join waitlist at waymo.com", note: "Announced 2025, launching 2026" },
    ],
  },
  {
    city: "Washington DC",
    state: "DC",
    options: [
      { service: "Waymo One", availability: "coming-soon", howToBook: "Join waitlist at waymo.com", note: "Expansion announced for 2026" },
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
  { label: "Rides / Week", value: "550K+", icon: "🚕" },
  { label: "Miles Driven", value: "200M+", icon: "🛣️" },
  { label: "Safer Than Human Drivers", value: "10x", icon: "🛡️" },
];

// ── Safety Comparison (Waymo peer-reviewed, 56.7M rider miles) ────

export const safetyData: SafetyMetric[] = [
  { category: "Serious Injury", humanRate: 100, waymoRate: 10, reduction: 90 },
  { category: "Major Crash", humanRate: 100, waymoRate: 18, reduction: 82 },
  { category: "Any Injury", humanRate: 100, waymoRate: 19, reduction: 81 },
  { category: "Pedestrian Injury", humanRate: 100, waymoRate: 8, reduction: 92 },
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
  { date: "Apr '26", ridesK: 550 },   // current
];

// ── Companies ──────────────────────────────────────────────────────

export const companies: Company[] = [
  {
    name: "Waymo",
    type: "Self-driving rides, no human driver",
    vehicles: 3000,
    cities: ["SF Bay Area", "Los Angeles", "Phoenix", "Austin", "Atlanta", "Miami"],
    status: "active",
    note: "500K rides/week, expanding to Dallas, Nashville, DC",
  },
  {
    name: "Zoox",
    type: "Self-driving rides, no human driver",
    vehicles: 50,
    cities: ["San Francisco", "Las Vegas"],
    status: "active",
    note: "Amazon-backed, fully custom vehicle (drives both directions)",
  },
  {
    name: "Aurora",
    type: "Self-driving semi trucks, no human driver",
    vehicles: 200,
    cities: ["Dallas \u2194 Houston", "Fort Worth \u2194 El Paso"],
    status: "active",
    note: "250K+ miles of commercial freight with zero incidents",
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
    name: "Tesla Cybercab",
    type: "Self-driving rides (limited pilot) + driver-assist fleet",
    vehicles: 2900000,
    cities: ["Austin (Cybercab pilot)"],
    status: "active",
    note: "Paid unsupervised Cybercab rides launched in Austin, Apr 2026 — broader fleet still requires a human at the wheel",
  },
];

// ── Disengagement Rates (CA DMV 2025 report) ──────────────────────

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
  { code: "TX", name: "Texas", legislation: "active", registeredVehicles: 23477492, avCount: 200 },
  { code: "FL", name: "Florida", legislation: "active", registeredVehicles: 19519552, avCount: 50 },
  { code: "GA", name: "Georgia", legislation: "active", registeredVehicles: 9437843, avCount: 100 },
  { code: "NV", name: "Nevada", legislation: "active", registeredVehicles: 2681539, avCount: 50 },
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
  { code: "TN", name: "Tennessee", legislation: "permitted", registeredVehicles: 6200000 },
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
