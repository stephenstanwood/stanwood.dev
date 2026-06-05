export interface CampbellMetric {
  label: string;
  value: string;
  note: string;
  sourceLabel: string;
  sourceUrl: string;
}

export interface CampbellMilestone {
  year: string;
  title: string;
  body: string;
  sourceLabel: string;
  sourceUrl: string;
}

export interface CampbellSource {
  label: string;
  owner: string;
  cadence: string;
  href: string;
  why: string;
}

export interface CampbellBusiness {
  name: string;
  category: string;
  address: string;
  area: string;
}

export interface CampbellRoadmapItem {
  title: string;
  body: string;
  status: "Live now" | "Next feed" | "Needs source";
}

export const SOURCE_URLS = {
  cityHistory: "https://www.campbellca.gov/238/History",
  censusQuickFacts: "https://www.census.gov/quickfacts/fact/table/campbellcitycalifornia/HSG445223",
  agendaCenter: "https://www.campbellca.gov/agendacenter",
  publicNotices: "https://www.campbellca.gov/501/Public-Notices",
  planningCommissionAgenda: "https://www.campbellca.gov/AgendaCenter/Planning-Commission-6",
  cityCalendar: "https://www.campbellca.gov/calendar.aspx",
  cityCalendarList: "https://www.campbellca.gov/calendar.aspx?view=list&CID=0",
  downtownEvents: "https://www.downtowncampbell.com/events",
  heritageTheatreEvents: "https://www.heritagetheatre.org/events-1",
  chamberEvents: "https://business.campbellchamber.net/events/calendar/",
  downtownDirectory: "https://www.downtowncampbell.com/directory/all",
  chamberShopping: "https://www.campbellchamber.net/shopping-dining/",
  cityBudget: "https://www.campbellca.gov/151/Budget",
  cityGisPublic: "https://gis.campbellca.gov/public",
  cityGis: "https://gis.campbellca.gov/arcgis/rest/services/",
  assessorSearch: "https://asr.santaclaracounty.gov/online-services/property-search/real-property",
  clerkRecorder: "https://clerkrecorder.santaclaracounty.gov/official-records",
  clerkRecorderRealEstate: "https://clerkrecorder.santaclaracounty.gov/recording-documents/recording-real-estate",
};

export const CAMPBELL_METRICS: CampbellMetric[] = [
  {
    label: "Population",
    value: "43,959",
    note: "Official 2020 Census count for Campbell city.",
    sourceLabel: "U.S. Census QuickFacts",
    sourceUrl: SOURCE_URLS.censusQuickFacts,
  },
  {
    label: "Median household income",
    value: "$147,128",
    note: "ACS 2019-2023, in 2023 dollars.",
    sourceLabel: "U.S. Census QuickFacts",
    sourceUrl: SOURCE_URLS.censusQuickFacts,
  },
  {
    label: "Owner-occupied home value",
    value: "$1.55M",
    note: "Median value, ACS 2019-2023.",
    sourceLabel: "U.S. Census QuickFacts",
    sourceUrl: SOURCE_URLS.censusQuickFacts,
  },
  {
    label: "Bachelor's or higher",
    value: "59.5%",
    note: "Residents age 25+, ACS 2019-2023.",
    sourceLabel: "U.S. Census QuickFacts",
    sourceUrl: SOURCE_URLS.censusQuickFacts,
  },
  {
    label: "Languages at home",
    value: "39.5%",
    note: "Age 5+ speaking a language other than English at home, ACS 2019-2023.",
    sourceLabel: "U.S. Census QuickFacts",
    sourceUrl: SOURCE_URLS.censusQuickFacts,
  },
  {
    label: "Incorporated",
    value: "1952",
    note: "Campbell became an official city in 1952.",
    sourceLabel: "City history",
    sourceUrl: SOURCE_URLS.cityHistory,
  },
];

