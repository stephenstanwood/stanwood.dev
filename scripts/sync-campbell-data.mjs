#!/usr/bin/env node

import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = resolve(ROOT, "src/data");
const BASE_URL = "https://www.downtowncampbell.com";
const CITY_BASE_URL = "https://www.campbellca.gov";
const CHAMBER_BASE_URL = "https://business.campbellchamber.net";
const DIRECTORY_URL = `${BASE_URL}/directory/all`;
const EVENTS_URL = `${BASE_URL}/events`;
const CITY_CALENDAR_URL = `${CITY_BASE_URL}/calendar.aspx?view=list&CID=0`;
const CHAMBER_DIRECTORY_URL = `${CHAMBER_BASE_URL}/list`;
const CHAMBER_EVENT_LOOKAHEAD_DAYS = 360;
const CHAMBER_EVENTS_URL = `${CHAMBER_BASE_URL}/events/search?Lookahead=${CHAMBER_EVENT_LOOKAHEAD_DAYS}`;
const CHAMBER_EVENTS_SCROLL_URL = `${CHAMBER_BASE_URL}/events/searchscroll`;
const SCCLD_CAMPBELL_LIBRARY_URL = "https://sccld.org/locations/campbell/";
const CAMPBELL_MUSEUMS_BASE_URL = "https://www.campbellmuseums.com";
const CAMPBELL_MUSEUMS_EVENTS_URL = `${CAMPBELL_MUSEUMS_BASE_URL}/events-main`;
const HERITAGE_THEATRE_BASE_URL = "https://www.heritagetheatre.org";
const HERITAGE_THEATRE_EVENTS_URL = `${HERITAGE_THEATRE_BASE_URL}/events-1`;
const CUSD_CALENDAR_URL = "https://www.campbellusd.org/calendar?locale=en";
const CUSD_ICS_SOURCES = [
  { label: "CUSD District Wide Events", id: "campbellusd.org_0nc5m32rifu1o7qnfhpi7k2nb0" },
  { label: "CUSD Public Meetings", id: "campbellusd.org_0k9apnhonup1kh5g71gfu76q8k" },
  { label: "CUSD No School Days", id: "campbellusd.org_dmvesuq2lbtv4spus72hhfb570" },
].map((source) => ({
  ...source,
  href: `https://calendar.google.com/calendar/ical/${encodeURIComponent(`${source.id}@group.calendar.google.com`)}/public/basic.ics`,
}));
// City Council agendas moved from the CivicEngage Agenda Center (frozen at
// Oct 7, 2025) to the city's eScribe portal; Planning Commission still posts
// to the Agenda Center.
const ESCRIBE_BASE_URL = "https://pub-campbell.escribemeetings.com";
const ESCRIBE_PORTAL_URL = `${ESCRIBE_BASE_URL}/`;
const ESCRIBE_CALENDAR_API_URL = `${ESCRIBE_BASE_URL}/MeetingsCalendarView.aspx/GetCalendarMeetings`;
const ESCRIBE_LOOKBACK_DAYS = 150;
const ESCRIBE_LOOKAHEAD_DAYS = 45;
const PLANNING_COMMISSION_URL = `${CITY_BASE_URL}/AgendaCenter/Planning-Commission-6`;
const PUBLIC_NOTICES_URL = `${CITY_BASE_URL}/530/Public-Notices`;
const PUBLIC_NOTICE_ARCHIVES = [
  { body: "City Council", href: `${CITY_BASE_URL}/Archive.aspx?AMID=43`, limit: 8 },
  { body: "Planning Commission", href: `${CITY_BASE_URL}/Archive.aspx?AMID=44`, limit: 10 },
];
const MAX_NOTICE_PDF_BYTES = 4_000_000;
const USER_AGENT = "stanwood.dev Campbell guide data sync (public pages; respectful one-shot fetch)";
const CHAMBER_ALPHA_SLUGS = ["0-9", ..."abcdefghijklmnopqrstuvwxyz"];

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
    .replace(/&gt;/g, ">")
    .replace(/\u2014/g, " - ");
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

async function fetchOptionalText(url, label) {
  try {
    return { html: await fetchText(url), error: "" };
  } catch (err) {
    return { html: "", error: `${label}: ${err.message}` };
  }
}

async function fetchIcsText(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      "accept": "text/calendar,text/plain",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }

  return res.text();
}

function extractJsonScript(html, id) {
  const match = html.match(new RegExp(`<script[^>]*id="${id}"[^>]*>([\\s\\S]*?)<\\/script>`, "i"));
  if (!match) return null;

  try {
    return JSON.parse(match[1]);
  } catch (err) {
    throw new Error(`Failed to parse ${id}: ${err.message}`);
  }
}

async function fetchDocumentText(url) {
  // eScribe rejects Node's TLS trust store; download those PDFs via curl.
  if (new URL(url).hostname.endsWith("escribemeetings.com")) {
    let buffer;
    try {
      buffer = curlRequest(url, { maxBytes: MAX_NOTICE_PDF_BYTES });
    } catch (err) {
      return { text: "", skipped: err.message || "Failed to fetch PDF via curl" };
    }
    return documentBufferToText(buffer, { contentType: "application/pdf" });
  }

  let contentLength = 0;
  let contentType = "";
  try {
    const head = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(15_000),
      headers: {
        "user-agent": USER_AGENT,
        "accept": "application/pdf",
      },
    });
    contentLength = Number(head.headers.get("content-length") ?? 0);
    contentType = head.headers.get("content-type") ?? "";
  } catch {
    contentLength = 0;
  }

  if (contentLength > MAX_NOTICE_PDF_BYTES) {
    return { text: "", skipped: `PDF is ${Math.round(contentLength / 1024 / 1024)}MB` };
  }

  const res = await fetch(url, {
    signal: AbortSignal.timeout(25_000),
    headers: {
      "user-agent": USER_AGENT,
      "accept": "application/pdf",
    },
  });

  if (!res.ok) {
    return { text: "", skipped: `Failed to fetch PDF: ${res.status}` };
  }
  const getContentLength = Number(res.headers.get("content-length") ?? 0);
  if (getContentLength > MAX_NOTICE_PDF_BYTES) {
    return { text: "", skipped: `PDF is ${Math.round(getContentLength / 1024 / 1024)}MB` };
  }
  contentType ||= res.headers.get("content-type") ?? "";

  let buffer;
  try {
    buffer = await readLimitedResponse(res, MAX_NOTICE_PDF_BYTES);
  } catch (err) {
    return { text: "", skipped: err.message || "PDF exceeded read limit" };
  }
  return documentBufferToText(buffer, { contentType });
}

function bufferLooksLikePdf(buffer) {
  return buffer.subarray(0, 5).toString("latin1") === "%PDF-";
}

function bufferLooksLikeOleDocument(buffer) {
  return buffer.length >= 8 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0 &&
    buffer[4] === 0xa1 &&
    buffer[5] === 0xb1 &&
    buffer[6] === 0x1a &&
    buffer[7] === 0xe1;
}

async function documentBufferToText(buffer, { contentType = "" } = {}) {
  const normalizedType = contentType.toLowerCase();
  if (normalizedType.includes("pdf") || bufferLooksLikePdf(buffer)) {
    return pdfBufferToText(buffer);
  }

  if (
    normalizedType.includes("msword") ||
    normalizedType.includes("wordprocessingml") ||
    bufferLooksLikeOleDocument(buffer)
  ) {
    return wordBufferToText(buffer, {
      extension: normalizedType.includes("wordprocessingml") ? ".docx" : ".doc",
    });
  }

  return { text: "", skipped: `Unsupported notice document type${contentType ? `: ${contentType}` : ""}` };
}

