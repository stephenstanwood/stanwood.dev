/** Availability checked against https://waymo.com/rides/ on 2026-10-09.
 * Safety figures: https://waymo.com/safety/impact/, through June 2026.
 * Scope is Waymo rider-only driving, not all autonomous vehicles. */
export const CHECKED = "October 9, 2026";
export const RIDE_CITIES = [
  { city: "Atlanta", state: "GA", uber: true },
  { city: "Austin", state: "TX", uber: true },
  { city: "Dallas", state: "TX" },
  { city: "Denver", state: "CO" },
  { city: "Houston", state: "TX" },
  { city: "Las Vegas", state: "NV" },
  { city: "Los Angeles", state: "CA" },
  { city: "Miami", state: "FL" },
  { city: "Nashville", state: "TN" },
  { city: "Orlando", state: "FL" },
  { city: "Phoenix", state: "AZ" },
  { city: "San Antonio", state: "TX" },
  { city: "San Diego", state: "CA" },
  { city: "San Francisco Bay Area", state: "CA" },
  { city: "Tampa", state: "FL" },
];
export const SAFETY = [
  { label: "Serious injury or worse", reduction: 95 },
  { label: "Airbag deployment", reduction: 82 },
  { label: "Any reported injury", reduction: 82 },
];
