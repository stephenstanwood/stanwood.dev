import { fetchWithTimeout } from "../apiHelpers";

const AGENDA_CENTER_URL = "https://www.campbellca.gov/AgendaCenter/City-Council-10";
const AGENDA_FILE_PATTERN = /\/AgendaCenter\/ViewFile\/Agenda\/_(\d{8})-(\d+)/;
const DATE_HEADING_PATTERN = /<h3[^>]*>\s*([\w]+\s+\d{1,2},?\s+\d{4})\s*<\/h3>/gi;

export interface AgendaInfo {
  date: string;
  title: string;
  url: string;
  pdfUrl: string;
}

/** Fetch the latest city council agenda URL and metadata from CivicEngage. */
export async function fetchLatestAgenda(): Promise<AgendaInfo | null> {
  const res = await fetchWithTimeout(AGENDA_CENTER_URL, {}, 15_000);
  if (!res.ok) return null;

  const html = await res.text();

  // Find agenda PDF links
  const agendaLinks = [...html.matchAll(new RegExp(
    `<a[^>]*href="([^"]*${AGENDA_FILE_PATTERN.source})"[^>]*>`,
    "gi"
  ))];

  if (agendaLinks.length === 0) return null;

  // The first match is the most recent agenda
  const firstLink = agendaLinks[0];
  const href = firstLink[1];
  const pdfUrl = href.startsWith("http") ? href : `https://www.campbellca.gov${href}`;

  // Extract date from the MMDDYYYY portion of the URL
  const dateMatch = href.match(AGENDA_FILE_PATTERN);
  let dateStr = "Unknown date";
  if (dateMatch) {
    const raw = dateMatch[1];
    const month = raw.substring(0, 2);
    const day = raw.substring(2, 4);
    const year = raw.substring(4, 8);
    dateStr = `${month}/${day}/${year}`;
  }

  // Try to find a heading date near this link for a nicer format
  const headings = [...html.matchAll(DATE_HEADING_PATTERN)];
  if (headings.length > 0) {
    dateStr = headings[0][1].trim();
  }

  return {
    date: dateStr,
    title: `City Council Meeting — ${dateStr}`,
    url: AGENDA_CENTER_URL,
    pdfUrl,
  };
}

/** Fetch the text content of an agenda PDF page for summarization. */
export async function fetchAgendaContent(pdfUrl: string): Promise<string | null> {
  // CivicEngage serves agenda "PDFs" as HTML viewer pages
  // Fetch the viewer page and extract readable text
  const res = await fetchWithTimeout(pdfUrl, {}, 15_000);
  if (!res.ok) return null;

  const html = await res.text();

  // Strip HTML tags to get text content
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

  // Limit to a reasonable size for the AI
  return text.substring(0, 12_000);
}