async function pdfBufferToText(buffer) {
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

async function wordBufferToText(buffer, { extension = ".doc" } = {}) {
  const dir = await mkdtemp(resolve(tmpdir(), "campbell-notice-"));
  const docPath = resolve(dir, `notice${extension}`);

  try {
    await writeFile(docPath, buffer);
    const result = spawnSync(
      "textutil",
      ["-convert", "txt", "-stdout", docPath],
      { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 },
    );

    if (result.error) {
      return { text: "", skipped: result.error.message };
    }
    if (result.status !== 0 && !result.stdout) {
      return { text: "", skipped: result.stderr.trim() || "textutil failed" };
    }

    return { text: result.stdout, skipped: "" };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function readLimitedResponse(res, limitBytes) {
  if (!res.body) {
    return Buffer.from(await res.arrayBuffer());
  }

  const chunks = [];
  let total = 0;
  const reader = res.body.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limitBytes) {
      await reader.cancel();
      throw new Error(`PDF exceeds ${Math.round(limitBytes / 1024 / 1024)}MB limit`);
    }
    chunks.push(Buffer.from(value));
  }

  return Buffer.concat(chunks);
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
        websiteUrl: "",
        description: "",
        tags: ["Downtown"],
        source: "Downtown Campbell Directory",
        sourceUrl: DIRECTORY_URL,
      };
    })
    .filter(Boolean);
}

