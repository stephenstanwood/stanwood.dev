// ---------------------------------------------------------------------------
// South Bay Signal — curated recurring events data
// ---------------------------------------------------------------------------
// All events are verified public events. Recurring = weekly/monthly.
// One-off and ticketed events are noted. Seasonal events include months.
// ---------------------------------------------------------------------------

import type { City } from "../../lib/south-bay/types";

export type EventCategory =
  | "market"
  | "family"
  | "music"
  | "arts"
  | "sports"
  | "community"
  | "outdoor"
  | "education"
  | "food";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type RecurrenceType = "weekly" | "biweekly" | "monthly" | "seasonal" | "ongoing";

export interface SBEvent {
  id: string;
  title: string;
  city: City;
  venue: string;
  address?: string;
  category: EventCategory;
  recurrence: RecurrenceType;
  days?: DayOfWeek[];
  time?: string;
  months?: number[]; // 1=Jan, 12=Dec. omit = year-round
  cost: "free" | "low" | "paid"; // free=0, low=<$15, paid=$15+
  costNote?: string;
  kidFriendly: boolean;
  description: string;
  url?: string;
  emoji: string;
  featured?: boolean;
}

export const SOUTH_BAY_EVENTS: SBEvent[] = [
  // ── FARMERS MARKETS ──────────────────────────────────────────────────────

  {
    id: "campbell-farmers-market",
    title: "Campbell Farmers Market",
    city: "campbell",
    venue: "Downtown Campbell",
    address: "Campbell Ave & Central Ave, Campbell",
    category: "market",
    recurrence: "weekly",
    days: ["sunday"],
    time: "9am – 1pm",
    cost: "free",
    kidFriendly: true,
    description:
      "Year-round downtown market with 70+ vendors. Produce, flowers, honey, specialty foods, and artisan goods. Live music most weeks.",
    url: "https://www.campbellfarmersmarket.com",
    emoji: "🌽",
    featured: true,
  },
  {
    id: "mv-castro-farmers-market",
    title: "Mountain View Farmers Market",
    city: "mountain-view",
    venue: "Castro Street",
    address: "Castro St, Mountain View",
    category: "market",
    recurrence: "weekly",
    days: ["sunday"],
    time: "9am – 1pm",
    cost: "free",
    kidFriendly: true,
    description:
      "Beloved year-round market on Castro Street. 60+ vendors covering fresh produce, baked goods, artisan cheese, flowers, and prepared foods.",
    url: "https://www.pcfma.org/mountainview",
    emoji: "🌸",
    featured: true,
  },
  {
    id: "sunnyvale-murphy-market",
    title: "Sunnyvale Farmers Market",
    city: "sunnyvale",
    venue: "Murphy Ave",
    address: "Murphy Ave, Sunnyvale",
    category: "market",
    recurrence: "weekly",
    days: ["saturday"],
    time: "9am – 1pm",
    cost: "free",
    kidFriendly: true,
    description:
      "Weekly market on charming Murphy Ave in downtown Sunnyvale. Local produce, artisan foods, fresh flowers.",
    url: "https://sunnyvale.ca.gov/community/recreation-parks-and-cultural-services/special-events/sunnyvale-farmers-market",
    emoji: "🥦",
  },
  {
    id: "palo-alto-california-ave-market",
    title: "Palo Alto Farmers Market – California Ave",
    city: "palo-alto",
    venue: "California Ave",
    address: "California Ave, Palo Alto",
    category: "market",
    recurrence: "weekly",
    days: ["saturday"],
    time: "8am – 12pm",
    cost: "free",
    kidFriendly: true,
    description:
      "Year-round Saturday market on California Avenue. Over 50 vendors with organic produce, specialty goods, and local artisans.",
    url: "https://www.pcfma.org/paloaltocaliforniaavenue",
    emoji: "🥕",
  },
  {
    id: "palo-alto-downtown-market",
    title: "Palo Alto Farmers Market – Downtown",
    city: "palo-alto",
    venue: "Gilman St",
    address: "Gilman St & Hamilton Ave, Palo Alto",
    category: "market",
    recurrence: "weekly",
    days: ["saturday"],
    time: "8am – 12pm",
    months: [5, 6, 7, 8, 9, 10], // seasonal: May-Oct
    cost: "free",
    kidFriendly: true,
    description: "Seasonal downtown Palo Alto market. Late spring through fall.",
    url: "https://www.pcfma.org/paloalto",
    emoji: "🍑",
  },
  {
    id: "los-gatos-farmers-market",
    title: "Los Gatos Farmers Market",
    city: "los-gatos",
    venue: "Los Gatos Community Center",
    address: "East Main Ave, Los Gatos",
    category: "market",
    recurrence: "weekly",
    days: ["sunday"],
    time: "8am – 12pm",
    cost: "free",
    kidFriendly: true,
    description:
      "Charming Sunday market in Los Gatos. Fresh produce, specialty foods, and artisan items.",
    url: "https://www.pcfma.org/losgatos",
    emoji: "🍓",
  },
  {
    id: "saratoga-village-market",
    title: "Saratoga Village Farmers Market",
    city: "saratoga",
    venue: "Blaney Plaza",
    address: "Big Basin Way, Saratoga",
    category: "market",
    recurrence: "weekly",
    days: ["thursday"],
    time: "2:30 – 6:30pm",
    months: [5, 6, 7, 8, 9, 10],
    cost: "free",
    kidFriendly: true,
    description:
      "Seasonal evening market in Saratoga Village, late May through October. Local produce and artisan vendors in a beautiful historic setting.",
    emoji: "🌼",
  },
  {
    id: "milpitas-market",
    title: "Milpitas Farmers Market",
    city: "milpitas",
    venue: "Milpitas Square",
    category: "market",
    recurrence: "weekly",
    days: ["saturday"],
    time: "9am – 1pm",
    cost: "free",
    kidFriendly: true,
    description: "Weekend market with fresh produce and vendors.",
    emoji: "🥬",
  },
  {
    id: "sj-willow-glen-market",
    title: "Willow Glen Farmers Market",
    city: "san-jose",
    venue: "Lincoln Ave, Willow Glen",
    address: "Lincoln Ave, San Jose",
    category: "market",
    recurrence: "weekly",
    days: ["sunday"],
    time: "9am – 1pm",
    cost: "free",
    kidFriendly: true,
    description:
      "Year-round Sunday market in the heart of Willow Glen. Popular neighborhood destination with 40+ vendors.",
    emoji: "🌿",
  },
  {
    id: "sj-downtown-market",
    title: "Downtown San Jose Farmers Market",
    city: "san-jose",
    venue: "San Pedro Square",
    address: "San Pedro Square, San Jose",
    category: "market",
    recurrence: "weekly",
    days: ["friday"],
    time: "10am – 2pm",
    cost: "free",
    kidFriendly: true,
    description: "Weekly downtown SJ market. Convenient for the lunch crowd — fresh food, produce, and prepared meals.",
    emoji: "🏙️",
  },

  // ── FAMILY / KIDS ────────────────────────────────────────────────────────

  {
    id: "chdm-sj",
    title: "Children's Discovery Museum",
    city: "san-jose",
    venue: "Children's Discovery Museum of San Jose",
    address: "180 Woz Way, San Jose",
    category: "family",
    recurrence: "ongoing",
    cost: "low",
    costNote: "~$15 adults, children free under 1",
    kidFriendly: true,
    description:
      "One of the best children's museums in the Bay Area. Hands-on exhibits on science, art, and the world. Great for toddlers through age 10.",
    url: "https://www.cdm.org",
    emoji: "🔬",
    featured: true,
  },
  {
    id: "tech-museum-sj",
    title: "The Tech Interactive",
    city: "san-jose",
    venue: "The Tech Interactive",
    address: "201 S Market St, San Jose",
    category: "family",
    recurrence: "ongoing",
    cost: "paid",
    costNote: "~$29 adults, ~$24 youth",
    kidFriendly: true,
    description:
      "Silicon Valley's science and technology museum. IMAX dome theater, hands-on innovation exhibits, and design challenges.",
    url: "https://www.thetech.org",
    emoji: "💻",
    featured: true,
  },
  {
    id: "computer-history-museum",
    title: "Computer History Museum",
    city: "mountain-view",
    venue: "Computer History Museum",
    address: "1401 N Shoreline Blvd, Mountain View",
    category: "family",
    recurrence: "ongoing",
    cost: "low",
    costNote: "~$19 adults, under 12 free",
    kidFriendly: true,
    description:
      "The world's largest collection of computing history. Interactive exhibits trace 2,000 years of computing — a must for tech families.",
    url: "https://computerhistory.org",
    emoji: "🖥️",
    featured: true,
  },
  {
    id: "hakone-gardens",
    title: "Hakone Estate & Gardens",
    city: "saratoga",
    venue: "Hakone Estate & Gardens",
    address: "21000 Big Basin Way, Saratoga",
    category: "outdoor",
    recurrence: "ongoing",
    cost: "low",
    costNote: "$10 per car weekdays, $15 weekends",
    kidFriendly: true,
    description:
      "Oldest Japanese-style estate garden in the Western Hemisphere. Stunning 18-acre gardens with koi ponds, bamboo groves, and traditional architecture.",
    url: "https://hakone.com",
    emoji: "🌸",
  },
  {
    id: "campbell-library-storytimes",
    title: "Campbell Library Story Times",
    city: "campbell",
    venue: "Campbell Library",
    address: "77 Harrison Ave, Campbell",
    category: "family",
    recurrence: "weekly",
    days: ["tuesday", "wednesday", "thursday"],
    time: "10:30am",
    cost: "free",
    kidFriendly: true,
    description: "Free story times for babies, toddlers, and preschoolers. No registration required. Check the library calendar for specific times.",
    url: "https://www.sccl.org/campbell",
    emoji: "📚",
  },
  {
    id: "sj-public-library-programs",
    title: "San Jose Public Library Programs",
    city: "san-jose",
    venue: "Various branches",
    category: "family",
    recurrence: "weekly",
    cost: "free",
    kidFriendly: true,
    description:
      "San Jose's 25 branch libraries run hundreds of free programs: story times, STEM workshops, teen gaming nights, crafts, and more. Check the library calendar.",
    url: "https://www.sjpl.org/events",
    emoji: "📖",
  },
  {
    id: "mv-city-library",
    title: "Mountain View City Library Events",
    city: "mountain-view",
    venue: "Mountain View Public Library",
    address: "585 Franklin St, Mountain View",
    category: "family",
    recurrence: "weekly",
    cost: "free",
    kidFriendly: true,
    description: "Free programs including story times, maker workshops, language learning groups, and more.",
    url: "https://www.mountainview.gov/library",
    emoji: "📚",
  },

  // ── ARTS & CULTURE ────────────────────────────────────────────────────────

  {
    id: "sj-museum-of-art",
    title: "San Jose Museum of Art",
    city: "san-jose",
    venue: "San Jose Museum of Art",
    address: "110 S Market St, San Jose",
    category: "arts",
    recurrence: "ongoing",
    cost: "low",
    costNote: "$15 general, free 3rd Fri evenings",
    kidFriendly: true,
    description:
      "Downtown San Jose's art hub. Modern and contemporary art exhibitions, free 3rd-Friday evening events, and family programming.",
    url: "https://sjmusart.org",
    emoji: "🎨",
    featured: true,
  },
  {
    id: "montalvo-arts",
    title: "Montalvo Arts Center",
    city: "saratoga",
    venue: "Montalvo Arts Center",
    address: "15400 Montalvo Rd, Saratoga",
    category: "arts",
    recurrence: "ongoing",
    cost: "low",
    costNote: "Grounds free; performances ticketed",
    kidFriendly: true,
    description:
      "Historic 175-acre estate and arts center in the Saratoga hills. Free to walk the grounds. Live music, theater, art exhibitions, and residencies throughout the year.",
    url: "https://montalvoarts.org",
    emoji: "🎭",
    featured: true,
  },
  {
    id: "stanford-bing-hall",
    title: "Stanford Bing Concert Hall",
    city: "palo-alto",
    venue: "Bing Concert Hall, Stanford",
    address: "327 Lasuen St, Stanford",
    category: "music",
    recurrence: "ongoing",
    cost: "paid",
    costNote: "Varies by show; some free events",
    kidFriendly: false,
    description:
      "One of the finest acoustic concert halls on the West Coast. Stanford Live presents world-class classical, jazz, world music, and contemporary artists throughout the year.",
    url: "https://live.stanford.edu",
    emoji: "🎼",
    featured: true,
  },
  {
    id: "hammer-theater",
    title: "Hammer Theatre Center",
    city: "san-jose",
    venue: "Hammer Theatre Center",
    address: "101 Paseo De San Antonio, San Jose",
    category: "arts",
    recurrence: "ongoing",
    cost: "paid",
    costNote: "Ticketed; prices vary",
    kidFriendly: false,
    description:
      "Downtown San Jose's performing arts hub. Comedy, dance, theater, film, and music. Intimate 530-seat venue affiliated with San Jose State.",
    url: "https://www.hammertheatre.com",
    emoji: "🎭",
  },
  {
    id: "stanford-lathrop-gallery",
    title: "Cantor Arts Center (Stanford)",
    city: "palo-alto",
    venue: "Iris & B. Gerald Cantor Center for Visual Arts",
    address: "328 Lomita Dr, Stanford",
    category: "arts",
    recurrence: "ongoing",
    cost: "free",
    kidFriendly: true,
    description:
      "Stanford's major art museum. Free admission always. Rodin sculptures, global collections, and rotating exhibitions.",
    url: "https://museum.stanford.edu",
    emoji: "🏛️",
  },
  {
    id: "sj-jazz",
    title: "SFJAZZ Events at SJ",
    city: "san-jose",
    venue: "Various San Jose venues",
    category: "music",
    recurrence: "ongoing",
    cost: "paid",
    costNote: "Varies",
    kidFriendly: false,
    description: "Jazz performances and events across San Jose. SFJAZZ regularly brings touring artists to South Bay venues.",
    url: "https://www.sfjazz.org",
    emoji: "🎷",
  },

  // ── OUTDOOR / PARKS ───────────────────────────────────────────────────────

  {
    id: "vasona-lake",
    title: "Vasona Lake County Park",
    city: "los-gatos",
    venue: "Vasona Lake County Park",
    address: "298 Garden Hill Dr, Los Gatos",
    category: "outdoor",
    recurrence: "ongoing",
    cost: "free",
    costNote: "$6 parking on weekends",
    kidFriendly: true,
    description:
      "A top South Bay family park destination. Beautiful lake, Billy Jones Wildcat Railroad (train rides for kids), picnic areas, paddleboats, and grassy fields.",
    url: "https://www.sccgov.org/parks/vasona",
    emoji: "🌊",
    featured: true,
  },
  {
    id: "alum-rock-park",
    title: "Alum Rock Park",
    city: "san-jose",
    venue: "Alum Rock Park",
    address: "15350 Penitencia Creek Rd, San Jose",
    category: "outdoor",
    recurrence: "ongoing",
    cost: "free",
    kidFriendly: true,
    description:
      "San Jose's oldest park — over 700 acres of trails, mineral springs, and canyon views. Great hiking and mountain biking.",
    url: "https://www.sanjoseca.gov/almrck",
    emoji: "🥾",
  },
  {
    id: "los-gatos-creek-trail",
    title: "Los Gatos Creek Trail",
    city: "campbell",
    venue: "Los Gatos Creek Trail",
    category: "outdoor",
    recurrence: "ongoing",
    cost: "free",
    kidFriendly: true,
    description:
      "Paved multi-use trail running 9 miles from downtown Campbell to Vasona Lake. Perfect for biking, running, and walking.",
    emoji: "🚴",
  },
  {
    id: "shoreline-park-mv",
    title: "Shoreline at Mountain View",
    city: "mountain-view",
    venue: "Shoreline Park",
    address: "3070 N Shoreline Blvd, Mountain View",
    category: "outdoor",
    recurrence: "ongoing",
    cost: "free",
    costNote: "Golf and other activities are paid",
    kidFriendly: true,
    description:
      "700-acre park and Shoreline Amphitheatre complex with a lake, trails, kite flying, and seasonal summer concerts.",
    url: "https://www.mountainview.gov/shoreline",
    emoji: "🪁",
  },
  {
    id: "rancho-san-antonio",
    title: "Rancho San Antonio Open Space",
    city: "cupertino",
    venue: "Rancho San Antonio County Park",
    address: "Rancho San Antonio, Cupertino",
    category: "outdoor",
    recurrence: "ongoing",
    cost: "free",
    costNote: "$6 parking",
    kidFriendly: true,
    description:
      "One of the most popular open space areas in the Bay Area. 23+ miles of trails, deer, working farm at Deer Hollow. Get there early on weekends.",
    url: "https://www.openspace.org/preserves/rancho-san-antonio",
    emoji: "🦌",
    featured: true,
  },

  // ── COMMUNITY / RECURRING ────────────────────────────────────────────────

  {
    id: "campbell-friday-music",
    title: "Campbell Downtown Live Music",
    city: "campbell",
    venue: "Downtown Campbell",
    category: "music",
    recurrence: "weekly",
    days: ["friday"],
    time: "6pm",
    months: [6, 7, 8, 9], // summer series
    cost: "free",
    kidFriendly: true,
    description:
      "Summer Friday night concerts in downtown Campbell. Live bands, food and drinks from nearby restaurants. Family-friendly atmosphere.",
    emoji: "🎸",
  },
  {
    id: "mv-free-concert-series",
    title: "Mountain View Free Summer Concerts",
    city: "mountain-view",
    venue: "Civic Center Plaza",
    category: "music",
    recurrence: "weekly",
    months: [7, 8],
    cost: "free",
    kidFriendly: true,
    description: "Free outdoor concerts in downtown Mountain View during July and August.",
    emoji: "🎵",
  },
  {
    id: "sj-downtown-ice-rink",
    title: "Downtown San Jose Ice Rink",
    city: "san-jose",
    venue: "Rotary International Ice Rink",
    category: "family",
    recurrence: "seasonal",
    months: [11, 12, 1],
    cost: "low",
    costNote: "~$12 admission + skate rental",
    kidFriendly: true,
    description: "Outdoor holiday ice rink in downtown San Jose's Plaza de César Chávez. Nov–Jan season.",
    emoji: "⛸️",
  },

  // ── SPORTS VENUES ─────────────────────────────────────────────────────────

  {
    id: "sharks-home-games",
    title: "San Jose Sharks – Home Games",
    city: "san-jose",
    venue: "SAP Center",
    address: "525 W Santa Clara St, San Jose",
    category: "sports",
    recurrence: "seasonal",
    months: [10, 11, 12, 1, 2, 3, 4, 5, 6],
    cost: "paid",
    costNote: "Tickets from ~$35",
    kidFriendly: true,
    description:
      "NHL hockey at SAP Center. The Sharks play 40+ home games per season, Oct–Apr (with playoff potential extending into Jun). Great atmosphere for family outings.",
    url: "https://www.nhl.com/sharks/schedule",
    emoji: "🦈",
    featured: true,
  },
  {
    id: "earthquakes-home-games",
    title: "San Jose Earthquakes – Home Games",
    city: "san-jose",
    venue: "PayPal Park",
    address: "1123 Coleman Ave, San Jose",
    category: "sports",
    recurrence: "seasonal",
    months: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    cost: "paid",
    costNote: "Tickets from ~$25",
    kidFriendly: true,
    description:
      "MLS soccer at PayPal Park in the Guadalupe neighborhood. The Quakes play Feb–Nov. One of the most family-friendly and affordable pro sports experiences in the Bay.",
    url: "https://www.sjearthquakes.com/schedule",
    emoji: "⚽",
  },
  {
    id: "sj-giants-milb",
    title: "San Jose Giants – Home Games",
    city: "san-jose",
    venue: "PayPal Park",
    address: "588 E Alma Ave, San Jose",
    category: "sports",
    recurrence: "seasonal",
    months: [4, 5, 6, 7, 8, 9],
    cost: "low",
    costNote: "Tickets from ~$12 – great family deal",
    kidFriendly: true,
    description:
      "Minor League Baseball's SF Giants affiliate. Apr–Sep season at Excite Ballpark. Affordable, fun, and a great way to see tomorrow's MLB stars up close.",
    url: "https://www.milb.com/san-jose",
    emoji: "⚾",
    featured: true,
  },

  // ── STANFORD EVENTS ─────────────────────────────────────────────────────

  {
    id: "stanford-athletics",
    title: "Stanford Athletics",
    city: "palo-alto",
    venue: "Stanford University",
    category: "sports",
    recurrence: "ongoing",
    cost: "free",
    costNote: "Most events free; football ticketed",
    kidFriendly: true,
    description:
      "Stanford fields 36 varsity sports. Many are free to attend — basketball, volleyball, soccer, swimming, tennis, and more. Check the athletic calendar.",
    url: "https://gostanford.com/calendar",
    emoji: "🏟️",
  },
  {
    id: "stanford-free-talks",
    title: "Stanford Free Public Lectures",
    city: "palo-alto",
    venue: "Stanford University",
    category: "education",
    recurrence: "ongoing",
    cost: "free",
    kidFriendly: false,
    description:
      "Stanford hosts hundreds of free public lectures, panels, and symposia each year. Topics span medicine, AI, law, environment, and more.",
    url: "https://events.stanford.edu",
    emoji: "🎓",
    featured: true,
  },
  {
    id: "stanford-dish-hike",
    title: "The Dish at Stanford",
    city: "palo-alto",
    venue: "Stanford Dish Trail",
    category: "outdoor",
    recurrence: "ongoing",
    cost: "free",
    kidFriendly: true,
    description:
      "Stanford's iconic open space preserve with a 3.7-mile loop hike past the massive radio dish. Panoramic Bay Area views. Free and open to the public.",
    url: "https://lbre.stanford.edu/sites/special-areas/stanford-dish",
    emoji: "📡",
  },

  // ── FOOD & DRINK ─────────────────────────────────────────────────────────

  {
    id: "santana-row-dining",
    title: "Santana Row",
    city: "san-jose",
    venue: "Santana Row",
    address: "Santana Row, San Jose",
    category: "food",
    recurrence: "ongoing",
    cost: "paid",
    kidFriendly: true,
    description:
      "San Jose's upscale outdoor shopping and dining district. 30+ restaurants, shops, and a lively weekend atmosphere with outdoor seating and occasional live events.",
    url: "https://santanarow.com",
    emoji: "🍽️",
  },
  {
    id: "san-pedro-square-market",
    title: "San Pedro Square Market",
    city: "san-jose",
    venue: "San Pedro Square Market",
    address: "87 N San Pedro St, San Jose",
    category: "food",
    recurrence: "ongoing",
    cost: "low",
    kidFriendly: true,
    description:
      "Downtown San Jose's food hall. Craft beer, local food vendors, and outdoor seating. Often hosts live music on weekends.",
    url: "https://www.sanpedrosquaremarket.com",
    emoji: "🍺",
  },
  {
    id: "campbell-downtown-dining",
    title: "Downtown Campbell Dining",
    city: "campbell",
    venue: "Downtown Campbell",
    address: "E Campbell Ave, Campbell",
    category: "food",
    recurrence: "ongoing",
    cost: "low",
    kidFriendly: true,
    description:
      "Campbell's walkable downtown strip has excellent restaurants, coffee shops, and bars. Great for a weekend evening out.",
    emoji: "🌮",
  },
];

