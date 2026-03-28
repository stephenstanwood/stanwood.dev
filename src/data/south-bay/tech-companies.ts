// ---------------------------------------------------------------------------
// South Bay Tech Companies — curated snapshot, Q1 2026
// Headcounts are global estimates based on company filings and news coverage
// ---------------------------------------------------------------------------

export type TechCategory =
  | "chip"
  | "cloud"
  | "software"
  | "network"
  | "ecommerce"
  | "fintech"
  | "security"
  | "social"
  | "hardware"
  | "saas";

export const CATEGORY_LABELS: Record<TechCategory, string> = {
  chip: "Chips",
  cloud: "Cloud",
  software: "Software",
  network: "Networking",
  ecommerce: "E-Commerce",
  fintech: "Fintech",
  security: "Security",
  social: "Social",
  hardware: "Hardware",
  saas: "SaaS",
};

export type TechTrend = "up" | "flat" | "down";

export interface TechCompany {
  id: string;
  name: string;
  chartName: string; // shorter name for chart axis
  ticker?: string;
  city: string;
  category: TechCategory;
  headcountK: number; // global employees, in thousands
  trend: TechTrend;
  trendNote: string;
  highlights: string[];
  description: string;
  color: string; // brand-adjacent color for charts
}

export const TECH_COMPANIES: TechCompany[] = [
  {
    id: "google",
    name: "Google",
    chartName: "Google",
    ticker: "GOOGL",
    city: "Mountain View",
    category: "cloud",
    headcountK: 181,
    trend: "flat",
    trendNote: "Stabilized after 12,000-person layoff in 2023",
    highlights: [
      "Gemini AI driving search, Cloud, and device integration across all products",
      "Waymo robotaxi service expanding commercially to multiple US cities",
    ],
    description:
      "Search, cloud, AI, and advertising. The largest campus presence in the South Bay.",
    color: "#4285F4",
  },
  {
    id: "apple",
    name: "Apple",
    chartName: "Apple",
    ticker: "AAPL",
    city: "Cupertino",
    category: "hardware",
    headcountK: 164,
    trend: "flat",
    trendNote: "Headcount roughly stable after 2023 hiring pause",
    highlights: [
      "Apple Intelligence on-device AI rolling out across iPhone, Mac, and iPad",
      "M4 chip family in full deployment; Vision Pro second generation rumored",
    ],
    description:
      "Consumer hardware, software, and services. One Apple Park Way, Cupertino.",
    color: "#555555",
  },
  {
    id: "intel",
    name: "Intel",
    chartName: "Intel",
    ticker: "INTC",
    city: "Santa Clara",
    category: "chip",
    headcountK: 108,
    trend: "down",
    trendNote: "Down ~15% after cutting 15,000 jobs in 2024 restructuring",
    highlights: [
      "CEO Pat Gelsinger resigned December 2024; company charting new course",
      "Intel Foundry Services struggling to win advanced semiconductor orders from outside customers",
    ],
    description:
      "CPU pioneer navigating a major strategic pivot. Once the defining company of Silicon Valley.",
    color: "#0071C5",
  },
  {
    id: "cisco",
    name: "Cisco",
    chartName: "Cisco",
    ticker: "CSCO",
    city: "San Jose",
    category: "network",
    headcountK: 85,
    trend: "flat",
    trendNote: "Stable following Splunk acquisition integration",
    highlights: [
      "Splunk acquisition ($28B) transforms Cisco into a major security + observability platform",
      "Networking hardware and software being repositioned for AI infrastructure demand",
    ],
    description:
      "Enterprise networking, security, and observability. The largest employer in downtown San Jose.",
    color: "#1BA0D7",
  },
  {
    id: "meta",
    name: "Meta",
    chartName: "Meta",
    ticker: "META",
    city: "Menlo Park",
    category: "social",
    headcountK: 72,
    trend: "up",
    trendNote: "Rebuilt headcount after massive 2022–23 layoffs; AI hiring surge",
    highlights: [
      "Llama open-source AI models advancing Meta AI across Facebook, Instagram, and WhatsApp",
      "Ray-Ban Meta smart glasses gaining traction as low-key consumer wearable AI",
    ],
    description:
      "Social media, VR/AR, and open-source AI. Menlo Park HQ just over the county line.",
    color: "#0081FB",
  },
  {
    id: "nvidia",
    name: "NVIDIA",
    chartName: "NVIDIA",
    ticker: "NVDA",
    city: "Santa Clara",
    category: "chip",
    headcountK: 36,
    trend: "up",
    trendNote: "+38% headcount growth driven by insatiable AI GPU demand",
    highlights: [
      "Blackwell GPU architecture (B100/B200) powering next-generation AI data centers globally",
      "Market cap surpassed $3 trillion — briefly the most valuable company in the world",
    ],
    description:
      "GPUs and AI accelerators. The defining company of the current AI era. Santa Clara's crown jewel.",
    color: "#76B900",
  },
  {
    id: "adobe",
    name: "Adobe",
    chartName: "Adobe",
    ticker: "ADBE",
    city: "San Jose",
    category: "software",
    headcountK: 30,
    trend: "flat",
    trendNote: "Stable after abandoned $20B Figma acquisition",
    highlights: [
      "Firefly generative AI now integrated throughout Creative Cloud product line",
      "Dropped $20B Figma acquisition in 2023 after regulatory pressure; Figma remains independent",
    ],
    description:
      "Creative software for design, video, and documents. Firefly AI reshaping how creators work.",
    color: "#FF0000",
  },
  {
    id: "paypal",
    name: "PayPal",
    chartName: "PayPal",
    ticker: "PYPL",
    city: "San Jose",
    category: "fintech",
    headcountK: 27,
    trend: "down",
    trendNote: "Restructuring under new CEO; cut ~2,500 jobs in 2024",
    highlights: [
      "New CEO Alex Chriss refocusing on core checkout experience and Venmo monetization",
      "Fastlane one-click checkout targeting merchant conversion improvement",
    ],
    description:
      "Digital payments and Venmo. Rebuilding focus and momentum after years of stock decline.",
    color: "#003087",
  },
  {
    id: "amd",
    name: "AMD",
    chartName: "AMD",
    ticker: "AMD",
    city: "Santa Clara",
    category: "chip",
    headcountK: 26,
    trend: "up",
    trendNote: "Growing as MI300X AI GPU earns data center wins",
    highlights: [
      "MI300X AI GPU positioned as the primary alternative to NVIDIA H100 for AI workloads",
      "EPYC server CPUs dominant across major cloud providers — AWS, Azure, Google Cloud",
    ],
    description:
      "CPUs and GPUs for PCs, servers, and AI. The other chip giant headquartered in Santa Clara.",
    color: "#ED1C24",
  },
  {
    id: "servicenow",
    name: "ServiceNow",
    chartName: "ServiceNow",
    ticker: "NOW",
    city: "Santa Clara",
    category: "saas",
    headcountK: 22,
    trend: "up",
    trendNote: "Consistent 20%+ revenue growth; headcount expanding steadily",
    highlights: [
      "Now Platform AI Agents automating enterprise IT, HR, and customer workflows at scale",
      "One of the fastest-growing large enterprise software companies in the world",
    ],
    description:
      "Enterprise workflow automation. The quiet giant of South Bay SaaS.",
    color: "#62D84E",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    chartName: "LinkedIn",
    ticker: "MSFT",
    city: "Sunnyvale",
    category: "social",
    headcountK: 21,
    trend: "flat",
    trendNote: "Part of Microsoft; stable with AI feature additions rolling out",
    highlights: [
      "AI-assisted job matching, writing tools, and profile optimization launching for Premium users",
      "B2B advertising and Premium subscriptions driving revenue growth for Microsoft",
    ],
    description:
      "Professional network and recruiting platform. Microsoft-owned, headquartered in Sunnyvale.",
    color: "#0A66C2",
  },
  {
    id: "juniper",
    name: "Juniper Networks",
    chartName: "Juniper",
    ticker: "HPE",
    city: "Sunnyvale",
    category: "network",
    headcountK: 13,
    trend: "flat",
    trendNote: "Acquired by HP Enterprise in 2024 for $14B; integration underway",
    highlights: [
      "HP Enterprise acquisition closed 2024 — Juniper now part of HPE networking portfolio",
      "Mist AI-driven networking platform being integrated into HPE product suite",
    ],
    description:
      "Enterprise networking. Now part of HP Enterprise after a $14B acquisition.",
    color: "#84BD00",
  },
  {
    id: "western-digital",
    name: "Western Digital",
    chartName: "W. Digital",
    ticker: "WDC",
    city: "San Jose",
    category: "hardware",
    headcountK: 12,
    trend: "flat",
    trendNote: "Separated flash business (Sandisk) into standalone company Feb 2025",
    highlights: [
      "Sandisk spin-off completed February 2025 — WD now a focused hard drive company",
      "Hard drive demand rising again with AI data center storage needs driving enterprise sales",
    ],
    description:
      "Data storage hardware. Split off Sandisk to focus on the hard drive business.",
    color: "#CC1414",
  },
  {
    id: "ebay",
    name: "eBay",
    chartName: "eBay",
    ticker: "EBAY",
    city: "San Jose",
    category: "ecommerce",
    headcountK: 12,
    trend: "flat",
    trendNote: "Restructured; focused category strategy stabilizing after years of churn",
    highlights: [
      "AI-powered listing tools cutting seller friction and improving listing quality significantly",
      "Authenticity Guarantee expanding to more collectible and luxury product categories",
    ],
    description:
      "Online marketplace pioneer. Refocused on enthusiast categories — sneakers, collectibles, luxury.",
    color: "#E53238",
  },
  {
    id: "palo-alto",
    name: "Palo Alto Networks",
    chartName: "Palo Alto",
    ticker: "PANW",
    city: "Santa Clara",
    category: "security",
    headcountK: 14,
    trend: "up",
    trendNote: "Strong growth as enterprise security platform consolidation accelerates",
    highlights: [
      "'Platformization' strategy winning large enterprise security consolidation deals from point-product vendors",
      "Precision AI features now embedded across the full security product portfolio",
    ],
    description:
      "Cybersecurity platform. One of the fastest-growing security companies in the world.",
    color: "#FA582D",
  },
  {
    id: "zoom",
    name: "Zoom",
    chartName: "Zoom",
    ticker: "ZM",
    city: "San Jose",
    category: "saas",
    headcountK: 7,
    trend: "flat",
    trendNote: "Post-pandemic normalization; pivoting to AI Companion as growth driver",
    highlights: [
      "Zoom Workplace platform adds AI Companion for meeting summaries and conversation intelligence",
      "Adapting to hybrid work normalization after extraordinary pandemic-era growth period",
    ],
    description:
      "Video meetings and workplace collaboration. A COVID-era breakout finding its steady state.",
    color: "#2D8CFF",
  },
];

// Top employers sorted for chart (top 10 by headcount)
export const CHART_DATA = [...TECH_COMPANIES]
  .sort((a, b) => b.headcountK - a.headcountK)
  .slice(0, 10)
  .map((c) => ({
    name: c.chartName,
    headcount: c.headcountK,
    color: c.color,
    trend: c.trend,
  }));

// Pulse stats for the header strip
export const TECH_PULSE = [
  {
    value: "16",
    label: "Major HQs",
    note: "in Santa Clara County and Menlo Park",
  },
  {
    value: "NVIDIA",
    label: "Biggest gainer",
    note: "+38% headcount as AI GPU demand explodes",
  },
  {
    value: "Intel",
    label: "Most restructuring",
    note: "15K jobs cut, CEO out, new direction TBD",
  },
  {
    value: "AI chips",
    label: "Hot category",
    note: "NVIDIA, AMD, Intel all betting on inference",
  },
];