function parseChamberBusinesses(html, sourceUrl) {
  return html
    .split('<div class="gz-list-card-wrapper')
    .slice(1)
    .map((block) => {
      const card = `<div class="gz-list-card-wrapper${block}`;
      const titleLink = card.match(/<h5[^>]*class="[^"]*gz-card-title[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h5>/i);
      const name = cleanHtml(titleLink?.[2] ?? "");
      const url = absoluteUrl(titleLink?.[1] ?? "", CHAMBER_BASE_URL);
      const description = cleanHtml(card.match(/<p[^>]*class="[^"]*gz-member-description[^"]*"[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "").slice(0, 260);
      const addressBlock = card.match(/<li[^>]*class="[^"]*gz-card-address[^"]*"[^>]*>([\s\S]*?)<\/li>/i)?.[1] ?? "";
      const streetParts = [...addressBlock.matchAll(/<span[^>]*class="[^"]*gz-street-address[^"]*"[^>]*>([\s\S]*?)<\/span>/gi)]
        .map(([, part]) => cleanHtml(part))
        .filter(Boolean);
      const city = cleanHtml(addressBlock.match(/<span[^>]*class="[^"]*gz-address-city[^"]*"[^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? "");
      const cityStateZip = cleanHtml(addressBlock.match(/<div[^>]*itemprop="citystatezip"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? "");
      const address = [...streetParts, cityStateZip].filter(Boolean).join(", ");
      const phone = cleanHtml(card.match(/<li[^>]*class="[^"]*gz-card-phone[^"]*"[^>]*>[\s\S]*?<span>([\s\S]*?)<\/span>/i)?.[1] ?? "");
      const websiteUrl = absoluteUrl(card.match(/<li[^>]*class="[^"]*gz-card-website[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"/i)?.[1] ?? "", CHAMBER_BASE_URL);
      const imageUrl = absoluteUrl(card.match(/<img[^>]*class="[^"]*gz-results-img[^"]*"[^>]*src="([^"]+)"/i)?.[1] ?? "", CHAMBER_BASE_URL);

      if (!name || !url) return null;

      return {
        name,
        phone,
        address,
        city,
        url,
        websiteUrl,
        imageUrl,
        description,
        tags: ["Chamber"],
        source: "Campbell Chamber Directory",
        sourceUrl,
      };
    })
    .filter(Boolean);
}

function isCampbellLocatedBusiness(business) {
  const text = `${business.address} ${business.city}`.toLowerCase();
  return /\bcampbell\b/.test(text) || /\b95008\b/.test(text);
}

function businessKey(business) {
  return normalizeKeyPart(business.name);
}

function hasCampbellMemberSlug(business) {
  try {
    const pathname = new URL(business.url).pathname.toLowerCase();
    return /(?:^|-)campbell(?:-|$)/.test(pathname);
  } catch {
    return false;
  }
}

function hasLocalPhone(business) {
  return /^\(?(?:408|669)\)?/.test(business.phone ?? "");
}

function duplicateBusinessScore(business) {
  let score = 0;

  // The Chamber can expose duplicate records with the same public name. For a
  // Campbell guide, keep the member page that is explicitly scoped to Campbell.
  if (hasCampbellMemberSlug(business)) score += 40;
  if (hasLocalPhone(business)) score += 8;
  if (business.websiteUrl) score += 4;
  if (business.imageUrl) score += 3;
  if (business.description) score += 2;
  if (business.address) score += 1;
  if (business.phone) score += 1;

  return score;
}

function preferredDuplicateBusiness(existing, business) {
  if (existing.source !== business.source) return existing;

  const existingScore = duplicateBusinessScore(existing);
  const businessScore = duplicateBusinessScore(business);

  return businessScore > existingScore ? business : existing;
}

function mergeBusinesses(...feeds) {
  const byKey = new Map();

  for (const business of feeds.flat()) {
    const key = businessKey(business);
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, business);
      continue;
    }

    const tags = new Set([...(existing.tags ?? []), ...(business.tags ?? [])]);
    const sources = new Set([existing.source, business.source].filter(Boolean));
    const sourceUrls = new Set([
      existing.sourceUrl,
      ...(existing.additionalSourceUrls ?? []),
      business.sourceUrl,
      ...(business.additionalSourceUrls ?? []),
    ].filter(Boolean));
    const preferred = preferredDuplicateBusiness(existing, business);
    const fallback = preferred === existing ? business : existing;

    byKey.set(key, {
      ...preferred,
      phone: preferred.phone || fallback.phone,
      address: preferred.address || fallback.address,
      city: preferred.city || fallback.city,
      url: preferred.url || fallback.url,
      websiteUrl: preferred.websiteUrl || fallback.websiteUrl,
      imageUrl: preferred.imageUrl || fallback.imageUrl,
      description: preferred.description || fallback.description,
      tags: [...tags],
      source: [...sources].join(" + "),
      additionalSourceUrls: [...sourceUrls].filter((url) => url !== preferred.sourceUrl),
    });
  }

  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function normalizeKeyPart(value = "") {
  return cleanSentence(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function downtownYearForMonthDay(month, day, referenceDate = new Date()) {
  const referenceYear = referenceDate.getFullYear();
  const candidate = new Date(referenceYear, month - 1, day);
  const reference = new Date(referenceYear, referenceDate.getMonth(), referenceDate.getDate());
  const daysFromReference = Math.round((candidate.getTime() - reference.getTime()) / 86_400_000);

  // Downtown omits the year on some upcoming cards. If the month/day appears
  // far behind the sync date, it is almost certainly an early-next-year event.
  return daysFromReference < -45 ? referenceYear + 1 : referenceYear;
}

function downtownIsoDate(year, month, day, time = "00:00:00") {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${time}`;
}

function parseDowntownDateRange(date = "", referenceDate = new Date()) {
  const cleaned = cleanSentence(date);
  const fullDate = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (fullDate) {
    const year = fullDate[3].length === 2 ? `20${fullDate[3]}` : fullDate[3];
    return { startDate: downtownIsoDate(year, fullDate[1], fullDate[2]) };
  }

  const monthDayRange = cleaned.match(/^(\d{1,2})\/(\d{1,2})(?:\s*-\s*(\d{1,2})\/(\d{1,2}))?/);
  if (!monthDayRange) return { startDate: "" };

  const startMonth = Number(monthDayRange[1]);
  const startDay = Number(monthDayRange[2]);
  const startYear = downtownYearForMonthDay(startMonth, startDay, referenceDate);
  const range = { startDate: downtownIsoDate(startYear, startMonth, startDay) };

  if (monthDayRange[3] && monthDayRange[4]) {
    const endMonth = Number(monthDayRange[3]);
    const endDay = Number(monthDayRange[4]);
    const endYear = endMonth < startMonth ? startYear + 1 : startYear;
    range.endDate = downtownIsoDate(endYear, endMonth, endDay, "23:59:59");
  }

  return range;
}

function parseCityCalendarEndDate(date = "", startDate = "") {
  const cleaned = cleanSentence(date);
  const match = cleaned.match(/-\s*([A-Z][a-z]+)\s+(\d{1,2}),\s+(\d{4})/);
  if (!match) return "";

  const month = MONTH_NUMBERS[match[1].slice(0, 3).toLowerCase()];
  if (!month) return "";

  const day = match[2].padStart(2, "0");
  const datePart = `${match[3]}-${month}-${day}`;
  if (datePart === startDate.slice(0, 10)) return "";

  return `${datePart}T23:59:59`;
}

function cityCalendarIsoDate(year, month, day, hour = 0, minute = 0, second = 0) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
}

function parseCityCalendarTime(hour, minute = "0", meridiem = "") {
  let parsedHour = Number(hour);
  const lowerMeridiem = meridiem.toLowerCase();
  if (lowerMeridiem === "pm" && parsedHour < 12) parsedHour += 12;
  if (lowerMeridiem === "am" && parsedHour === 12) parsedHour = 0;
  return {
    hour: parsedHour,
    minute: Number(minute),
  };
}

function cityCalendarDateParts(year, month, day, offsetDays = 0) {
  const date = new Date(Number(year), Number(month) - 1, Number(day) + offsetDays);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

function parseCityCalendarDate(date = "") {
  const cleaned = cleanSentence(date);
  const start = cleaned.match(/^([A-Z][a-z]+)\s+(\d{1,2}),\s+(\d{4})(?:,\s+(\d{1,2})(?::(\d{2}))?\s*(AM|PM))?/i);
  if (!start) return { startDate: "", endDate: "" };

  const startMonth = MONTH_NUMBERS[start[1].slice(0, 3).toLowerCase()];
  if (!startMonth) return { startDate: "", endDate: "" };

  const startTime = start[4]
    ? parseCityCalendarTime(start[4], start[5], start[6])
    : { hour: 0, minute: 0 };
  const startDate = cityCalendarIsoDate(start[3], startMonth, start[2], startTime.hour, startTime.minute);
  const range = { startDate, endDate: "" };
  const endText = cleaned.slice(start[0].length).match(/^\s*-\s*(.+)$/)?.[1] ?? "";
  if (!endText) return range;

  const explicitEnd = endText.match(/^([A-Z][a-z]+)\s+(\d{1,2}),\s+(\d{4}),?\s+(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  const sameDayEnd = endText.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  const endMatch = explicitEnd ?? sameDayEnd;
  if (!endMatch) return range;

  const endTime = explicitEnd
    ? parseCityCalendarTime(explicitEnd[4], explicitEnd[5], explicitEnd[6])
    : parseCityCalendarTime(sameDayEnd[1], sameDayEnd[2], sameDayEnd[3]);
  const endParts = explicitEnd
    ? {
        year: Number(explicitEnd[3]),
        month: Number(MONTH_NUMBERS[explicitEnd[1].slice(0, 3).toLowerCase()]),
        day: Number(explicitEnd[2]),
      }
    : cityCalendarDateParts(start[3], startMonth, start[2]);

  if (!endParts.month) return range;

  if (!explicitEnd) {
    const endBeforeStart =
      endTime.hour < startTime.hour ||
      (endTime.hour === startTime.hour && endTime.minute < startTime.minute);
    if (endBeforeStart) {
      Object.assign(endParts, cityCalendarDateParts(start[3], startMonth, start[2], 1));
    }
  }

  range.endDate = cityCalendarIsoDate(endParts.year, endParts.month, endParts.day, endTime.hour, endTime.minute);
  return range;
}

function canonicalCityCalendarUrl(url = "", startDate = "") {
  const dateMatch = startDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!url || !dateMatch) return url;

  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("EID")) return url;

    parsed.searchParams.set("month", String(Number(dateMatch[2])));
    parsed.searchParams.set("year", dateMatch[1]);
    parsed.searchParams.set("day", String(Number(dateMatch[3])));
    return parsed.toString();
  } catch {
    return url;
  }
}

function cityCalendarMonthUrls(referenceDate = new Date()) {
  const currentMonth = new Date(referenceDate);
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const nextMonth = new Date(currentMonth);
  nextMonth.setMonth(currentMonth.getMonth() + 1);

  return [currentMonth, nextMonth].map((date) =>
    `${CITY_CALENDAR_URL}&year=${date.getFullYear()}&month=${date.getMonth() + 1}`,
  );
}

function eventTimestamp(event) {
  const parsed = Date.parse(event.startDate || "");
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

function eventEndTimestamp(event) {
  const parsed = Date.parse(event.endDate || event.startDate || "");
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

function eventEndsBeforeReferenceDay(event, referenceDate = new Date()) {
  const referenceDay = new Date(referenceDate);
  referenceDay.setHours(0, 0, 0, 0);
  return eventEndTimestamp(event) < referenceDay.getTime();
}

function eventKey(event) {
  const startDate = event.startDate || event.date || "";
  const hasSpecificTime = /\d{4}-\d{2}-\d{2}T(?!00:00)/.test(startDate);
  const title = normalizeKeyPart(event.title);
  const titleKey = hasSpecificTime
    ? title.split(" ").slice(0, 3).join(" ") || title
    : title;
  const dateKey = hasSpecificTime ? startDate.slice(0, 16) : startDate.slice(0, 10);
  return `${titleKey}|${dateKey}`;
}

function splitEventSourceNames(source = "") {
  return source
    .split(/\s+\+\s+/)
    .map((name) => name.trim())
    .filter(Boolean);
}

function eventDateKey(event) {
  return (event.startDate || event.date || "").slice(0, 10);
}

function eventSeriesDateKey(event) {
  const words = normalizeKeyPart(event.title).split(" ").filter(Boolean);
  const titleKey = words.slice(0, 3).join(" ") || words.join(" ");
  return `${titleKey}|${eventDateKey(event)}`;
}

function hasSpecificEventTime(event) {
  return /\d{4}-\d{2}-\d{2}T(?!00:00)/.test(event.startDate || "");
}

const GENERIC_EVENT_TITLE_WORDS = new Set([
  "and",
  "annual",
  "campbell",
  "center",
  "class",
  "classes",
  "concert",
  "event",
  "events",
  "for",
  "from",
  "national",
  "present",
  "presents",
  "show",
  "the",
  "theatre",
  "touring",
  "tribute",
  "with",
]);

function eventTitleTokens(title = "") {
  return normalizeKeyPart(title)
    .split(" ")
    .filter((word) => word.length > 2 && !GENERIC_EVENT_TITLE_WORDS.has(word));
}

function titleTokensOverlap(firstTitle = "", secondTitle = "") {
  const firstTokens = new Set(eventTitleTokens(firstTitle));
  const secondTokens = new Set(eventTitleTokens(secondTitle));
  let overlap = 0;

  for (const token of firstTokens) {
    if (secondTokens.has(token)) overlap += 1;
  }

  return overlap;
}

function eventLocationsOverlap(firstEvent, secondEvent) {
  const first = normalizeKeyPart(firstEvent.location ?? "").replace(/\bcampbell\b/g, "").trim();
  const second = normalizeKeyPart(secondEvent.location ?? "").replace(/\bcampbell\b/g, "").trim();
  if (!first || !second) return false;
  return first.includes(second) || second.includes(first);
}

function eventTitlesLookSame(firstEvent, secondEvent) {
  const firstTitle = normalizeKeyPart(firstEvent.title);
  const secondTitle = normalizeKeyPart(secondEvent.title);
  if (!firstTitle || !secondTitle) return false;
  if (firstTitle === secondTitle) return true;
  if (firstTitle.length > 10 && secondTitle.includes(firstTitle)) return true;
  if (secondTitle.length > 10 && firstTitle.includes(secondTitle)) return true;

  const overlap = titleTokensOverlap(firstEvent.title, secondEvent.title);
  if (overlap >= 3) return true;
  return overlap >= 2 && eventLocationsOverlap(firstEvent, secondEvent);
}

function eventListingsLookSame(firstEvent, secondEvent) {
  if (eventDateKey(firstEvent) !== eventDateKey(secondEvent)) return false;
  if (eventSeriesDateKey(firstEvent) === eventSeriesDateKey(secondEvent)) return true;
  return eventTitlesLookSame(firstEvent, secondEvent);
}

function cleanEventTitle(value = "") {
  return cleanSentence(value)
    .replace(/\bTranspsortation\b/g, "Transportation");
}

function eventWithCleanTitle(event) {
  return {
    ...event,
    title: cleanEventTitle(event.title ?? ""),
  };
}

function eventRejectionReason(event) {
  const title = cleanSentence(event.title);
  const text = [
    title,
    event.category ?? "",
    event.source ?? "",
    event.description ?? "",
    ...(event.topics ?? []),
  ].join(" ");

  if ((event.topics ?? []).includes("CUSD No School Days")) return "school closure";
  if (/campbell community center pool calendar/i.test(event.category ?? "") && /\b(?:closed|closure|no\b|practice|team)\b/i.test(title)) {
    return "pool operations notice";
  }
  if (/campbell library events/i.test(event.source ?? "") && /\bclosed\b/i.test(title)) {
    return "library closure";
  }

  const titleBlocks = [
    [/\bno\s+.+\bpractice\b/i, "practice absence"],
    [/\b(?:team|wave|swim)\s+practice\b/i, "team practice"],
    [/\b(?:cancelled|canceled|closure)\b/i, "cancellation notice"],
    [/\b(?:library|pool|facility|programs?|office)\s+closed\b/i, "closure notice"],
    [/\bclosed\s+for\b/i, "closure notice"],
    [/\bno\s+(?:class|classes|programs?|practice|school|swim)\b/i, "absence notice"],
    [/^CCC Pool Closed$/i, "pool closure"],
    [/^Juneteenth Holiday \(programs closed\)$/i, "school closure"],
    [/^(?:Thanksgiving|Winter|Spring|Presidents'? Week)\s+Break$/i, "school break"],
    [/\bProfessional Development Day\b/i, "school staff day"],
    [/\bCAASPP Window\b/i, "testing window"],
    [/\bIntervention Conferences\b/i, "school admin window"],
    [/\b(?:application|registration)\s+deadline\b/i, "deadline"],
    [/\btryouts?\b/i, "tryout notice"],
  ];

  for (const [pattern, reason] of titleBlocks) {
    if (pattern.test(title)) return reason;
  }

  if (/\b(?:SUID|SUNet ID)\b/i.test(text)) return "affiliate-only";
  if (/\b(?:staff training|pay day|fidelity appointment|terminalfour)\b/i.test(text)) return "internal notice";

  return "";
}

function filterPublicEvents(events) {
  return events.filter((event) => !eventRejectionReason(event));
}

async function readExistingSourceEvents({ source, sourceUrl, generatedAt }) {
  const existingPath = resolve(DATA_DIR, "campbellEvents.json");
  let payload;

  try {
    payload = JSON.parse(await readFile(existingPath, "utf8"));
  } catch (err) {
    console.warn(`Warning: could not read previous Campbell events for ${source}: ${err.message}`);
    return [];
  }

  const today = new Date(generatedAt);
  today.setHours(0, 0, 0, 0);
  const oneYearOut = new Date(today);
  oneYearOut.setFullYear(oneYearOut.getFullYear() + 1);

  return (Array.isArray(payload.items) ? payload.items : [])
    .filter((event) => {
      const fromSource =
        splitEventSourceNames(event.source).includes(source) ||
        event.sourceUrl === sourceUrl ||
        (event.additionalSourceUrls ?? []).includes(sourceUrl);
      if (!fromSource) return false;

      const timestamp = eventTimestamp(event);
      if (timestamp === Number.MAX_SAFE_INTEGER) return true;
      return timestamp >= today.getTime() && timestamp <= oneYearOut.getTime();
    })
    .sort((a, b) => eventTimestamp(a) - eventTimestamp(b) || a.title.localeCompare(b.title));
}

function parseDowntownEvents(html, referenceDate = new Date()) {
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
      const description = truncateEventDescription(cleanHtml(body?.[1] ?? ""));
      const imageUrl = absoluteUrl(image?.[1] ?? "");
      const { startDate, endDate } = parseDowntownDateRange(date, referenceDate);

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
        ...(endDate ? { endDate } : {}),
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
        const date = cleanHtml(itemHtml.match(/<div[^>]*class="date"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? "");
        const parsedDate = parseCityCalendarDate(date);
        const startDate =
          cleanHtml(itemHtml.match(/<span[^>]*itemprop="startDate"[^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? "") ||
          parsedDate.startDate;
        const url = canonicalCityCalendarUrl(absoluteUrl(titleLink?.[1] ?? "", CITY_BASE_URL), startDate);
        const description = cleanHtml(
          itemHtml.match(/<p[^>]*itemprop="description"[^>]*>([\s\S]*?)<\/p>/i)?.[1] ??
          itemHtml.match(/<div[^>]*itemscope[^>]*>[\s\S]*?<\/div>\s*<p>([\s\S]*?)<\/p>/i)?.[1] ??
          "",
        ).slice(0, 280);
        const location = extractCalendarLocation(itemHtml);
        const endDate = parsedDate.endDate || parseCityCalendarEndDate(date, startDate);

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
          ...(endDate ? { endDate } : {}),
          source: "City of Campbell Calendar",
          sourceUrl: CITY_CALENDAR_URL,
        };
      })
      .filter(Boolean);
  });
}

const MONTH_NUMBERS = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

function parseLibraryEventStartDate(dateTime = "", referenceDate = new Date()) {
  const match = cleanSentence(dateTime).match(/\b([A-Z][a-z]{2})\s+(\d{1,2})(?:st|nd|rd|th)?\s*\|\s*(\d{1,2})(?::(\d{2}))?\s*([ap]m)?/i);
  if (!match) return "";

  const month = MONTH_NUMBERS[match[1].slice(0, 3).toLowerCase()];
  if (!month) return "";

  let year = referenceDate.getFullYear();
  const day = match[2].padStart(2, "0");
  let hour = Number(match[3]);
  const minute = (match[4] ?? "00").padStart(2, "0");
  const meridiem = (match[5] ?? "").toLowerCase();

  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;

  const candidate = new Date(year, Number(month) - 1, Number(day));
  const referenceStart = new Date(referenceDate);
  referenceStart.setHours(0, 0, 0, 0);
  if (candidate.getTime() < referenceStart.getTime() - 30 * 24 * 60 * 60 * 1000) {
    year += 1;
  }

  return `${year}-${month}-${day}T${String(hour).padStart(2, "0")}:${minute}:00`;
}

function extractLibraryEventsSection(html) {
  const start = html.search(/<section[\s\S]{0,1000}?In-Person\s*<span[^>]*>\s*Events/i);
  if (start < 0) return "";

  const nextSection = html.slice(start + 1).search(/<section[\s\S]{0,1000}?Online\s*<span[^>]*>\s*Events/i);
  if (nextSection < 0) return html.slice(start);

  return html.slice(start, start + 1 + nextSection);
}

function titleLooksTruncated(title = "") {
  return /(?:\u2026|\.{3})$/.test(title.trim());
}

function titleBase(title = "") {
  return cleanEventTitle(title).replace(/\s*(?:\u2026|\.{3})$/, "").trim();
}

function libraryAnalyticsTitleCandidates(itemHtml = "") {
  return [...itemHtml.matchAll(/\b(?:data-impression|data-analytics)='([^']+)'/gi)]
    .flatMap(([, rawPayload]) => {
      try {
        const payload = JSON.parse(decodeHtml(rawPayload));
        const entries = Array.isArray(payload) ? payload : [payload];

        return entries.flatMap((entry) => [
          entry?.entities?.event?.event_series_title,
          entry?.entities?.event?.event_title,
          entry?.entities?.metadata?.metadata_value,
          entry?.entities?.ui?.ui_component_label,
        ]);
      } catch {
        return [];
      }
    })
    .map((candidate) => cleanEventTitle(candidate ?? ""))
    .filter(Boolean);
}

function libraryEventTitle(itemHtml = "", fallbackTitle = "") {
  const fallback = cleanEventTitle(fallbackTitle);
  if (!titleLooksTruncated(fallback)) return fallback;

  const fallbackBase = normalizeKeyPart(titleBase(fallback));
  const fullTitle = libraryAnalyticsTitleCandidates(itemHtml)
    .find((candidate) => {
      if (titleLooksTruncated(candidate)) return false;
      return normalizeKeyPart(candidate).startsWith(fallbackBase);
    });

  return fullTitle || fallback;
}

function parseLibraryEvents(html, referenceDate = new Date()) {
  const section = extractLibraryEventsSection(html);
  const events = [...section.matchAll(/<li[^>]*class="[^"]*c-events-widget__event[^"]*"[^>]*>([\s\S]*?)<\/li>/gi)];

  return events
    .map(([, itemHtml]) => {
      const titleLink = itemHtml.match(/<h3[^>]*class="[^"]*c-events-widget__event-title[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      const title = libraryEventTitle(itemHtml, cleanHtml(titleLink?.[2] ?? ""));
      const url = absoluteUrl(titleLink?.[1] ?? "", "https://sccl.bibliocommons.com");
      const date = cleanHtml(itemHtml.match(/<div[^>]*data-key="event-date-time"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? "");
      const location = cleanHtml(
        itemHtml.match(/<div[^>]*class="[^"]*c-events-widget__event-location[^"]*"[^>]*>[\s\S]*?<span[^>]*class="[^"]*notranslate[^"]*"[^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? "",
      );
      const startDate = parseLibraryEventStartDate(date, referenceDate);

      if (!title || !url || !date) return null;

      return {
        title,
        date,
        cost: "Free",
        location: location || "Campbell Library",
        description: "",
        url,
        imageUrl: "",
        category: "Campbell Library",
        startDate,
        source: "Campbell Library Events",
        sourceUrl: SCCLD_CAMPBELL_LIBRARY_URL,
      };
    })
    .filter(Boolean);
}

function parseGrowthZoneResultsCount(html) {
  const value = cleanHtml(html.match(/<span[^>]*class="[^"]*gz-results-count[^"]*"[^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? "");
  return Number(value.replace(/,/g, "")) || 0;
}

function parseChamberEventCards(html) {
  return html
    .split('<div class="gz-list-card-wrapper')
    .slice(1)
    .map((block) => {
      const card = `<div class="gz-list-card-wrapper${block}`;
      const titleLink = card.match(/<h5[^>]*class="[^"]*gz-card-title[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      const title = cleanHtml(titleLink?.[2] ?? "");
      const url = absoluteUrl(titleLink?.[1] ?? "", CHAMBER_BASE_URL);
      const description = cleanHtml(card.match(/<p[^>]*class="[^"]*gz-events-description[^"]*"[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "").slice(0, 280);
      const imageUrl = absoluteUrl(card.match(/<img[^>]*class="[^"]*gz-events-img[^"]*"[^>]*src="([^"]+)"/i)?.[1] ?? "", CHAMBER_BASE_URL);
      const dateSpans = [...card.matchAll(/<span[^>]*content="([^"]+)"[^>]*>([\s\S]*?)<\/span>/gi)]
        .map(([, content, label]) => ({
          content: cleanSentence(content),
          label: cleanHtml(label),
        }))
        .filter((date) => date.content && date.label);
      const startDate = dateSpans[0]?.content ?? "";
      const visibleDates = dateSpans.map((date) => date.label);
      const metaEndDate = cleanSentence(card.match(/<meta[^>]*content="([^"]+)"/i)?.[1] ?? "");
      const endDate = dateSpans[1]?.content || metaEndDate;
      const categories = [...card.matchAll(/<span[^>]*class="[^"]*gz-cat[^"]*"[^>]*>([\s\S]*?)<\/span>/gi)]
        .map(([, category]) => cleanHtml(category))
        .filter((category) => category && category !== "Categories:");

      if (!title || !url || !startDate) return null;

      return {
        title,
        date: visibleDates.length > 1 ? visibleDates.join(" - ") : visibleDates[0] || startDate,
        cost: "",
        location: "",
        description,
        url,
        imageUrl,
        category: "Chamber",
        startDate,
        ...(endDate && endDate !== startDate ? { endDate } : {}),
        source: "Campbell Chamber Events",
        sourceUrl: CHAMBER_EVENTS_URL,
        ...(categories.length ? { topics: categories } : {}),
      };
    })
    .filter(Boolean);
}

function extractWixImageUrl(image) {
  if (!image || typeof image !== "object") return "";

  const direct = image.url || image.src || image.mediaImage?.url || image.image?.url || "";
  if (direct) return direct;

  const id = image.id || image.uri || image.mediaImage?.id || image.image?.id || "";
  if (/^https?:\/\//i.test(id)) return id;
  if (id) return `https://static.wixstatic.com/media/${id}`;

  return "";
}

function extractWixCost(event) {
  const registration = event.registration ?? {};
  const tickets = registration.tickets ?? registration.ticketing ?? {};
  const cost =
    tickets.lowestPriceFormatted ??
    tickets.lowestTicketPriceFormatted ??
    tickets.priceFormatted ??
    tickets.price ??
    "";

  return cleanSentence(typeof cost === "string" ? cost : String(cost));
}

function extractWixLocation(event) {
  const name = cleanSentence(event.location?.name ?? "");
  const address = cleanSentence(event.location?.address ?? "");

  if (!name || name.toLowerCase() === "campbell") return address || name;
  return name;
}

function parseWixEvents(html, { baseUrl, sourceUrl, source, category }) {
  const warmupData = extractJsonScript(html, "wix-warmup-data");
  const appsWarmupData = warmupData?.appsWarmupData ?? {};
  const byId = new Map();

  for (const app of Object.values(appsWarmupData)) {
    if (!app || typeof app !== "object") continue;

    for (const widget of Object.values(app)) {
      const wixEvents = widget?.events?.events;
      if (!Array.isArray(wixEvents)) continue;

      for (const event of wixEvents) {
        const dates = widget?.dates?.events?.[event.id] ?? {};
        const title = cleanSentence(event.title ?? "");
        const descriptionSource =
          typeof event.description === "string" ? event.description :
          typeof event.about === "string" ? event.about :
          "";
        const date = cleanSentence(
          dates.fullDate ??
          event.scheduling?.startDateFormatted ??
          event.scheduling?.formattedStartDate ??
          "",
        );
        const startDate = cleanSentence(
          dates.startDateISOFormatNotUTC ??
          event.scheduling?.config?.startDate ??
          event.scheduling?.startDate ??
          "",
        );
        const endDate = cleanSentence(
          dates.endDateISOFormatNotUTC ??
          event.scheduling?.config?.endDate ??
          event.scheduling?.endDate ??
          "",
        );

        if (!title || !date) continue;

        const key = event.id || eventKey({ title, startDate, date });
        byId.set(key, {
          title,
          date,
          cost: extractWixCost(event),
          location: extractWixLocation(event),
          description: cleanSentence(cleanHtml(descriptionSource)).slice(0, 280),
          url: event.slug ? absoluteUrl(`/event-details/${event.slug}`, baseUrl) : sourceUrl,
          imageUrl: extractWixImageUrl(event.mainImage ?? event.coverImage ?? event.image),
          category,
          startDate,
          ...(endDate && endDate !== startDate ? { endDate } : {}),
          source,
          sourceUrl,
        });
      }
    }
  }

  return [...byId.values()].sort((a, b) => eventTimestamp(a) - eventTimestamp(b) || a.title.localeCompare(b.title));
}

function unfoldIcs(value = "") {
  return value.replace(/\r?\n[ \t]/g, "");
}

function readIcsProperty(block = "", name = "") {
  return block.match(new RegExp(`^${name}(?:;[^:]*)?:(.*)$`, "m"))?.[1]?.trim() ?? "";
}

function decodeIcsValue(value = "") {
  return value
    .replace(/\\n/g, " ")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .replace(/\s+/g, " ")
    .trim();
}

function parseIcsDate(value = "") {
  const dateOnly = value.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (dateOnly) {
    return new Date(`${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}T00:00:00`);
  }

  const dateTime = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (!dateTime) return null;

  const [, year, month, day, hour, minute, second] = dateTime;
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}${value.endsWith("Z") ? "Z" : ""}`);
}

function localIso(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-") + `T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
}

function parseIcsEvents(text, { label, sourceUrl, calendarUrl, generatedAt }) {
  const today = new Date(generatedAt);
  today.setHours(0, 0, 0, 0);
  const oneYearOut = new Date(today);
  oneYearOut.setFullYear(oneYearOut.getFullYear() + 1);

  return [...unfoldIcs(text).matchAll(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/g)]
    .map(([, block]) => {
      const startValue = readIcsProperty(block, "DTSTART");
      const endValue = readIcsProperty(block, "DTEND");
      const start = parseIcsDate(startValue);
      const end = parseIcsDate(endValue);
      const title = decodeIcsValue(readIcsProperty(block, "SUMMARY"));
      const location = decodeIcsValue(readIcsProperty(block, "LOCATION"));
      const description = decodeIcsValue(cleanHtml(readIcsProperty(block, "DESCRIPTION"))).slice(0, 280);
      const url = decodeIcsValue(readIcsProperty(block, "URL")) || calendarUrl;

      if (!title || !start) return null;
      if (start < today || start > oneYearOut) return null;

      const date = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        ...(startValue.length > 8 ? { hour: "numeric", minute: "2-digit", timeZoneName: "short" } : {}),
      }).format(start);

      const event = {
        title,
        date,
        cost: "",
        location,
        description: description || `From ${label}.`,
        url,
        imageUrl: "",
        category: "Schools",
        startDate: localIso(start),
        source: "Campbell Union School District Events",
        sourceUrl,
        topics: [label],
      };

      if (end && end.getTime() !== start.getTime()) {
        const adjustedEnd = endValue.length === 8 ? new Date(end.getTime() - 1) : end;
        event.endDate = localIso(adjustedEnd);
      }

      return event;
    })
    .filter(Boolean)
    .sort((a, b) => eventTimestamp(a) - eventTimestamp(b) || a.title.localeCompare(b.title));
}

async function fetchChamberEventsHtml() {
  const firstPage = await fetchText(CHAMBER_EVENTS_URL);
  const total = parseGrowthZoneResultsCount(firstPage);
  const firstPageEvents = parseChamberEventCards(firstPage);
  const pageSize = firstPageEvents.length || 10;
  const pages = Math.min(Math.ceil((total || firstPageEvents.length) / pageSize), 12);
  const pagesHtml = [firstPage];

  for (let page = 2; page <= pages; page += 1) {
    await sleep(175);
    const url = `${CHAMBER_EVENTS_SCROLL_URL}?page=${page}&rendermode=partial&lookahead=${CHAMBER_EVENT_LOOKAHEAD_DAYS}`;
    const html = await fetchText(url);
    if (!/\S/.test(html)) break;
    pagesHtml.push(html);
  }

  return {
    html: pagesHtml.join("\n"),
    total,
  };
}

function mergeEventFeeds(...feeds) {
  const byKey = new Map();

  for (const rawEvent of feeds.flat()) {
    const event = eventWithCleanTitle(rawEvent);
    const key = eventKey(event);
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, event);
      continue;
    }

    const sourceNames = new Set([
      ...splitEventSourceNames(existing.source),
      ...splitEventSourceNames(event.source),
    ]);
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

  const mergedEvents = [...byKey.values()];
  const detailedEvents = [];

  for (const event of mergedEvents) {
    if (!hasSpecificEventTime(event)) continue;
    detailedEvents.push(event);
  }

  const mergedBroadDowntownEvents = new Set();

  for (const event of mergedEvents) {
    const sources = splitEventSourceNames(event.source);
    if (!sources.includes("Downtown Campbell Events") || hasSpecificEventTime(event)) continue;

    const matchingDetailedEvents = detailedEvents.filter((detailedEvent) =>
      eventListingsLookSame(event, detailedEvent),
    );

    for (const detailedEvent of matchingDetailedEvents) {
      const sourceNames = new Set([
        ...splitEventSourceNames(detailedEvent.source),
        ...sources,
      ]);
      const sourceUrls = new Set([
        detailedEvent.sourceUrl,
        ...(detailedEvent.additionalSourceUrls ?? []),
        event.sourceUrl,
        ...(event.additionalSourceUrls ?? []),
      ].filter(Boolean));

      detailedEvent.cost ||= event.cost;
      detailedEvent.location ||= event.location;
      detailedEvent.description ||= event.description;
      detailedEvent.imageUrl ||= event.imageUrl;
      detailedEvent.source = [...sourceNames].join(" + ");
      detailedEvent.additionalSourceUrls = [...sourceUrls].filter((url) => url !== detailedEvent.sourceUrl);
    }

    if (matchingDetailedEvents.length > 0) {
      mergedBroadDowntownEvents.add(event);
    }
  }

  return mergedEvents
    .filter((event) => {
      const sources = splitEventSourceNames(event.source);
      if (!sources.includes("Downtown Campbell Events") || hasSpecificEventTime(event)) return true;
      return !mergedBroadDowntownEvents.has(event);
    })
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

// Node's bundled CA store rejects escribemeetings.com's certificate chain
// (UNABLE_TO_GET_ISSUER_CERT_LOCALLY), so eScribe requests go through system
// curl, which uses the OS trust store.
function curlRequest(url, { method = "GET", body = "", contentType = "", maxBytes = 0 } = {}) {
  const args = [
    "-sS",
    "--fail",
    "--max-time", "30",
    "-A", USER_AGENT,
    "-X", method,
  ];
  if (contentType) args.push("-H", `Content-Type: ${contentType}`);
  if (body) args.push("--data", body);
  if (maxBytes > 0) args.push("--max-filesize", String(maxBytes));
  args.push(url);

  const result = spawnSync("curl", args, { maxBuffer: 32 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`curl ${method} ${url} failed: ${result.stderr?.toString().trim() || `exit ${result.status}`}`);
  }
  return result.stdout;
}

function stripHtmlToText(html = "") {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function parseEscribeStartDate(value = "") {
  // eScribe dates look like "2026/06/02 19:00:36".
  const match = value.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function pickEscribeDoc(docs, type, format = "") {
  return docs.find((doc) => doc?.Type === type && (!format || (doc?.Format ?? "").toLowerCase() === format));
}

function escribeDocUrl(doc) {
  return doc?.Url ? absoluteUrl(doc.Url, ESCRIBE_BASE_URL) : "";
}

async function fetchEscribeCouncilRecords() {
  const toDateInput = (date) => date.toISOString().slice(0, 10);
  const now = Date.now();
  const raw = curlRequest(ESCRIBE_CALENDAR_API_URL, {
    method: "POST",
    contentType: "application/json",
    body: JSON.stringify({
      calendarStartDate: toDateInput(new Date(now - ESCRIBE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000)),
      calendarEndDate: toDateInput(new Date(now + ESCRIBE_LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000)),
    }),
  });

  const payload = JSON.parse(raw.toString("utf8"));
  const meetings = Array.isArray(payload?.d) ? payload.d : [];

  return meetings
    .map((meeting) => {
      const startDate = parseEscribeStartDate(meeting?.StartDate ?? "");
      const docs = Array.isArray(meeting?.MeetingDocumentLink) ? meeting.MeetingDocumentLink : [];
      const agendaPdf = pickEscribeDoc(docs, "AgendaCover") ?? pickEscribeDoc(docs, "Agenda", ".pdf");
      const agendaHtml = docs.find((doc) => doc?.Type === "Agenda" && doc?.Format === "HTML");
      const minutes = pickEscribeDoc(docs, "PostMinutes", ".pdf")
        ?? pickEscribeDoc(docs, "PostMinutes")
        ?? pickEscribeDoc(docs, "MinutesWithAttachments");
      const video = docs.find((doc) => doc?.Type === "Video");
      const agendaUrl = escribeDocUrl(agendaPdf) || escribeDocUrl(agendaHtml);
      const name = compactText(decodeHtml(meeting?.MeetingName ?? ""));

      if (!startDate || !agendaUrl || !name) return null;

      return {
        sortKey: startDate.getTime(),
        record: {
          date: startDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
          title: `${name} ${startDate.getMonth() + 1}/${startDate.getDate()}/${startDate.getFullYear()}`,
          body: "City Council",
          agendaUrl,
          agendaHtmlUrl: escribeDocUrl(agendaHtml),
          minutesUrl: escribeDocUrl(minutes),
          mediaUrl: escribeDocUrl(video),
          meetingUrl: meeting?.Url ?? "",
          source: "Campbell meeting portal",
          sourceUrl: ESCRIBE_PORTAL_URL,
        },
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.sortKey - a.sortKey)
    .map(({ record }) => record)
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
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
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

function truncateEventDescription(value = "", maxLength = 280) {
  const cleaned = cleanSentence(value);
  if (cleaned.length <= maxLength) return cleaned;

  const clipped = cleaned.slice(0, maxLength);
  const wordBoundary = clipped.replace(/\s+\S*$/, "").replace(/[,\s]+$/, "").trim();
  return `${wordBoundary || clipped.trim()}...`;
}

function cleanNoticeText(value = "") {
  return cleanSentence(value)
    .replace(/\bbeer\s*&\s*wind\b/gi, "beer & wine");
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

  const cityNotice =
    text.match(/Public Hearing to consider\s+([\s\S]*?)(?=\s+(?:Interested persons|This public hearing|Please be advised|Questions may be|In compliance|$))/i) ??
    text.match(/time and place(?:\s+for\s+(?:a\s+)?Public Hearing)?\s+(?:to consider|for)\s+([\s\S]*?)(?=\s+(?:Interested persons|This public hearing|Please be advised|Questions may be|In compliance|$))/i);
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

async function parsePublicHearings({ councilRecords, planningRecords, noticeArchives }) {
  const hearingItems = [];
  const agendaRecords = [
    ...councilRecords.slice(0, 6),
    ...planningRecords.slice(0, 8),
  ];

  for (const record of agendaRecords) {
    await sleep(300);
    const pdf = await fetchDocumentText(record.agendaUrl);
    if (!pdf.text) continue;
    hearingItems.push(...parseAgendaPublicHearingItems(pdf.text, record));
  }

  const notices = noticeArchives.flatMap((archive) => archive.items);
  for (const notice of notices) {
    await sleep(300);
    const pdf = await fetchDocumentText(notice.noticeUrl);
    const details = pdf.text ? parseNoticeDetails(pdf.text) : {};
    const summary = cleanNoticeText(details.summary || notice.title);

    if (!details.hearingAt && !details.summary && !pdf.skipped) continue;

    hearingItems.push({
      id: `notice-${notice.id}`,
      body: notice.body,
      title: cleanNoticeText(notice.title),
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
    .slice(0, 24);
}

async function writeJson(filename, payload) {
  await mkdir(DATA_DIR, { recursive: true });
  const target = resolve(DATA_DIR, filename);
  let nextPayload = payload;

  try {
    const existingPayload = JSON.parse(await readFile(target, "utf8"));
    const { generatedAt: existingGeneratedAt, ...existingComparable } = existingPayload;
    const { generatedAt: nextGeneratedAt, ...nextComparable } = payload;

    if (
      existingGeneratedAt &&
      nextGeneratedAt &&
      JSON.stringify(existingComparable) === JSON.stringify(nextComparable)
    ) {
      nextPayload = { ...payload, generatedAt: existingGeneratedAt };
    }
  } catch {
    // New or unreadable file: write the freshly generated payload.
  }

  await writeFile(target, `${JSON.stringify(nextPayload, null, 2)}\n`, "utf8");
  return target;
}

async function main() {
  const generatedAt = new Date().toISOString();
  const cityCalendarUrls = cityCalendarMonthUrls(new Date(generatedAt));
  const [
    directoryHtml,
    eventsHtml,
    cityCalendarHtmlPages,
    libraryPage,
    museumsEventsHtml,
    heritageTheatreEventsHtml,
    chamberEventsPage,
    councilRecords,
    planningHtml,
    ...otherSourceHtml
  ] = await Promise.all([
    fetchText(DIRECTORY_URL),
    fetchText(EVENTS_URL),
    Promise.all(cityCalendarUrls.map((url) => fetchText(url))),
    fetchOptionalText(SCCLD_CAMPBELL_LIBRARY_URL, "Campbell Library events"),
    fetchText(CAMPBELL_MUSEUMS_EVENTS_URL),
    fetchText(HERITAGE_THEATRE_EVENTS_URL),
    fetchChamberEventsHtml(),
    fetchEscribeCouncilRecords(),
    fetchText(PLANNING_COMMISSION_URL),
    ...PUBLIC_NOTICE_ARCHIVES.map((archive) => fetchText(archive.href)),
    ...CUSD_ICS_SOURCES.map((source) => fetchIcsText(source.href)),
  ]);
  const noticeArchiveHtml = otherSourceHtml.slice(0, PUBLIC_NOTICE_ARCHIVES.length);
  const cusdIcsTexts = otherSourceHtml.slice(PUBLIC_NOTICE_ARCHIVES.length);

  const downtownBusinesses = parseDirectory(directoryHtml);
  const chamberBusinesses = [];
  for (const slug of CHAMBER_ALPHA_SLUGS) {
    await sleep(175);
    const sourceUrl = `${CHAMBER_BASE_URL}/list/searchalpha/${slug}`;
    const html = await fetchText(sourceUrl);
    chamberBusinesses.push(...parseChamberBusinesses(html, sourceUrl));
  }
  const campbellChamberBusinesses = chamberBusinesses.filter(isCampbellLocatedBusiness);
  const businesses = mergeBusinesses(downtownBusinesses, campbellChamberBusinesses);
  const downtownEvents = parseDowntownEvents(eventsHtml, new Date(generatedAt));
  const cityCalendarEvents = cityCalendarHtmlPages
    .flatMap((html) => parseCityCalendarEvents(html))
    .filter((event) => !eventEndsBeforeReferenceDay(event, new Date(generatedAt)));
  let libraryEvents = [];
  let librarySourceNote = "";
  if (libraryPage.html) {
    libraryEvents = parseLibraryEvents(libraryPage.html, new Date(generatedAt));
  } else {
    libraryEvents = await readExistingSourceEvents({
      source: "Campbell Library Events",
      sourceUrl: SCCLD_CAMPBELL_LIBRARY_URL,
      generatedAt,
    });
    librarySourceNote = `Reused previous Campbell Library events because ${libraryPage.error}`;
    console.warn(`Warning: ${librarySourceNote}`);
  }
  const museumEvents = parseWixEvents(museumsEventsHtml, {
    baseUrl: CAMPBELL_MUSEUMS_BASE_URL,
    sourceUrl: CAMPBELL_MUSEUMS_EVENTS_URL,
    source: "Campbell Museums Events",
    category: "Museums",
  });
  const heritageTheatreEvents = parseWixEvents(heritageTheatreEventsHtml, {
    baseUrl: HERITAGE_THEATRE_BASE_URL,
    sourceUrl: HERITAGE_THEATRE_EVENTS_URL,
    source: "Campbell Heritage Theatre Events",
    category: "Heritage Theatre",
  });
  const chamberEvents = parseChamberEventCards(chamberEventsPage.html);
  const schoolEvents = CUSD_ICS_SOURCES.flatMap((source, index) => parseIcsEvents(cusdIcsTexts[index] ?? "", {
    label: source.label,
    sourceUrl: source.href,
    calendarUrl: CUSD_CALENDAR_URL,
    generatedAt,
  }));
  const filteredCityCalendarEvents = filterPublicEvents(cityCalendarEvents);
  const filteredDowntownEvents = filterPublicEvents(downtownEvents);
  const filteredLibraryEvents = filterPublicEvents(libraryEvents);
  const filteredMuseumEvents = filterPublicEvents(museumEvents);
  const filteredHeritageTheatreEvents = filterPublicEvents(heritageTheatreEvents);
  const filteredChamberEvents = filterPublicEvents(chamberEvents);
  const filteredSchoolEvents = filterPublicEvents(schoolEvents);
  const rejectedEvents = [
    ...cityCalendarEvents,
    ...downtownEvents,
    ...libraryEvents,
    ...museumEvents,
    ...heritageTheatreEvents,
    ...chamberEvents,
    ...schoolEvents,
  ].flatMap((event) => {
    const reason = eventRejectionReason(event);
    return reason ? [{ title: event.title, source: event.source, reason }] : [];
  });
  const events = mergeEventFeeds(
    filteredCityCalendarEvents,
    filteredDowntownEvents,
    filteredLibraryEvents,
    filteredMuseumEvents,
    filteredHeritageTheatreEvents,
    filteredChamberEvents,
    filteredSchoolEvents,
  );
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
    councilRecords,
    planningRecords,
    noticeArchives,
  });

  if (downtownBusinesses.length < 50) {
    throw new Error(`Downtown directory parse returned only ${downtownBusinesses.length} businesses`);
  }
  if (chamberBusinesses.length < 300) {
    throw new Error(`Chamber directory parse returned only ${chamberBusinesses.length} businesses`);
  }
  if (campbellChamberBusinesses.length < 150) {
    throw new Error(`Campbell Chamber filter returned only ${campbellChamberBusinesses.length} businesses`);
  }
  if (businesses.length < 200) {
    throw new Error(`Merged business parse returned only ${businesses.length} businesses`);
  }
  // Campbell's official calendar can naturally dip below eight visible events
  // late in a month; the merged feed threshold below still catches broad breaks.
  if (cityCalendarEvents.length < 5) {
    throw new Error(`City calendar parse returned only ${cityCalendarEvents.length} events`);
  }
  if (downtownEvents.length < 10) {
    throw new Error(`Downtown events parse returned only ${downtownEvents.length} events`);
  }
  if (chamberEvents.length < 10) {
    throw new Error(`Chamber events parse returned only ${chamberEvents.length} events`);
  }
  if (chamberEventsPage.total && chamberEvents.length < chamberEventsPage.total) {
    throw new Error(`Chamber events parse returned ${chamberEvents.length}/${chamberEventsPage.total} visible events`);
  }
  if (museumEvents.length < 1) {
    throw new Error(`Campbell Museums event parse returned only ${museumEvents.length} events`);
  }
  if (heritageTheatreEvents.length < 1) {
    throw new Error(`Heritage Theatre event parse returned only ${heritageTheatreEvents.length} events`);
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
    sources: [
      {
        label: "Downtown Campbell Directory",
        sourceUrl: DIRECTORY_URL,
        count: businesses.filter((business) => business.tags?.includes("Downtown")).length,
      },
      {
        label: "Campbell Chamber Directory",
        sourceUrl: CHAMBER_DIRECTORY_URL,
        count: businesses.filter((business) => business.tags?.includes("Chamber")).length,
        sourceEntries: campbellChamberBusinesses.length,
        totalParsed: chamberBusinesses.length,
      },
    ],
    items: businesses,
  });

  const eventPath = await writeJson("campbellEvents.json", {
    generatedAt,
    sourceUrl: CITY_CALENDAR_URL,
    sources: [
      {
        label: "City of Campbell Calendar",
        sourceUrl: CITY_CALENDAR_URL,
        count: filteredCityCalendarEvents.length,
        parsedCount: cityCalendarEvents.length,
      },
      {
        label: "Downtown Campbell Events",
        sourceUrl: EVENTS_URL,
        count: filteredDowntownEvents.length,
        parsedCount: downtownEvents.length,
      },
      {
        label: "Campbell Library Events",
        sourceUrl: SCCLD_CAMPBELL_LIBRARY_URL,
        count: filteredLibraryEvents.length,
        parsedCount: libraryEvents.length,
        ...(librarySourceNote ? { note: librarySourceNote } : {}),
      },
      {
        label: "Campbell Museums Events",
        sourceUrl: CAMPBELL_MUSEUMS_EVENTS_URL,
        count: filteredMuseumEvents.length,
        parsedCount: museumEvents.length,
      },
      {
        label: "Campbell Heritage Theatre Events",
        sourceUrl: HERITAGE_THEATRE_EVENTS_URL,
        count: filteredHeritageTheatreEvents.length,
        parsedCount: heritageTheatreEvents.length,
      },
      {
        label: "Campbell Chamber Events",
        sourceUrl: CHAMBER_EVENTS_URL,
        count: filteredChamberEvents.length,
        parsedCount: chamberEvents.length,
      },
      {
        label: "Campbell Union School District Events",
        sourceUrl: CUSD_CALENDAR_URL,
        count: filteredSchoolEvents.length,
        parsedCount: schoolEvents.length,
      },
    ],
    items: events,
  });

  const councilPath = await writeJson("campbellCouncilRecords.json", {
    generatedAt,
    sourceUrl: ESCRIBE_PORTAL_URL,
    items: councilRecords,
  });

  // Capture the newest substantive agenda's text so the council-digest API can
  // summarize it without fetching eScribe at request time (its TLS chain is
  // not in Node's CA store).
  const digestRecord = councilRecords.find(
    (record) => /regular session/i.test(record.title) && record.agendaHtmlUrl,
  ) ?? councilRecords.find((record) => record.agendaHtmlUrl);
  let digestSourcePath = "";
  if (digestRecord) {
    const agendaHtml = curlRequest(digestRecord.agendaHtmlUrl).toString("utf8");
    const agendaText = stripHtmlToText(agendaHtml).slice(0, 12_000);
    if (agendaText.length < 200) {
      throw new Error(`Council digest agenda text too short (${agendaText.length} chars)`);
    }
    digestSourcePath = await writeJson("campbellCouncilDigestSource.json", {
      generatedAt,
      meetingDate: digestRecord.date,
      title: digestRecord.title,
      url: digestRecord.meetingUrl || ESCRIBE_PORTAL_URL,
      sourceUrl: ESCRIBE_PORTAL_URL,
      agendaText,
    });
  }

  const publicHearingsPath = await writeJson("campbellPublicHearings.json", {
    generatedAt,
    sourceUrl: PUBLIC_NOTICES_URL,
    agendaSourceUrl: PLANNING_COMMISSION_URL,
    items: publicHearings,
  });

  console.log(`Wrote ${businesses.length} businesses (${downtownBusinesses.length} downtown, ${campbellChamberBusinesses.length}/${chamberBusinesses.length} chamber in Campbell) -> ${businessPath}`);
  console.log(`Wrote ${events.length} events (${filteredCityCalendarEvents.length}/${cityCalendarEvents.length} city, ${filteredDowntownEvents.length}/${downtownEvents.length} downtown, ${filteredLibraryEvents.length}/${libraryEvents.length} library, ${filteredMuseumEvents.length}/${museumEvents.length} museum, ${filteredHeritageTheatreEvents.length}/${heritageTheatreEvents.length} theatre, ${filteredChamberEvents.length}/${chamberEvents.length} chamber, ${filteredSchoolEvents.length}/${schoolEvents.length} school; ${rejectedEvents.length} filtered) -> ${eventPath}`);
  console.log(`Wrote ${councilRecords.length} council records -> ${councilPath}`);
  console.log(
    digestSourcePath
      ? `Wrote council digest source (${digestRecord.date}) -> ${digestSourcePath}`
      : "No council agenda available for digest source",
  );
  console.log(`Wrote ${publicHearings.length} public hearings -> ${publicHearingsPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
