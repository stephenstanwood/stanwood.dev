import type { APIRoute } from "astro";
import {
  buildResponse,
  type WeatherInput,
  type HourlyForecast,
} from "../../lib/aestheticWeather";

export const prerender = false;

const DEFAULT_LAT = 37.2872;
const DEFAULT_LON = -121.95;
const DEFAULT_LOCATION = "Campbell, CA";

export const GET: APIRoute = async ({ url }) => {
  try {
    const latParam = url.searchParams.get("lat");
    const lonParam = url.searchParams.get("lon");

    let lat = DEFAULT_LAT;
    let lon = DEFAULT_LON;
    let location = DEFAULT_LOCATION;

    if (latParam && lonParam) {
      const parsedLat = parseFloat(latParam);
      const parsedLon = parseFloat(lonParam);
      if (
        !isNaN(parsedLat) &&
        !isNaN(parsedLon) &&
        parsedLat >= -90 &&
        parsedLat <= 90 &&
        parsedLon >= -180 &&
        parsedLon <= 180
      ) {
        lat = parsedLat;
        lon = parsedLon;
        location = "Your Location";
      }
    }

    const apiUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,weather_code,cloud_cover,wind_speed_10m,apparent_temperature,is_day,uv_index,precipitation` +
      `&daily=sunrise,sunset` +
      `&hourly=temperature_2m,weather_code,cloud_cover,precipitation_probability` +
      `&temperature_unit=fahrenheit&timezone=America/Los_Angeles&forecast_days=1`;

    const res = await fetch(apiUrl, {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) throw new Error(`open-meteo ${res.status}`);

    const data = await res.json();
    const current = data.current;

    // Parse sunrise/sunset times
    // Open-Meteo returns times in the requested timezone (America/Los_Angeles)
    // Parse as Pacific time to avoid UTC conversion issues on server
    const sunriseRaw = data.daily.sunrise[0]; // e.g. "2026-03-12T06:23"
    const sunsetRaw = data.daily.sunset[0];
    const parseLocalHour = (iso: string) => {
      const [, time] = iso.split("T");
      const [h, m] = time.split(":").map(Number);
      return h + m / 60;
    };
    const sunriseHour = parseLocalHour(sunriseRaw);
    const sunsetHour = parseLocalHour(sunsetRaw);
    const sunriseDate = new Date(sunriseRaw);
    const sunsetDate = new Date(sunsetRaw);

    // Use Pacific time — server may be UTC
    const now = new Date();
    const pacificNow = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
    const currentHour = pacificNow.getHours() + pacificNow.getMinutes() / 60;

    const input: WeatherInput = {
      weatherCode: current.weather_code,
      temp: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      windSpeedKmh: current.wind_speed_10m,
      cloudCover: current.cloud_cover,
      uvIndex: current.uv_index,
      isDay: current.is_day === 1,
      precipitation: current.precipitation,
      currentHour,
      sunriseHour,
      sunsetHour,
    };

    // Build hourly forecast for next 12 hours
    const hourlyIdx = Math.floor(pacificNow.getHours());
    const hourly = data.hourly;
    const forecast: HourlyForecast = {
      temperatures: hourly.temperature_2m.slice(hourlyIdx, hourlyIdx + 12),
      weatherCodes: hourly.weather_code.slice(hourlyIdx, hourlyIdx + 12),
      cloudCovers: hourly.cloud_cover.slice(hourlyIdx, hourlyIdx + 12),
      precipProbs: hourly.precipitation_probability.slice(
        hourlyIdx,
        hourlyIdx + 12
      ),
    };

    const sunriseStr = sunriseDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Los_Angeles",
    });
    const sunsetStr = sunsetDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Los_Angeles",
    });

    const response = buildResponse(
      input,
      forecast,
      location,
      sunriseStr,
      sunsetStr
    );

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=1800, max-age=900",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Weather unavailable" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};
