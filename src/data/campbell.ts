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

export interface CampbellPropertyMetric {
  label: string;
  value: string;
  note: string;
  sourceLabel: string;
  sourceUrl: string;
}

export interface CampbellPropertyLayer {
  label: string;
  status: "Ready" | "Partial" | "Hard";
  body: string;
  sourceLabel: string;
  sourceUrl: string;
}

export interface CampbellSafetyMetric {
  label: string;
  value: string;
  note: string;
  sourceLabel: string;
  sourceUrl: string;
}

export interface CampbellSafetyLayer {
  label: string;
  status: "Live" | "Official" | "Action" | "Policy" | "Meeting";
  body: string;
  sourceLabel: string;
  sourceUrl: string;
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
  chamberDirectory: "https://business.campbellchamber.net/list",
  chamberShopping: "https://www.campbellchamber.net/shopping-dining/",
  policeDepartment: "https://www.campbellca.gov/162/Police",
  cpdStats: "https://www.campbellca.gov/1167/CPD-Statistics",
  cityProtect: "https://cityprotect.com/",
  reportCrime: "https://www.campbellca.gov/291/Contact-Us",
  policeTransparency: "https://www.campbellca.gov/1026/Transparency-Portal",
  ab481: "https://www.campbellca.gov/1264/Assembly-Bill-481---Military-Equipment-F",
  flockSafety: "https://www.campbellca.gov/1406/Flock-Safety",
  cityBudget: "https://www.campbellca.gov/151/Budget",
  cityGisPublic: "https://gis.campbellca.gov/public",
  cityGis: "https://gis.campbellca.gov/arcgis/rest/services/",
  assessorSearch: "https://asr.santaclaracounty.gov/online-services/property-search/real-property",
  assessorRecords: "https://www.sccassessor.org/index.php/online-services/property-search/searching-records-buying-maps",
  assessorAnnualReport: "https://www.sccassessor.org/forms-and-publications/annual-report/item/580-annual-report-2025-2026",
  clerkRecorder: "https://clerkrecorder.santaclaracounty.gov/official-records",
  clerkRecorderRealEstate: "https://clerkrecorder.santaclaracounty.gov/recording-documents/recording-real-estate",
  clerkRecorderDataSales: "https://clerkrecorder.santaclaracounty.gov/data-sales-subscription",
  countyGisData: "https://gis.santaclaracounty.gov/available-gis-map-data",
  countyPropertyProfile: "https://www.arcgis.com/home/item.html?id=a26ac88b18d7465baf1be31302706f1d",
  campbellBuilding: "https://www.campbellca.gov/1458/Building",
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
    cadence: "Live feed",
    href: SOURCE_URLS.cityCalendarList,
    why: "Live source for city-run meetings, recreation programs, community center dates, pool notices, and Heritage Theatre listings.",
  },
  {
    label: "Downtown Campbell events",
    owner: "Downtown Campbell Business Association",
    cadence: "Live feed",
    href: SOURCE_URLS.downtownEvents,
    why: "Farmers' market, festivals, shop events, museum events, and downtown nightlife.",
  },
  {
    label: "Heritage Theatre events",
    owner: "Campbell Heritage Theatre",
    cadence: "Next direct sync",
    href: SOURCE_URLS.heritageTheatreEvents,
    why: "Direct theatre source for ticketed shows, dance programs, community performances, and venue-specific details.",
  },
  {
    label: "Chamber events",
    owner: "Campbell Chamber of Commerce",
    cadence: "Next direct sync",
    href: SOURCE_URLS.chamberEvents,
    why: "Business mixers, ribbon cuttings, member events, and wider Campbell commerce activity beyond downtown.",
  },
  {
    label: "Campbell Library events",
    owner: "Santa Clara County Library District",
    cadence: "Next direct sync",
    href: "https://sccld.org/locations/campbell/",
    why: "Branch page exposes in-person Campbell Library events, storytimes, book clubs, workshops, and county library programs.",
  },
  {
    label: "Campbell Museums events",
    owner: "Campbell Museums / Ainsley House",
    cadence: "Next direct sync",
    href: "https://www.campbellmuseums.com/events-main",
    why: "Museum openings, Ainsley House programs, history events, fundraisers, and family programming.",
  },
  {
    label: "Recreation and parks",
    owner: "City Recreation and Community Services",
    cadence: "Next direct sync",
    href: "https://campbellca.gov/recreation",
    why: "Activity guide, classes, camps, aquatics, parks, community center programming, and department calendar items.",
  },
  {
    label: "The Pruneyard events",
    owner: "The Pruneyard",
    cadence: "Candidate source",
    href: "https://www.thepruneyard.net/events",
    why: "Shopping-center events, promotions, seasonal activations, and Bascom-side Campbell activity outside downtown.",
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
    label: "Assessor records and data",
    owner: "Santa Clara County Assessor",
    cadence: "By request / paid data",
    href: SOURCE_URLS.assessorRecords,
    why: "The official path for parcel maps, property characteristics, transfer date, recording date, document number, and indicated sales price fields.",
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
  {
    label: "County GIS parcel data",
    owner: "Santa Clara County GIS",
    cadence: "Annual parcel layer",
    href: SOURCE_URLS.countyGisData,
    why: "Downloadable parcel boundaries, air parcels, land parcels, and other map layers for citywide joins.",
  },
  {
    label: "Campbell building records",
    owner: "City of Campbell Building Division",
    cadence: "Permit lifecycle",
    href: SOURCE_URLS.campbellBuilding,
    why: "Permit status, permit map, construction records, inspections, code enforcement, and property-information links.",
  },
];

