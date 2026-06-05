#!/usr/bin/env node

import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = resolve(ROOT, "src/data");
const BASE_URL = "https://www.downtowncampbell.com";
const CITY_BASE_URL = "https://www.campbellca.gov";
const DIRECTORY_URL = `${BASE_URL}/directory/all`;
const EVENTS_URL = `${BASE_URL}/events`;
const CITY_CALENDAR_URL = `${CITY_BASE_URL}/calendar.aspx?view=list&CID=0`;
const COUNCIL_URL = `${CITY_BASE_URL}/AgendaCenter/City-Council-10`;
const PLANNING_COMMISSION_URL = `${CITY_BASE_URL}/AgendaCenter/Planning-Commission-6`;
const PUBLIC_NOTICES_URL = `${CITY_BASE_URL}/501/Public-Notices`;
const PUBLIC_NOTICE_ARCHIVES = [
  { body: "City Council", href: `${CITY_BASE_URL}/Archive.aspx?AMID=43`, limit: 8 },
  { body: "Planning Commission", href: `${CITY_BASE_URL}/Archive.aspx?AMID=44`, limit: 10 },
];
const MAX_NOTICE_PDF_BYTES = 4_000_000;
const USER_AGENT = "stanwood.dev Campbell guide data sync (public pages; respectful one-shot fetch)";

function decodeHtml(value = "") {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&thinsp;/g, " ")
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "-")
    .replace(/&middot;/g, ".")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&hellip;/g, "...")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanHtml(value = "") {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(href = "", base = BASE_URL) {
  if (!href) return "";
  try {
    return new URL(decodeHtml(href), base).toString();
  } catch {
    return "";
  }
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      "accept": "text/html,application/xhtml+xml",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }

  return res.text();
}