export const CAMPBELL_HISTORY: CampbellMilestone[] = [
  {
    year: "1851",
    title: "Benjamin Campbell buys the land that becomes downtown",
    body: "Benjamin Campbell bought 160 acres and planted hay and grain. The City says that acreage later became Campbell's historical downtown core.",
    sourceLabel: "City history",
    sourceUrl: SOURCE_URLS.cityHistory,
  },
  {
    year: "Late 1800s",
    title: "A farming town turns into Orchard City",
    body: "Campbell's identity formed around orchards, packing, rail access, and a compact downtown. The next version should map the canneries, rail stops, and surviving historic buildings.",
    sourceLabel: "City history",
    sourceUrl: SOURCE_URLS.cityHistory,
  },
  {
    year: "1952",
    title: "Campbell incorporates",
    body: "Campbell officially incorporated as a city in 1952, after city offices had used places such as Fire House No. 1 and the old Congregational Church.",
    sourceLabel: "City history",
    sourceUrl: SOURCE_URLS.cityHistory,
  },
  {
    year: "Now",
    title: "A small city inside a complicated county",
    body: "Campbell is its own city, but many everyday systems are county, state, school district, VTA, utility, or private-provider responsibilities. This guide should make those lines visible.",
    sourceLabel: "Campbell source map",
    sourceUrl: SOURCE_URLS.agendaCenter,
  },
];

export const CIVIC_SOURCES: CampbellSource[] = [
  {
    label: "City Council agendas and minutes",
    owner: "City Clerk / CivicEngage",
    cadence: "Every meeting",
    href: SOURCE_URLS.agendaCenter,
    why: "Primary source for agendas, minutes, media links, boards, commissions, and prior-year archives.",
  },
  {
    label: "Public hearing notices",
    owner: "City Clerk / Planning Division",
    cadence: "When noticed",
    href: SOURCE_URLS.publicNotices,
    why: "Official legal notices for council hearings, planning projects, environmental review, historic preservation, and administrative decisions.",
  },
  {
    label: "Planning Commission agendas",
    owner: "Planning Division / CivicEngage",
    cadence: "Second and fourth Tuesday",
    href: SOURCE_URLS.planningCommissionAgenda,
    why: "Meeting dates, public-hearing items, staff reports, applicant requests, and project-file references.",
  },
  {
    label: "City event calendar",
    owner: "City of Campbell",
    cadence: "Rolling calendar",
    href: SOURCE_URLS.cityCalendar,
    why: "Official city meetings, recreation dates, public events, facilities, and event subscriptions.",
  },
  {
    label: "Budget and finance",
    owner: "City of Campbell",
    cadence: "Annual fiscal year",
    href: SOURCE_URLS.cityBudget,
    why: "Budget books, financial plans, and the clearest path into what services the city funds.",
  },
  {
    label: "GIS and map services",
    owner: "City of Campbell",
    cadence: "As layers update",
    href: SOURCE_URLS.cityGis,
    why: "Queryable map services for zoning, parcels, public assets, and location-specific overlays.",
  },
];

export const EVENT_SOURCES: CampbellSource[] = [
  {
    label: "City calendar",
    owner: "City of Campbell",
    cadence: "Rolling calendar",
    href: SOURCE_URLS.cityCalendarList,
    why: "Live source for city-run meetings, recreation programs, community center dates, pool notices, and Heritage Theatre listings.",
  },
  {
    label: "Downtown Campbell events",
    owner: "Downtown Campbell Business Association",
    cadence: "Rolling calendar",
    href: SOURCE_URLS.downtownEvents,
    why: "Farmers' market, festivals, shop events, museum events, and downtown nightlife.",
  },
  {
    label: "Heritage Theatre events",
    owner: "Campbell Heritage Theatre",
    cadence: "Rolling calendar",
    href: SOURCE_URLS.heritageTheatreEvents,
    why: "Direct theatre source for ticketed shows, dance programs, community performances, and venue-specific details.",
  },
  {
    label: "Chamber events",
    owner: "Campbell Chamber of Commerce",
    cadence: "Member calendar",
    href: SOURCE_URLS.chamberEvents,
    why: "Business mixers, ribbon cuttings, member events, and wider Campbell commerce activity beyond downtown.",
  },
];