export const SAFETY_METRICS: CampbellSafetyMetric[] = [
  {
    label: "Calls for service",
    value: "31,691",
    note: "Campbell Police Department calls for service in 2023.",
    sourceLabel: "CPD Statistics",
    sourceUrl: SOURCE_URLS.cpdStats,
  },
  {
    label: "Use of force share",
    value: "0.14%",
    note: "Approximate share of 2023 calls involving use of force.",
    sourceLabel: "CPD Statistics",
    sourceUrl: SOURCE_URLS.cpdStats,
  },
  {
    label: "Crime map precision",
    value: "Block-level",
    note: "CityProtect generalizes data by block and omits some crime types to protect victims.",
    sourceLabel: "CPD Statistics",
    sourceUrl: SOURCE_URLS.cpdStats,
  },
  {
    label: "Reporting standard",
    value: "NIBRS",
    note: "CPD frames offenses by FBI NIBRS person, property, and society categories.",
    sourceLabel: "CPD Statistics",
    sourceUrl: SOURCE_URLS.cpdStats,
  },
];

export const SAFETY_LAYERS: CampbellSafetyLayer[] = [
  {
    label: "Official crime map",
    status: "Live",
    body: "Campbell points residents to CityProtect for the public crime map. The city says the data is regularly extracted from police records, generalized by block, and filtered for victim anonymity.",
    sourceLabel: "CityProtect via CPD",
    sourceUrl: SOURCE_URLS.cityProtect,
  },
  {
    label: "Crime statistics and annual reviews",
    status: "Official",
    body: "The CPD statistics page explains NIBRS categories and links the public map. The transparency portal also keeps annual reviews and department materials in one place.",
    sourceLabel: "CPD Statistics",
    sourceUrl: SOURCE_URLS.cpdStats,
  },
  {
    label: "Online crime reporting",
    status: "Action",
    body: "Campbell's reporting page explains when online reports are appropriate, when to call 911, and how temporary and official report numbers work.",
    sourceLabel: "Report a Crime",
    sourceUrl: SOURCE_URLS.reportCrime,
  },
  {
    label: "Transparency materials",
    status: "Policy",
    body: "Policies, training materials, ALPR/Flock links, drone links, and annual reports belong beside crime data so residents can inspect how policing systems are used.",
    sourceLabel: "Transparency Portal",
    sourceUrl: SOURCE_URLS.policeTransparency,
  },
  {
    label: "AB 481 public input",
    status: "Meeting",
    body: "The AB 481 page tracks public meetings, equipment policy, annual reporting, and resident feedback paths for military-equipment oversight.",
    sourceLabel: "AB 481",
    sourceUrl: SOURCE_URLS.ab481,
  },
];

export const SAFETY_SOURCES: CampbellSource[] = [
  {
    label: "CPD statistics",
    owner: "Campbell Police Department",
    cadence: "Annual / as posted",
    href: SOURCE_URLS.cpdStats,
    why: "Official definitions, call volume context, use-of-force context, and the bridge to CityProtect.",
  },
  {
    label: "CityProtect crime map",
    owner: "Campbell Police Department / Public Engines",
    cadence: "Regular extract",
    href: SOURCE_URLS.cityProtect,
    why: "The official public map for recent incidents, with block-level generalization and privacy filtering.",
  },
  {
    label: "Online crime reporting",
    owner: "Campbell Police Department",
    cadence: "Resident action",
    href: SOURCE_URLS.reportCrime,
    why: "Clear reporting criteria for non-emergency incidents, emergency instructions, and follow-up expectations.",
  },
  {
    label: "Transparency portal",
    owner: "Campbell Police Department",
    cadence: "As documents update",
    href: SOURCE_URLS.policeTransparency,
    why: "Policies, training documents, ALPR links, drone links, and year-in-review reports.",
  },
  {
    label: "AB 481 oversight",
    owner: "Campbell Police Department / City Council",
    cadence: "Annual report / public meetings",
    href: SOURCE_URLS.ab481,
    why: "Military-equipment policy, inventory, public meetings, and required reporting.",
  },
];

