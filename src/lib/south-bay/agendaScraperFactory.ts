// ---------------------------------------------------------------------------
// South Bay Signal — generalized agenda scraper factory
// Extends the Campbell scraper pattern to support multiple cities.
// ---------------------------------------------------------------------------

import { fetchWithTimeout } from "../apiHelpers";
import type { City } from "./types";

// ── Types ──

export interface AgendaCityConfig {
  city: City;
  cityName: string;
  platform: "civicengage" | "legistar" | "custom";
  agendaUrl: string;
  baseUrl: string; // for resolving relative links
  body: string; // "City Council", "Planning Commission", etc.
  schedule: string; // "1st and 3rd Tuesday"
  agendaFilePattern?: RegExp;
  dateHeadingPattern?: RegExp;
}

export interface AgendaInfo {
  city: City;
  cityName: string;
  body: string;
  date: string;
  title: string;
  url: string;
  pdfUrl: string;
  schedule: string;
}

// ── City configurations ──
// Cities are added as their agenda systems are verified.

export const AGENDA_CITIES: AgendaCityConfig[] = [
  // ── CivicEngage cities (same scraper pattern) ──
  {
    city: "campbell",
    cityName: "Campbell",
    platform: "civicengage",
    agendaUrl: "https://www.campbellca.gov/AgendaCenter/City-Council-10",
    baseUrl: "https://www.campbellca.gov",
    body: "City Council",
    schedule: "1st and 3rd Tuesday",
  },
  // Los Gatos: CivicEngage but no Town Council category — skipped
  {
    city: "saratoga",
    cityName: "Saratoga",
    platform: "civicengage",
    agendaUrl: "https://www.saratoga.ca.us/AgendaCenter/City-Council-13",
    baseUrl: "https://www.saratoga.ca.us",
    body: "City Council",
    schedule: "1st and 3rd Wednesday",
  },
  {
    city: "los-altos",
    cityName: "Los Altos",
    platform: "civicengage",
    agendaUrl: "https://www.losaltosca.gov/AgendaCenter/City-Council-4",
    baseUrl: "https://www.losaltosca.gov",
    body: "City Council",
    schedule: "2nd and 4th Tuesday",
  },
  // ── Legistar cities (TODO: implement scraper) ──
  // San Jose: sanjose.legistar.com
  // Cupertino: cupertino.legistar.com
  // Sunnyvale: sunnyvaleca.legistar.com
  // Mountain View: mountainview.legistar.com
  // Santa Clara: santaclara.legistar.com
  //
  // ── Other platforms ──
  // Palo Alto: PrimeGov (cityofpaloalto.primegov.com)
  // Milpitas: CivicClerk (embedded, no AgendaCenter)
];

// ── CivicEngage scraper ──

async function scrapeCivicEngage(
  config: AgendaCityConfig,
): Promise<AgendaInfo | null> {
  const filePattern =
    config.agendaFilePattern ??
    /\/AgendaCenter\/ViewFile\/Agenda\/_(\d{8})-(\d+)/;
  const datePattern =
    config.dateHeadingPattern ??
    /<h3[^>]*>\s*([\w]+\s+\d{1,2},?\s+\d{4})\s*<\/h3>/gi;

  const res = await fetchWithTimeout(config.agendaUrl, {}, 15_000);
  if (!res.ok) return null;

  const html = await res.text();

  // Find agenda PDF links
  const agendaLinks = [
    ...html.matchAll(
      new RegExp(
        `<a[^>]*href="([^"]*${filePattern.source})"[^>]*>`,
        "gi",
      ),
    ),
  ];

  if (agendaLinks.length === 0) return null;

  const firstLink = agendaLinks[0];
  const href = firstLink[1];
  const pdfUrl = href.startsWith("http") ? href : `${config.baseUrl}${href}`;

  // Extract date from URL
  const dateMatch = href.match(filePattern);
  let dateStr = "Unknown date";
  if (dateMatch) {
    const raw = dateMatch[1];
    const month = raw.substring(0, 2);
    const day = raw.substring(2, 4);
    const year = raw.substring(4, 8);
    dateStr = `${month}/${day}/${year}`;
  }

  // Try heading date for nicer format
  const headings = [...html.matchAll(datePattern)];
  if (headings.length > 0) {
    dateStr = headings[0][1].trim();
  }

  return {
    city: config.city,
    cityName: config.cityName,
    body: config.body,
    date: dateStr,
    title: `${config.cityName} ${config.body} — ${dateStr}`,
    url: config.agendaUrl,
    pdfUrl,
    schedule: config.schedule,
  };
}

// ── Public API ──

/** Fetch the latest agenda for a specific city. */
export async function fetchCityAgenda(
  cityId: City,
): Promise<AgendaInfo | null> {
  const config = AGENDA_CITIES.find((c) => c.city === cityId);
  if (!config) return null;

  switch (config.platform) {
    case "civicengage":
      return scrapeCivicEngage(config);
    case "legistar":
      // TODO: implement Legistar scraper
      return null;
    default:
      return null;
  }
}

/** Fetch the latest agendas for all configured cities. */
export async function fetchAllCityAgendas(): Promise<AgendaInfo[]> {
  const results = await Promise.allSettled(
    AGENDA_CITIES.map((config) => fetchCityAgenda(config.city)),
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<AgendaInfo | null> =>
        r.status === "fulfilled",
    )
    .map((r) => r.value)
    .filter((a): a is AgendaInfo => a !== null);
}

/** Fetch agenda text content for summarization. */
export async function fetchAgendaContent(
  pdfUrl: string,
): Promise<string | null> {
  const res = await fetchWithTimeout(pdfUrl, {}, 15_000);
  if (!res.ok) return null;

  const html = await res.text();

  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

  return text.substring(0, 12_000);
}

/** Get list of cities that have agenda scraping configured. */
export function getConfiguredCities(): City[] {
  return AGENDA_CITIES.map((c) => c.city);
}