// ── Derived helpers ──────────────────────────────────────────────────────────

export const EVENT_CATEGORIES: { id: EventCategory | "all"; label: string; emoji: string }[] = [
  { id: "all",       label: "All",       emoji: "✨" },
  { id: "market",    label: "Markets",   emoji: "🌽" },
  { id: "family",    label: "Family",    emoji: "👨‍👩‍👧" },
  { id: "outdoor",   label: "Outdoors",  emoji: "🌲" },
  { id: "music",     label: "Music",     emoji: "🎵" },
  { id: "arts",      label: "Arts",      emoji: "🎨" },
  { id: "sports",    label: "Sports",    emoji: "🏟️" },
  { id: "education", label: "Education", emoji: "🎓" },
  { id: "food",      label: "Food",      emoji: "🍽️" },
  { id: "community", label: "Community", emoji: "🤝" },
];

export function getEventsForCity(
  city: City | "all",
  category: EventCategory | "all",
  currentMonth?: number,
): SBEvent[] {
  const month = currentMonth ?? new Date().getMonth() + 1;

  return SOUTH_BAY_EVENTS.filter((e) => {
    if (city !== "all" && e.city !== city) return false;
    if (category !== "all" && e.category !== category) return false;
    if (e.months && !e.months.includes(month)) return false;
    return true;
  });
}