export const PROPERTY_METRICS: CampbellPropertyMetric[] = [
  {
    label: "Net secured assessed value",
    value: "$14.97B",
    note: "Campbell city, 2025 roll. This is assessed value, not market value.",
    sourceLabel: "Assessor Annual Report 2025-2026",
    sourceUrl: SOURCE_URLS.assessorAnnualReport,
  },
  {
    label: "Secured parcels",
    value: "12,381",
    note: "Campbell APN count in the 2025 city-by-property-type roll table.",
    sourceLabel: "Assessor Annual Report 2025-2026",
    sourceUrl: SOURCE_URLS.assessorAnnualReport,
  },
  {
    label: "Single-family and condo parcels",
    value: "10,575",
    note: "Largest Campbell property category in the Assessor's 2025 roll table.",
    sourceLabel: "Assessor Annual Report 2025-2026",
    sourceUrl: SOURCE_URLS.assessorAnnualReport,
  },
  {
    label: "Single-family and condo AV",
    value: "$9.86B",
    note: "Assessed value for Campbell single-family and condo housing on the 2025 roll.",
    sourceLabel: "Assessor Annual Report 2025-2026",
    sourceUrl: SOURCE_URLS.assessorAnnualReport,
  },
];

export const PROPERTY_LAYERS: CampbellPropertyLayer[] = [
  {
    label: "Parcel and assessed value lookup",
    status: "Ready",
    body: "Public lookup works address-by-address or APN-by-APN. Good first step for a property page, but not a bulk citywide sales feed by itself.",
    sourceLabel: "Assessor real property search",
    sourceUrl: SOURCE_URLS.assessorSearch,
  },
  {
    label: "Recorded documents",
    status: "Partial",
    body: "Recorder data can identify deeds, liens, maps, and document references. The Clerk-Recorder says its office has document index data, not a ready sales-price database.",
    sourceLabel: "Clerk-Recorder data sales",
    sourceUrl: SOURCE_URLS.clerkRecorderDataSales,
  },
  {
    label: "Indicated sale price and transfer fields",
    status: "Hard",
    body: "The Assessor data path is the likely official source for transfer dates, recording dates, document numbers, and indicated sales price. That probably means a data request or paid file before we publish a true ledger.",
    sourceLabel: "Assessor records and data",
    sourceUrl: SOURCE_URLS.assessorRecords,
  },
  {
    label: "Parcel geometry",
    status: "Ready",
    body: "County GIS publishes parcel layers for mapping and spatial joins. That makes neighborhood rollups and zoning overlays feasible without scraping individual search pages.",
    sourceLabel: "County GIS map data",
    sourceUrl: SOURCE_URLS.countyGisData,
  },
  {
    label: "Building permits and construction context",
    status: "Partial",
    body: "Campbell points residents to MGO, permit status, permit maps, inspections, and building records. It is the bridge between a sale, a remodel, and a public hearing.",
    sourceLabel: "Campbell Building",
    sourceUrl: SOURCE_URLS.campbellBuilding,
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
    body: "Downtown Campbell and Campbell-address Chamber members are synced into one index. Category enrichment, shopping-center coverage, direct websites, and open/closed checks come next.",
    status: "Live now",
  },
  {
    title: "Events firehose",
    body: "City calendar and Downtown Campbell events are synced, including Heritage Theatre listings exposed through the city feed. Direct theatre, Chamber, library, museum, school, parks, and individual business calendars come next.",
    status: "Live now",
  },
  {
    title: "Safety and crime reports",
    body: "Official CPD stats, CityProtect map guidance, online reporting, transparency sources, and privacy boundaries are live. Next pass should add annual-report extraction, neighborhood rollups, call-for-service context, and public-safety meeting notices.",
    status: "Live now",
  },
  {
    title: "Property and sales ledger",
    body: "Official source map and Campbell roll metrics are live. A complete sales ledger likely needs Assessor data files or a records request before it can be honest and complete.",
    status: "Next feed",
  },
  {
    title: "Individual-source crawl map",
    body: "Build a registry of every Campbell-relevant calendar and directory, then add polite source-specific syncs for libraries, museums, schools, venues, shopping centers, neighborhood groups, and high-signal business sites.",
    status: "Next feed",
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
