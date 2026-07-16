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
  image?: {
    src: string;
    alt: string;
  };
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

export const SOURCE_URLS = {
  cityHistory: "https://www.campbellca.gov/238/History",
  wikipediaCampbell: "https://en.wikipedia.org/wiki/Campbell,_California",
  wikipediaVtaLightRail: "https://en.wikipedia.org/wiki/VTA_light_rail",
  pruneyardCase: "https://www.law.cornell.edu/supremecourt/text/447/74",
  censusQuickFacts: "https://www.census.gov/quickfacts/fact/table/campbellcitycalifornia/HSG445223",
  // Council agendas moved to eScribe in late 2025; the Agenda Center still
  // hosts Planning Commission and board/commission archives.
  escribeMeetings: "https://pub-campbell.escribemeetings.com/",
  agendaCenter: "https://www.campbellca.gov/agendacenter",
  publicNotices: "https://www.campbellca.gov/530/Public-Notices",
  planningCommissionAgenda: "https://www.campbellca.gov/AgendaCenter/Planning-Commission-6",
  cityCalendar: "https://www.campbellca.gov/calendar.aspx",
  cityCalendarList: "https://www.campbellca.gov/calendar.aspx?view=list&CID=0",
  downtownEvents: "https://www.downtowncampbell.com/events",
  heritageTheatreEvents: "https://www.heritagetheatre.org/events-1",
  campbellMuseumsEvents: "https://www.campbellmuseums.com/events-main",
  chamberEvents: "https://business.campbellchamber.net/events/calendar/",
  chamberEventsSearch: "https://business.campbellchamber.net/events/search?Lookahead=360",
  libraryEvents: "https://sccld.org/locations/campbell/",
  recreationCalendar: "https://www.campbellca.gov/calendar.aspx?CID=27,14,34,29,55",
  pruneyardEvents: "https://www.thepruneyard.com/events",
  cusdCalendar: "https://www.campbellusd.org/calendar?locale=en",
  cuhsdCalendar: "https://www.cuhsd.org/apps/events/",
  downtownDirectory: "https://www.downtowncampbell.com/directory/all",
  cpdStats: "https://www.campbellca.gov/1167/CPD-Statistics",
  cpdMediaLogs: "https://www.campbellca.gov/1503/Media-Logs",
  cpdRecords: "https://www.campbellca.gov/278/Records",
  cityProtect: "https://cityprotect.com/",
  reportCrime: "https://www.campbellca.gov/291/Report-a-Crime",
  policeTransparency: "https://www.campbellca.gov/1026/Transparency-Portal",
  ab481: "https://www.campbellca.gov/1264/Assembly-Bill-481---Military-Equipment-F",
  flockSafety: "https://www.campbellca.gov/1406/Flock-Safety",
  cityBudget: "https://www.campbellca.gov/151/Budget",
  cityGisPublic: "https://gis.campbellca.gov/public",
  cityGis: "https://gis.campbellca.gov/arcgis/rest/services/",
  assessorSearch: "https://asr.santaclaracounty.gov/online-services/property-search/real-property",
  assessorRecords: "https://asr.santaclaracounty.gov/online-services/property-search/searching-records-buying-maps",
  assessorAnnualReport: "https://asr.santaclaracounty.gov/forms-and-publications/annual-report/item/580-annual-report-2025-2026",
  clerkRecorder: "https://clerkrecorder.santaclaracounty.gov/official-records",
  clerkRecorderRealEstate: "https://clerkrecorder.santaclaracounty.gov/recording-documents/recording-real-estate",
  clerkRecorderDataSales: "https://clerkrecorder.santaclaracounty.gov/data-sales-subscription",
  countyGisData: "https://gis.santaclaracounty.gov/available-gis-map-data",
  countyPropertyProfile: "https://www.arcgis.com/home/item.html?id=a26ac88b18d7465baf1be31302706f1d",
  campbellBuilding: "https://www.campbellca.gov/1458/Building",
  planningRecords: "https://lflink.campbellca.gov/LFLINK/Browse.aspx?id=29&cr=1",
  activeProjectsMap: "https://cityofcampbell.maps.arcgis.com/apps/MapSeries/index.html?appid=444b0bc7038b456699d9faa550a530e2",
  starterHomeProjects: "https://www.campbellca.gov/1535/Starter-Home-Projects",
  permitPortal: "https://www.mgoconnect.org/cp/portal",
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
    year: "1887",
    title: "The railroad arrives and a town takes shape",
    body: "Benjamin Campbell sold land to the railroad in 1878 at $5 an acre, and by 1887 the first subdivision was recorded west of the tracks - from Campbell Avenue to where Water Tower Plaza stands today.",
    sourceLabel: "Wikipedia: Campbell, California",
    sourceUrl: SOURCE_URLS.wikipediaCampbell,
  },
  {
    year: "1892",
    title: "Orchard City earns its name",
    body: "The Campbell Fruit Growers' Union ran a well-known cooperative with a 17-acre drying yard, and drying grounds and canneries made Campbell a center for shipping fruit by rail.",
    sourceLabel: "Wikipedia: Campbell, California",
    sourceUrl: SOURCE_URLS.wikipediaCampbell,
  },
  {
    year: "1928",
    title: "The water tower goes up",
    body: "The downtown water tower was built to hold 75,000 gallons. The tank is long dry, but the tower is still Campbell's most recognizable landmark.",
    sourceLabel: "Wikipedia: Campbell, California",
    sourceUrl: SOURCE_URLS.wikipediaCampbell,
    image: {
      src: "/images/campbell/water-tower-ground.webp",
      alt: "The Campbell water tower seen from the ground",
    },
  },
  {
    year: "1952",
    title: "Campbell incorporates",
    body: "Campbell officially incorporated as a city in 1952, after city offices had used places such as Fire House No. 1 and the old Congregational Church.",
    sourceLabel: "City history",
    sourceUrl: SOURCE_URLS.cityHistory,
  },
  {
    year: "1980",
    title: "Campbell reaches the U.S. Supreme Court",
    body: "PruneYard Shopping Center v. Robins, decided June 9, 1980, started with students petitioning at the PruneYard. The Court held that California can protect speech and petitioning at privately owned shopping centers.",
    sourceLabel: "Cornell LII: 447 U.S. 74",
    sourceUrl: SOURCE_URLS.pruneyardCase,
    image: {
      src: "/images/campbell/pruneyard-aerial.webp",
      alt: "Aerial view of the Pruneyard towers beside Highway 17",
    },
  },
  {
    year: "1990s",
    title: "Ainsley House moves downtown",
    body: "The 1925 Tudor-style home of cannery pioneer J.C. Ainsley was moved from Hamilton and Bascom to the Civic Center early in the decade. It now operates as a house museum next to City Hall.",
    sourceLabel: "Wikipedia: Campbell, California",
    sourceUrl: SOURCE_URLS.wikipediaCampbell,
    image: {
      src: "/images/campbell/ainsley-house.webp",
      alt: "Aerial view of Ainsley House in Campbell",
    },
  },
  {
    year: "2004",
    title: "Heritage Theatre opens its doors again",
    body: "The former Campbell High School auditorium reopened after renovation as the Heritage Theatre, the city's venue for shows and community performances.",
    sourceLabel: "Wikipedia: Campbell, California",
    sourceUrl: SOURCE_URLS.wikipediaCampbell,
    image: {
      src: "/images/campbell/heritage-theatre.webp",
      alt: "The Campbell Heritage Theatre building",
    },
  },
  {
    year: "2005",
    title: "Light rail reaches Campbell",
    body: "VTA's Vasona line opened on October 1, 2005, bringing light rail through the Downtown Campbell station to the Winchester end of the line.",
    sourceLabel: "Wikipedia: VTA light rail",
    sourceUrl: SOURCE_URLS.wikipediaVtaLightRail,
    image: {
      src: "/images/campbell/downtown-vta-station.webp",
      alt: "A VTA light rail train at the Downtown Campbell station",
    },
  },
  {
    year: "Now",
    title: "A small city inside a complicated county",
    body: "Campbell is its own city, but everyday questions often cross county, state, school district, VTA, utility, and private-provider lines.",
    sourceLabel: "City meeting portal",
    sourceUrl: SOURCE_URLS.escribeMeetings,
  },
];