export const REAL_ESTATE_SOURCES: CampbellSource[] = [
  {
    label: "Assessor real property search",
    owner: "Santa Clara County Assessor",
    cadence: "Assessment roll updates",
    href: SOURCE_URLS.assessorSearch,
    why: "Parcel, assessed value, APN, and tax-rate-area lookup by address or parcel.",
  },
  {
    label: "Official records",
    owner: "Santa Clara County Clerk-Recorder",
    cadence: "Recorded document stream",
    href: SOURCE_URLS.clerkRecorder,
    why: "Recorded deeds, liens, maps, and real-property document research.",
  },
  {
    label: "Recording real estate",
    owner: "Santa Clara County Clerk-Recorder",
    cadence: "When documents record",
    href: SOURCE_URLS.clerkRecorderRealEstate,
    why: "Rules for deeds, transfer tax, documents, copies, and in-person research limits.",
  },
];

export const BUSINESS_PREVIEW: CampbellBusiness[] = [
  { name: "7 Stars Bar & Grill", category: "Food and drink", address: "400 E Campbell Ave", area: "Downtown" },
  { name: "A Bellagio", category: "Food and drink", address: "33 S Central Ave", area: "Downtown" },
  { name: "ADOR", category: "Retail", address: "274 E Campbell Ave", area: "Downtown" },
  { name: "Ainsley House", category: "History", address: "300 Grant St", area: "Civic Center" },
  { name: "Art Beat Studio", category: "Arts", address: "68 E Campbell Ave", area: "Downtown" },
  { name: "Besties Boutique", category: "Retail", address: "401 E Campbell Ave", area: "Downtown" },
  { name: "Breaktime Tea", category: "Food and drink", address: "199 E Campbell Ave", area: "Downtown" },
  { name: "Campbell Creamery", category: "Dessert", address: "267 E Campbell Ave", area: "Downtown" },
  { name: "Campbell Historical Museum", category: "History", address: "51 N Central Ave", area: "Civic Center" },
  { name: "Cloud City Supply", category: "Retail", address: "325 E Campbell Ave", area: "Downtown" },
  { name: "Doppio Zero", category: "Food and drink", address: "220 E Campbell Ave", area: "Downtown" },
  { name: "Heroes Comics", category: "Books and comics", address: "24 E Campbell Ave", area: "Downtown" },
  { name: "Manresa Bread Cafe", category: "Bakery", address: "195 E Campbell Ave", area: "Downtown" },
  { name: "Naschmarkt", category: "Food and drink", address: "384 E Campbell Ave", area: "Downtown" },
  { name: "Orchard Valley Coffee", category: "Coffee", address: "349 E Campbell Ave", area: "Downtown" },
  { name: "Recycle Bookstore", category: "Books and comics", address: "275 E Campbell Ave", area: "Downtown" },
];

export const CAMPBELL_ROADMAP: CampbellRoadmapItem[] = [
  {
    title: "Council minutes vault",
    body: "Agenda, minutes, media, public-hearing notices, and first plain-English hearing summaries are live. Full packet text, vote outcomes, and topic search come next.",
    status: "Live now",
  },
  {
    title: "Downtown business index",
    body: "Full A-Z Downtown Campbell directory is synced. Category enrichment, direct websites, and open/closed checks come next.",
    status: "Live now",
  },
  {
    title: "Events firehose",
    body: "City calendar and Downtown Campbell events are synced, including Heritage Theatre listings exposed through the city feed. Direct theatre, Chamber, library, museum, school, and parks calendars come next.",
    status: "Live now",
  },
  {
    title: "Property and sales ledger",
    body: "Build a privacy-aware property ledger from assessor parcels, recorder documents, transfer-tax clues, permits, and map layers.",
    status: "Needs source",
  },
  {
    title: "History map",
    body: "Turn the timeline into a walking map with plaques, Ainsley House, Fire House No. 1, rail history, orchards, and old photos.",
    status: "Live now",
  },
  {
    title: "Neighborhood pages",
    body: "Split downtown, Pruneyard, San Tomas, Hamilton, Winchester, Campbell Village, parks, schools, and county pockets into local pages.",
    status: "Needs source",
  },
];
