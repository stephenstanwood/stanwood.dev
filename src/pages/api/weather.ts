export const prerender = false;
import type { APIRoute } from "astro";

/**
 * Lightweight weather proxy for the homepage terminal card.
 * Uses Open-Meteo (free, no key) for Campbell, CA coords.
 * Returns a one-liner like "☀️ 72°F Clear sky".
 *
 * Cached for 30 minutes via CDN headers.
 */

// WMO weather codes → emoji + description
const WMO: Record<number, [string, string]> = {
  0: ["☀️", "clear"],
  1: ["🌤", "mostly clear"],
  2: ["⛅", "partly cloudy"],
  3: ["☁️", "overcast"],
  45: ["🌫", "fog"],
  48: ["🌫", "fog"],
  51: ["🌦", "light drizzle"],
  53: ["🌦", "drizzle"],
  55: ["🌧", "heavy drizzle"],
  61: ["🌧", "light rain"],
  63: ["🌧", "rain"],
  65: ["🌧", "heavy rain"],
  71: ["🌨", "light snow"],
  73: ["🌨", "snow"],
  75: ["🌨", "heavy snow"],
  80: ["🌦", "rain showers"],
  81: ["🌧", "rain showers"],
  82: ["⛈", "heavy showers"],
  95: ["⛈", "thunderstorm"],
  96: ["⛈", "thunderstorm + hail"],
  99: ["⛈", "thunderstorm + hail"],
};

// Campbell, CA
const LAT = 37.2872;
const LON = -121.9500;

export const GET: APIRoute = async () => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=America/Los_Angeles`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) throw new Error(`open-meteo ${res.status}`);

    const data = await res.json();
    const temp = Math.round(data.current.temperature_2m);
    const code = data.current.weather_code as number;
    const [emoji, desc] = WMO[code] ?? ["🌡", "unknown"];

    const weather = `${emoji} ${temp}°F ${desc}`;

    return new Response(JSON.stringify({ weather }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=1800, max-age=900",
      },
    });
  } catch {
    return new Response(JSON.stringify({ weather: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};