async function fetchPdfText(url) {
  const head = await fetch(url, {
    method: "HEAD",
    headers: {
      "user-agent": USER_AGENT,
      "accept": "application/pdf",
    },
  });
  const contentLength = Number(head.headers.get("content-length") ?? 0);

  if (contentLength > MAX_NOTICE_PDF_BYTES) {
    return { text: "", skipped: `PDF is ${Math.round(contentLength / 1024 / 1024)}MB` };
  }

  const res = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      "accept": "application/pdf",
    },
  });

  if (!res.ok) {
    return { text: "", skipped: `Failed to fetch PDF: ${res.status}` };
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const dir = await mkdtemp(resolve(tmpdir(), "campbell-notice-"));
  const pdfPath = resolve(dir, "notice.pdf");

  try {
    await writeFile(pdfPath, buffer);
    const result = spawnSync(
      "pdftotext",
      ["-f", "1", "-l", "8", "-layout", pdfPath, "-"],
      { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 },
    );

    if (result.error) {
      return { text: "", skipped: result.error.message };
    }
    if (result.status !== 0 && !result.stdout) {
      return { text: "", skipped: result.stderr.trim() || "pdftotext failed" };
    }

    return { text: result.stdout, skipped: "" };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function extractCell(rowHtml, className) {
  const cell = rowHtml.match(new RegExp(`<td[^>]*class="[^"]*${className}[^"]*"[^>]*>([\\s\\S]*?)<\\/td>`, "i"));
  return cell?.[1] ?? "";
}

function extractLink(cellHtml = "") {
  return cellHtml.match(/<a[^>]*href="([^"]+)"/i)?.[1] ?? "";
}

function parseDirectory(html) {
  const body = html.match(/<tbody>([\s\S]*?)<\/tbody>/i)?.[1] ?? "";
  const rows = [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];

  return rows
    .map(([, row]) => {
      const nameCell = extractCell(row, "location_name");
      const link = nameCell.match(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      const name = cleanHtml(link?.[2] ?? nameCell);
      const url = absoluteUrl(link?.[1] ?? "");
      const phone = cleanHtml(extractCell(row, "location_phone"));
      const address = cleanHtml(extractCell(row, "location_street"));

      if (!name || !url) return null;

      return {
        name,
        phone,
        address,
        url,
        source: "Downtown Campbell Directory",
        sourceUrl: DIRECTORY_URL,
      };
    })
    .filter(Boolean);
}

function normalizeKeyPart(value = "") {
  return cleanSentence(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseDowntownStartDate(date = "") {
  const match = cleanSentence(date).match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!match) return "";

  const month = match[1].padStart(2, "0");
  const day = match[2].padStart(2, "0");
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${year}-${month}-${day}T00:00:00`;
}

function eventTimestamp(event) {
  const parsed = Date.parse(event.startDate || "");
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

function eventKey(event) {
  const title = normalizeKeyPart(event.title);
  const date = (event.startDate || event.date || "").slice(0, 10);
  return `${title}|${date}`;
}

function parseDowntownEvents(html) {
  const articles = [...html.matchAll(/<article\b[\s\S]*?<\/article>/gi)];

  return articles
    .map(([article]) => {
      const titleLink = article.match(/<h3[^>]*class="[^"]*node-title[^"]*"[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h3>/i);
      const image = article.match(/<img[^>]*src="([^"]+)"/i);
      const body = article.match(/<div[^>]*class="[^"]*eventbody[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

      const title = cleanHtml(titleLink?.[2] ?? "");
      const url = absoluteUrl(titleLink?.[1] ?? "");
      const date = cleanHtml(article.match(/<div[^>]*class="date"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? "");
      const cost = cleanHtml(article.match(/<div[^>]*class="[^"]*field-cost[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? "");
      const location = cleanHtml(article.match(/<div[^>]*class="[^"]*location-name[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? "");
      const description = cleanHtml(body?.[1] ?? "").slice(0, 280);
      const imageUrl = absoluteUrl(image?.[1] ?? "");
      const startDate = parseDowntownStartDate(date);

      if (!title || !url) return null;

      return {
        title,
        date,
        cost,
        location,
        description,
        url,
        imageUrl,
        category: "Downtown",
        startDate,
        source: "Downtown Campbell Events",
        sourceUrl: EVENTS_URL,
      };
    })
    .filter(Boolean);
}

function splitCalendarBlocks(html) {
  const starts = [...html.matchAll(/<div[^>]*id="CID\d+"[^>]*class="[^"]*calendar[^"]*"[^>]*>/gi)];
  return starts.map((match, index) => {
    const start = match.index ?? 0;
    const end = starts[index + 1]?.index ?? html.length;
    return html.slice(start, end);
  });
}

function extractCalendarLocation(itemHtml) {
  const locationFromSubheader = itemHtml.match(/<div[^>]*class="[^"]*eventLocation[^"]*"[^>]*>[\s\S]*?<div[^>]*class="[^"]*name[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? "";
  const locationFromSchema = itemHtml.match(/<span[^>]*itemprop="location"[\s\S]*?<span[^>]*itemprop="name"[^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? "";
  const location = cleanHtml(locationFromSubheader || locationFromSchema);

  return location === "Event Location" ? "" : location;
}

function parseCityCalendarEvents(html) {
  return splitCalendarBlocks(html).flatMap((block) => {
    const category = cleanHtml(block.match(/<h2[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "");
    const items = [...block.matchAll(/<li>\s*([\s\S]*?)\s*<\/li>/gi)];

    return items
      .map(([, itemHtml]) => {
        const titleLink = itemHtml.match(/<a[^>]*id="eventTitle_[^"]+"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
        const title = cleanHtml(titleLink?.[2] ?? "");
        const url = absoluteUrl(titleLink?.[1] ?? "", CITY_BASE_URL);
        const date = cleanHtml(itemHtml.match(/<div[^>]*class="date"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? "");
        const startDate = cleanHtml(itemHtml.match(/<span[^>]*itemprop="startDate"[^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? "");
        const description = cleanHtml(
          itemHtml.match(/<p[^>]*itemprop="description"[^>]*>([\s\S]*?)<\/p>/i)?.[1] ??
          itemHtml.match(/<div[^>]*itemscope[^>]*>[\s\S]*?<\/div>\s*<p>([\s\S]*?)<\/p>/i)?.[1] ??
          "",
        ).slice(0, 280);
        const location = extractCalendarLocation(itemHtml);

        if (!title || !url) return null;

        return {
          title,
          date,
          cost: "",
          location,
          description,
          url,
          imageUrl: "",
          category,
          startDate,
          source: "City of Campbell Calendar",
          sourceUrl: CITY_CALENDAR_URL,
        };
      })
      .filter(Boolean);
  });
}

function mergeEventFeeds(...feeds) {
  const byKey = new Map();

  for (const event of feeds.flat()) {
    const key = eventKey(event);
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, event);
      continue;
    }

    const sourceNames = new Set([existing.source, event.source].filter(Boolean));
    const sourceUrls = new Set([
      existing.sourceUrl,
      ...(existing.additionalSourceUrls ?? []),
      event.sourceUrl,
      ...(event.additionalSourceUrls ?? []),
    ].filter(Boolean));

    byKey.set(key, {
      ...existing,
      cost: existing.cost || event.cost,
      location: existing.location || event.location,
      description: existing.description || event.description,
      imageUrl: existing.imageUrl || event.imageUrl,
      url: existing.url || event.url,
      category: existing.category || event.category,
      source: [...sourceNames].join(" + "),
      additionalSourceUrls: [...sourceUrls].filter((url) => url !== existing.sourceUrl),
    });
  }

  return [...byKey.values()]
    .sort((a, b) => eventTimestamp(a) - eventTimestamp(b) || a.title.localeCompare(b.title));
}

function parseAgendaCenterRecords(html, { tableId, body, sourceUrl }) {
  const table = html.match(new RegExp(`<table[^>]*id="${tableId}"[^>]*>([\\s\\S]*?)<\\/table>`, "i"))?.[1] ?? "";
  const rows = [...table.matchAll(/<tr[^>]*class="[^"]*catAgendaRow[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi)];

  return rows
    .map(([, row]) => {
      const dateLabel = decodeHtml(row.match(/<strong[^>]*aria-label="Agenda for ([^"]+)"/i)?.[1] ?? cleanHtml(row.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i)?.[1] ?? ""));
      const agendaLink = row.match(/<a[^>]*href="([^"]*\/AgendaCenter\/ViewFile\/Agenda\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      const minutesLink = extractLink(extractCell(row, "minutes"));
      const mediaLink = extractLink(extractCell(row, "media"));
      const title = cleanHtml(agendaLink?.[2] ?? "");
      const agendaUrl = absoluteUrl(agendaLink?.[1] ?? "", CITY_BASE_URL);

      if (!dateLabel || !title || !agendaUrl) return null;

      return {
        date: dateLabel,
        title,
        body,
        agendaUrl,
        minutesUrl: absoluteUrl(minutesLink, CITY_BASE_URL),
        mediaUrl: absoluteUrl(mediaLink, CITY_BASE_URL),
        source: "Campbell Agenda Center",
        sourceUrl,
      };
    })
    .filter(Boolean)
    .slice(0, 24);
}

function parsePublicNoticeArchive(html, { body, href, limit }) {
  const blocks = [...html.matchAll(/<table[^>]*summary="Archive Details"[^>]*>([\s\S]*?)<\/table>/gi)];

  return blocks
    .map(([, block]) => {
      const link = block.match(/<a[^>]*href="([^"]*Archive\.aspx\?ADID=\d+)"[^>]*>\s*<span>([\s\S]*?)<\/span>\s*<\/a>/i);
      const title = cleanHtml(link?.[2] ?? "");
      const noticeUrl = absoluteUrl(link?.[1] ?? "", CITY_BASE_URL);
      const id = noticeUrl.match(/ADID=(\d+)/)?.[1] ?? "";

      if (!title || !noticeUrl || !id) return null;

      return {
        id,
        body,
        title,
        noticeUrl,
        source: `${body} public notices`,
        sourceUrl: href,
      };
    })
    .filter(Boolean)
    .slice(0, limit);
}

function normalizeText(value = "") {
  return value
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function compactText(value = "") {
  return normalizeText(value).replace(/\s+/g, " ").trim();
}

function cleanSentence(value = "") {
  return compactText(value)
    .replace(/\s+,/g, ",")
    .replace(/\s+\./g, ".")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function parseNoticeHearingTime(text) {
  const cleaned = compactText(text);
  const match = cleaned.match(/(?:hour of|at)\s+([0-9]{1,2}(?::[0-9]{2})?\s*(?:a\.?m\.?|p\.?m\.?|AM|PM))[\s\S]{0,220}?\bon\s+(?:(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+)?([A-Z][a-z]+\.?\s+\d{1,2},\s+\d{4})/i);
  if (!match) return "";

  return cleanSentence(`${match[2]} at ${match[1]}`);
}

function parseAgendaMeetingTime(text, fallbackDate) {
  const cleaned = compactText(text);
  const match = cleaned.match(/((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+)?([A-Z][a-z]+\.?\s+\d{1,2},\s+\d{4})\s*[|I]\s*([0-9]{1,2}:[0-9]{2}\s*(?:AM|PM))/i);
  if (match) return cleanSentence(`${match[2]} at ${match[3]}`);

  return fallbackDate;
}

function extractProjectAddress(text) {
  const line = text
    .replace(/\r/g, "\n")
    .split("\n")
    .find((candidate) => /Project Address:/i.test(candidate));
  if (line) {
    const address = line.replace(/^.*Project Address:\s*/i, "").trim().split(/\s{2,}/)[0] ?? "";
    return cleanSentence(address);
  }

  const match = text.match(/Project Address:\s*([\s\S]*?)(?=\s+(?:Zoning|Project Description|Neighborhood|Council District|File No\.|APN:|$))/i);
  return cleanSentence(match?.[1] ?? "");
}

function extractProjectDescription(text) {
  const match = text.match(/Project Description:\s*([\s\S]*?)(?=\s+(?:Council District|File No\.|APN:|Applicant:|Property Owner:|You may participate|Application Type:|Project Planner:|$))/i);
  if (match) return cleanSentence(match[1]);

  const cityNotice = text.match(/Public Hearing to consider\s+([\s\S]*?)(?=\s+(?:Interested persons|This public hearing|Please be advised|Questions may be|$))/i);
  return cleanSentence(cityNotice?.[1] ?? "");
}

function parseNoticeDetails(text) {
  const normalized = normalizeText(text);
  return {
    hearingAt: parseNoticeHearingTime(normalized),
    address: extractProjectAddress(text),
    summary: extractProjectDescription(text),
    fileNo: cleanSentence(normalized.match(/File No\.:\s*([A-Z0-9-]+)/i)?.[1] ?? ""),
    planner: cleanSentence(normalized.match(/Project Planner:\s*([^\n]+)/i)?.[1] ?? ""),
  };
}

function parseAgendaPublicHearingItems(text, record) {
  const normalized = normalizeText(text);
  const section = normalized.match(/\nPUBLIC HEARING\n([\s\S]*?)(?=\n(?:NEW BUSINESS|OLD BUSINESS|STUDY SESSION|STAFF AND COMMITTEE REPORTS|STAFF REPORTS|ADJOURNMENT|CONSENT|COMMUNICATIONS)\n|$)/i)?.[1] ?? "";
  if (!section) return [];

  const meetingAt = parseAgendaMeetingTime(normalized, record.date);
  const itemMatches = [...section.matchAll(/\n?\s*(\d+)\.\s+([^\n]+)\n([\s\S]*?)(?=\n\s*\d+\.\s+[^\n]+\n|$)/g)];

  return itemMatches
    .map(([, itemNumber, rawTitle, rawBody]) => {
      const title = cleanSentence(rawTitle);
      const body = normalizeText(rawBody);
      const summary = cleanSentence(
        body.match(/Public Hearing to\s+([\s\S]*?)(?=\s+(?:File No\.|Project Planner:|Recommended Action:|Staff is recommending|$))/i)?.[1] ?? "",
      );

      if (!title || !summary) return null;

      return {
        id: `agenda-${record.body.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${record.date.replace(/[^a-z0-9]+/gi, "-")}-${itemNumber}`,
        body: record.body,
        title,
        hearingAt: meetingAt,
        summary,
        address: "",
        fileNo: cleanSentence(body.match(/File No\.:\s*([A-Z0-9-]+)/i)?.[1] ?? ""),
        planner: cleanSentence(body.match(/Project Planner:\s*([^.\n]+)/i)?.[1] ?? ""),
        sourceType: "Agenda item",
        source: record.source,
        sourceUrl: record.agendaUrl,
        noticeUrl: "",
        extractionNote: "",
      };
    })
    .filter(Boolean);
}

function hearingTimestamp(item) {
  if (!item.hearingAt) return 0;
  const normalized = item.hearingAt
    .replace(/\bat\b/i, "")
    .replace(/a\.m\./gi, "AM")
    .replace(/p\.m\./gi, "PM");
  const parsed = Date.parse(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function parsePublicHearings({ planningRecords, noticeArchives }) {
  const hearingItems = [];

  for (const record of planningRecords.slice(0, 8)) {
    await sleep(300);
    const pdf = await fetchPdfText(record.agendaUrl);
    if (!pdf.text) continue;
    hearingItems.push(...parseAgendaPublicHearingItems(pdf.text, record));
  }

  const notices = noticeArchives.flatMap((archive) => archive.items);
  for (const notice of notices) {
    await sleep(300);
    const pdf = await fetchPdfText(notice.noticeUrl);
    const details = pdf.text ? parseNoticeDetails(pdf.text) : {};
    const summary = details.summary || notice.title;

    if (!details.hearingAt && !details.summary && !pdf.skipped) continue;

    hearingItems.push({
      id: `notice-${notice.id}`,
      body: notice.body,
      title: notice.title,
      hearingAt: details.hearingAt ?? "",
      summary,
      address: details.address ?? "",
      fileNo: details.fileNo ?? "",
      planner: details.planner ?? "",
      sourceType: "Public notice",
      source: notice.source,
      sourceUrl: notice.sourceUrl,
      noticeUrl: notice.noticeUrl,
      extractionNote: pdf.skipped || "",
    });
  }

  return hearingItems
    .filter((item, index, list) => {
      const key = `${item.body}|${item.title}|${item.hearingAt}`;
      return list.findIndex((other) => `${other.body}|${other.title}|${other.hearingAt}` === key) === index;
    })
    .sort((a, b) => hearingTimestamp(b) - hearingTimestamp(a))
    .slice(0, 18);
}

async function writeJson(filename, payload) {
  await mkdir(DATA_DIR, { recursive: true });
  const target = resolve(DATA_DIR, filename);
  await writeFile(target, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return target;
}

async function main() {
  const generatedAt = new Date().toISOString();
  const [directoryHtml, eventsHtml, cityCalendarHtml, councilHtml, planningHtml, ...noticeArchiveHtml] = await Promise.all([
    fetchText(DIRECTORY_URL),
    fetchText(EVENTS_URL),
    fetchText(CITY_CALENDAR_URL),
    fetchText(COUNCIL_URL),
    fetchText(PLANNING_COMMISSION_URL),
    ...PUBLIC_NOTICE_ARCHIVES.map((archive) => fetchText(archive.href)),
  ]);

  const businesses = parseDirectory(directoryHtml);
  const downtownEvents = parseDowntownEvents(eventsHtml);
  const cityCalendarEvents = parseCityCalendarEvents(cityCalendarHtml);
  const events = mergeEventFeeds(cityCalendarEvents, downtownEvents);
  const councilRecords = parseAgendaCenterRecords(councilHtml, {
    tableId: "table10",
    body: "City Council",
    sourceUrl: COUNCIL_URL,
  });
  const planningRecords = parseAgendaCenterRecords(planningHtml, {
    tableId: "table6",
    body: "Planning Commission",
    sourceUrl: PLANNING_COMMISSION_URL,
  });
  const noticeArchives = PUBLIC_NOTICE_ARCHIVES.map((archive, index) => ({
    ...archive,
    items: parsePublicNoticeArchive(noticeArchiveHtml[index] ?? "", archive),
  }));
  const publicHearings = await parsePublicHearings({
    planningRecords,
    noticeArchives,
  });

  if (businesses.length < 50) {
    throw new Error(`Directory parse returned only ${businesses.length} businesses`);
  }
  if (cityCalendarEvents.length < 8) {
    throw new Error(`City calendar parse returned only ${cityCalendarEvents.length} events`);
  }
  if (downtownEvents.length < 10) {
    throw new Error(`Downtown events parse returned only ${downtownEvents.length} events`);
  }
  if (events.length < 20) {
    throw new Error(`Events parse returned only ${events.length} events`);
  }
  if (councilRecords.length < 5) {
    throw new Error(`Council records parse returned only ${councilRecords.length} records`);
  }
  if (planningRecords.length < 5) {
    throw new Error(`Planning Commission records parse returned only ${planningRecords.length} records`);
  }
  if (publicHearings.length < 5) {
    throw new Error(`Public hearings parse returned only ${publicHearings.length} records`);
  }

  const businessPath = await writeJson("campbellBusinesses.json", {
    generatedAt,
    sourceUrl: DIRECTORY_URL,
    items: businesses,
  });

  const eventPath = await writeJson("campbellEvents.json", {
    generatedAt,
    sourceUrl: CITY_CALENDAR_URL,
    sources: [
      {
        label: "City of Campbell Calendar",
        sourceUrl: CITY_CALENDAR_URL,
        count: cityCalendarEvents.length,
      },
      {
        label: "Downtown Campbell Events",
        sourceUrl: EVENTS_URL,
        count: downtownEvents.length,
      },
    ],
    items: events,
  });

  const councilPath = await writeJson("campbellCouncilRecords.json", {
    generatedAt,
    sourceUrl: COUNCIL_URL,
    items: councilRecords,
  });

  const publicHearingsPath = await writeJson("campbellPublicHearings.json", {
    generatedAt,
    sourceUrl: PUBLIC_NOTICES_URL,
    agendaSourceUrl: PLANNING_COMMISSION_URL,
    items: publicHearings,
  });

  console.log(`Wrote ${businesses.length} businesses -> ${businessPath}`);
  console.log(`Wrote ${events.length} events (${cityCalendarEvents.length} city, ${downtownEvents.length} downtown) -> ${eventPath}`);
  console.log(`Wrote ${councilRecords.length} council records -> ${councilPath}`);
  console.log(`Wrote ${publicHearings.length} public hearings -> ${publicHearingsPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
