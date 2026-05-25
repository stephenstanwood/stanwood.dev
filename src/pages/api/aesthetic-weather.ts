import type { APIRoute } from "astro";
import {
  buildResponse,
  DEFAULT_WEATHER_LAT,
  DEFAULT_WEATHER_LON,
  DEFAULT_WEATHER_LOCATION,
  type WeatherInput,
  type HourlyForecast,
} from "../../lib/aestheticWeather";
import { okJson, fetchWithTimeout, validateLatLon } from "../../lib/apiHelpers";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const latParam = url.searchParams.get("lat");
    const lonParam = url.searchParams.get("lon");

    let lat = DEFAULT_WEATHER_LAT;
    let lon = DEFAULT_WEATHER_LON;
    let location = DEFAULT_WEATHER_LOCATION;

    if (latParam && lonParam) {
      const coords = validateLatLon(parseFloat(latParam), parseFloat(lonParam));
      if (coords) {
        lat = coords.latitude;
        lon = coords.longitude;
        location = "Your Location";
      }
    }

    const apiUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,weather_code,cloud_cover,wind_speed_10m,apparent_temperature,is_day,uv_index,precipitation` +
      `&daily=sunrise,sunset` +
      `&hourly=temperature_2m,weather_code,cloud_cover,precipitation_probability` +
      `&temperature_unit=fahrenheit&timezone=America/Los_Angeles&forecast_days=1`;

    const res = await fetchWithTimeout(apiUrl, {}, 5_000);

    if (!res.ok) throw new Error(`open-meteo ${res.status}`);

    const data = await res.json();
    const current = data.current;

    // Open-Meteo returns times in the requested timezone (America/Los_Angeles) with no
    // offset suffix, e.g. "2026-03-12T06:23". Parse the components directly — passing the
    // string to `new Date()` would interpret it as the server's local zone (UTC on Vercel).
    const sunriseRaw = data.daily.sunrise[0];
    const sunsetRaw = data.daily.sunset[0];
    const parseLocalTime = (iso: string) => {
      const [, time] = iso.split("T");
      const [h, m] = time.split(":").map(Number);
      return { hour: h, minute: m };
    };
    const sunriseParts = parseLocalTime(sunriseRaw);
    const sunsetParts = parseLocalTime(sunsetRaw);
    const sunriseHour = sunriseParts.hour + sunriseParts.minute / 60;
    const sunsetHour = sunsetParts.hour + sunsetParts.minute / 60;

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

    const formatTime = ({ hour, minute }: { hour: number; minute: number }) => {
      const period = hour >= 12 ? "PM" : "AM";
      const h12 = hour % 12 === 0 ? 12 : hour % 12;
      return `${h12}:${String(minute).padStart(2, "0")} ${period}`;
    };
    const sunriseStr = formatTime(sunriseParts);
    const sunsetStr = formatTime(sunsetParts);

    const response = buildResponse(
      input,
      forecast,
      location,
      sunriseStr,
      sunsetStr
    );

    return okJson(response, { "Cache-Control": "public, s-maxage=1800, max-age=900" });
  } catch {
    // status 200 intentional — CDN caches this; error key signals the UI to show a fallback
    return okJson({ error: "Weather unavailable" });
  }
};
