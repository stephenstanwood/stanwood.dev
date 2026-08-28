export const prerender = false;
import type { APIRoute } from "astro";
import {
  wmoInfo,
  openMeteoForecastUrl,
  DEFAULT_WEATHER_LAT,
  DEFAULT_WEATHER_LON,
} from "../../lib/aestheticWeather";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import { okJson, fetchWithTimeout } from "../../lib/apiHelpers";

/**
 * Lightweight weather proxy for the homepage terminal card.
 * Uses Open-Meteo (free, no key) for Campbell, CA coords.
 * Returns a one-liner like "☀️ 72°F clear sky".
 *
 * Cached for 30 minutes via CDN headers.
 */

export const GET: APIRoute = async ({ clientAddress }) => {
  if (!rateLimit(clientAddress)) return rateLimitResponse();

  try {
    const url = openMeteoForecastUrl(DEFAULT_WEATHER_LAT, DEFAULT_WEATHER_LON, {
      current: "temperature_2m,weather_code",
    });

    const res = await fetchWithTimeout(url, {}, 4_000);

    if (!res.ok) throw new Error(`open-meteo ${res.status}`);

    const data = await res.json();
    // Guard the upstream shape — a schema drift here would otherwise render
    // "☀️ NaN°F" and get CDN-cached for half an hour.
    const current = data?.current;
    if (typeof current?.temperature_2m !== "number" || typeof current?.weather_code !== "number") {
      throw new Error("unexpected open-meteo response shape");
    }

    const temp = Math.round(current.temperature_2m);
    const [emoji, desc] = wmoInfo(current.weather_code);

    const weather = `${emoji} ${temp}°F ${desc.toLowerCase()}`;

    return okJson({ weather }, { "Cache-Control": "public, s-maxage=1800, max-age=900" });
  } catch (err) {
    console.error("weather fetch error:", err);
    // status 200 intentional — CDN caches this; null signals the UI to show nothing
    return okJson({ weather: null });
  }
};
