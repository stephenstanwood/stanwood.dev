import type { APIRoute } from "astro";
import { errJson, fetchWithTimeout, okJson } from "../../../lib/apiHelpers";
import { rateLimit, rateLimitResponse } from "../../../lib/rateLimit";

export const prerender = false;

const PLAYLIST_ID = "PLk7eG7txNmA0aOww_rvQJy49xGEZe_U5d";
const PLAYLIST_URL = `https://www.youtube.com/playlist?list=${PLAYLIST_ID}`;
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?playlist_id=${PLAYLIST_ID}`;
const CACHE_TTL_MS = 10 * 60 * 1000;

interface ClassicVideo {
  id: string;
  title: string;
  url: string;
  channelTitle: string;
  thumb: string;
  duration: string | null;
  index: string | null;
}

let cached:
  | {
      fetchedAt: number;
      videos: ClassicVideo[];
    }
  | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function compactText(value: unknown): string | null {
  if (!isRecord(value)) return null;

  if (typeof value.simpleText === "string") {
    return value.simpleText.trim() || null;
  }

  if (Array.isArray(value.runs)) {
    const text = value.runs
      .map((run) => (isRecord(run) && typeof run.text === "string" ? run.text : ""))
      .join("")
      .trim();
    return text || null;
  }

  return null;
}

function thumbnailFromRenderer(renderer: Record<string, unknown>, videoId: string): string {
  const thumbnail = renderer.thumbnail;
  if (isRecord(thumbnail) && Array.isArray(thumbnail.thumbnails)) {
    const thumbs = thumbnail.thumbnails.filter(isRecord);
    const best = thumbs[thumbs.length - 1];
    if (best && typeof best.url === "string" && best.url.startsWith("https://")) {
      return best.url;
    }
  }

  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

function extractInitialDataJson(html: string): string {
  const marker = "ytInitialData";
  const markerIndex = html.indexOf(marker);
  if (markerIndex === -1) throw new Error("ytInitialData not found");

  const equalsIndex = html.indexOf("=", markerIndex);
  const start = html.indexOf("{", equalsIndex);
  if (equalsIndex === -1 || start === -1) throw new Error("ytInitialData start not found");

  let depth = 0;
  let inString = false;
  let escaping = false;

  for (let i = start; i < html.length; i += 1) {
    const char = html[i];

    if (inString) {
      if (escaping) escaping = false;
      else if (char === "\\") escaping = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }

  throw new Error("ytInitialData end not found");
}

function collectPlaylistRenderers(
  value: unknown,
  out: Record<string, unknown>[] = [],
): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    for (const item of value) collectPlaylistRenderers(item, out);
    return out;
  }

  if (!isRecord(value)) return out;

  const renderer = value.playlistVideoRenderer;
  if (isRecord(renderer)) out.push(renderer);

  for (const child of Object.values(value)) {
    collectPlaylistRenderers(child, out);
  }

  return out;
}

function rendererToVideo(renderer: Record<string, unknown>): ClassicVideo | null {
  const id = typeof renderer.videoId === "string" ? renderer.videoId : null;
  const title = compactText(renderer.title);
  if (!id || !title) return null;

  const channelTitle =
    compactText(renderer.shortBylineText) ??
    compactText(renderer.longBylineText) ??
    "YouTube";
  const duration = compactText(renderer.lengthText);
  const index = compactText(renderer.index);
  const indexParam = index && /^\d+$/.test(index) ? `&index=${index}` : "";

  return {
    id,
    title,
    url: `https://www.youtube.com/watch?v=${id}&list=${PLAYLIST_ID}${indexParam}`,
    channelTitle,
    thumb: thumbnailFromRenderer(renderer, id),
    duration,
    index,
  };
}

async function fetchVideosFromPlaylistPage(): Promise<ClassicVideo[]> {
  const response = await fetchWithTimeout(
    PLAYLIST_URL,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    },
    8_000,
  );

  if (!response.ok) throw new Error(`YouTube playlist ${response.status}`);

  const initialData = JSON.parse(extractInitialDataJson(await response.text())) as unknown;
  const unique = new Map<string, ClassicVideo>();

  for (const renderer of collectPlaylistRenderers(initialData)) {
    const video = rendererToVideo(renderer);
    if (video && !unique.has(video.id)) unique.set(video.id, video);
  }

  return [...unique.values()];
}

function decodeXml(value: string): string {
  return value
    .replace(/&#x([a-f0-9]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal: string) => String.fromCodePoint(parseInt(decimal, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function readXmlTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? decodeXml(match[1].trim()) : null;
}

function readXmlAttr(xml: string, tag: string, attr: string): string | null {
  const tagMatch = xml.match(new RegExp(`<${tag}\\b[^>]*>`));
  if (!tagMatch) return null;
  const attrMatch = tagMatch[0].match(new RegExp(`${attr}="([^"]+)"`));
  return attrMatch ? decodeXml(attrMatch[1]) : null;
}

async function fetchVideosFromFeed(): Promise<ClassicVideo[]> {
  const response = await fetchWithTimeout(
    FEED_URL,
    { headers: { Accept: "application/atom+xml, application/xml, text/xml" } },
    8_000,
  );

  if (!response.ok) throw new Error(`YouTube feed ${response.status}`);

  const feed = await response.text();
  const videos: ClassicVideo[] = [];

  for (const match of feed.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const entry = match[1];
    const id = readXmlTag(entry, "yt:videoId");
    const title = readXmlTag(entry, "title");
    if (!id || !title) continue;

    videos.push({
      id,
      title,
      url: `https://www.youtube.com/watch?v=${id}&list=${PLAYLIST_ID}`,
      channelTitle: readXmlTag(entry, "name") ?? "YouTube",
      thumb: readXmlAttr(entry, "media:thumbnail", "url") ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      duration: null,
      index: null,
    });
  }

  return videos;
}

async function fetchPlaylistVideos(): Promise<ClassicVideo[]> {
  try {
    const videos = await fetchVideosFromPlaylistPage();
    if (videos.length > 0) return videos;
  } catch (error) {
    console.warn("Could not parse YouTube playlist page, falling back to feed", error);
  }

  const fallbackVideos = await fetchVideosFromFeed();
  if (fallbackVideos.length === 0) throw new Error("No playlist videos found");
  return fallbackVideos;
}

async function getPlaylistVideos(): Promise<ClassicVideo[]> {
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) return cached.videos;

  try {
    const videos = await fetchPlaylistVideos();
    cached = { fetchedAt: now, videos };
    return videos;
  } catch (error) {
    if (cached) return cached.videos;
    throw error;
  }
}

export const GET: APIRoute = async ({ clientAddress }) => {
  if (!rateLimit(clientAddress)) return rateLimitResponse();

  try {
    const videos = await getPlaylistVideos();
    const video = videos[Math.floor(Math.random() * videos.length)];

    return okJson(
      {
        ...video,
        playlistTitle: "SDSN Classic",
        availableCount: videos.length,
      },
      {
        "Cache-Control": "private, no-store",
      },
    );
  } catch {
    return errJson("Could not load SDSN Classic playlist", 502);
  }
};