export const CIVIC_SOURCES: CampbellSource[] = [
  {
    label: "City Council agendas and minutes",
    owner: "City Clerk / eScribe portal",
    cadence: "Every meeting",
    href: SOURCE_URLS.escribeMeetings,
    why: "Primary source for council agendas, minutes, and meeting video since the city moved meetings to eScribe in late 2025.",
  },
  {
    label: "Boards and commissions archive",
    owner: "City Clerk / CivicEngage",
    cadence: "Prior years",
    href: SOURCE_URLS.agendaCenter,
    why: "The older Agenda Center still holds Planning Commission packets, board and commission records, and pre-2026 council archives.",
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
    label: "City maps",
    owner: "City of Campbell",
    cadence: "As layers update",
    href: SOURCE_URLS.cityGisPublic,
    why: "The public map viewer for zoning, parcels, city assets, and location-specific overlays.",
  },
];

export const EVENT_SOURCES: CampbellSource[] = [
  {
    label: "City calendar",
    owner: "City of Campbell",
    cadence: "Live feed",
    href: SOURCE_URLS.cityCalendarList,
    why: "City-run meetings, recreation programs, community center dates, pool notices, and public events.",
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
    cadence: "Live feed",
    href: SOURCE_URLS.heritageTheatreEvents,
    why: "Ticketed shows, dance programs, community performances, and venue-specific details from the theatre calendar.",
  },
  {
    label: "Chamber events",
    owner: "Campbell Chamber of Commerce",
    cadence: "Live feed",
    href: SOURCE_URLS.chamberEventsSearch,
    why: "Business mixers, ribbon cuttings, member events, and wider Campbell commerce activity beyond downtown.",
  },
  {
    label: "Campbell Library events",
    owner: "Santa Clara County Library District",
    cadence: "Live feed",
    href: SOURCE_URLS.libraryEvents,
    why: "Branch page exposes in-person Campbell Library events, storytimes, book clubs, workshops, and county library programs.",
  },
  {
    label: "Campbell Museums events",
    owner: "Campbell Museums / Ainsley House",
    cadence: "Live feed",
    href: SOURCE_URLS.campbellMuseumsEvents,
    why: "Museum openings, Ainsley House programs, history events, fundraisers, and family programming.",
  },
  {
    label: "Recreation and parks",
    owner: "City Recreation and Community Services",
    cadence: "Classes and parks",
    href: SOURCE_URLS.recreationCalendar,
    why: "Activity guide, classes, camps, aquatics, parks, community center programming, and department calendar items.",
  },
  {
    label: "The Pruneyard events",
    owner: "The Pruneyard",
    cadence: "Candidate source",
    href: SOURCE_URLS.pruneyardEvents,
    why: "Shopping-center events, promotions, seasonal activations, and Bascom-side Campbell activity outside downtown.",
  },
  {
    label: "Campbell Union School District",
    owner: "CUSD",
    cadence: "School calendar",
    href: SOURCE_URLS.cusdCalendar,
    why: "District-wide dates, public meetings, no-school days, and school calendars for elementary and middle-school families.",
  },
  {
    label: "Campbell Union High School District",
    owner: "CUHSD",
    cadence: "School calendar",
    href: SOURCE_URLS.cuhsdCalendar,
    why: "High-school district events, board meetings, performances, and student/family dates that affect Campbell households.",
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
    label: "County parcel map data",
    owner: "Santa Clara County",
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
  {
    label: "Active projects map",
    owner: "City of Campbell Planning Division",
    cadence: "As projects move",
    href: SOURCE_URLS.activeProjectsMap,
    why: "The most direct public map for active planning projects, permit-center geography, and location-specific development context.",
  },
  {
    label: "Planning records archive",
    owner: "City of Campbell Planning Division",
    cadence: "Historical records",
    href: SOURCE_URLS.planningRecords,
    why: "The Laserfiche archive for historical planning records, older project files, and address-level research.",
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
    label: "Media logs",
    status: "Official",
    body: "CPD publishes media-log PDFs with incident summaries. They are useful for official context, but the page should summarize patterns and source limits instead of republishing personal details.",
    sourceLabel: "CPD Media Logs",
    sourceUrl: SOURCE_URLS.cpdMediaLogs,
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
    label: "CPD media logs",
    owner: "Campbell Police Department",
    cadence: "Posted PDFs",
    href: SOURCE_URLS.cpdMediaLogs,
    why: "Official incident-log PDFs for public-safety context; useful for trend summaries with privacy boundaries.",
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
    body: "The county publishes parcel map layers for mapping and spatial joins. That makes neighborhood rollups and zoning overlays feasible without scraping individual search pages.",
    sourceLabel: "County parcel map data",
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
