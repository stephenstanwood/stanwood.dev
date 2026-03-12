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
    const c = data.current;

    // Parse sunrise/sunset times
    const sunriseDate = new Date(data.daily.sunrise[0]);
    const sunsetDate = new Date(data.daily.sunset[0]);
    const sunriseHour =
      sunriseDate.getHours() + sunriseDate.getMinutes() / 60;
    const sunsetHour = sunsetDate.getHours() + sunsetDate.getMinutes() / 60;

    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;

    const input: WeatherInput = {
      weatherCode: c.weather_code,
      temp: c.temperature_2m,
      feelsLike: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      windSpeedKmh: c.wind_speed_10m,
      cloudCover: c.cloud_cover,
      uvIndex: c.uv_index,
      isDay: c.is_day === 1,
      precipitation: c.precipitation,
      currentHour,
      sunriseHour,
      sunsetHour,
    };

    // Build hourly forecast for next 12 hours
    const hourlyIdx = Math.floor(now.getHours());
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
