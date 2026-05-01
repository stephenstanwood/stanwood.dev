import { useState, useEffect } from "react";
import { fetchWithTimeout } from "../../lib/apiHelpers";

// ── Types ──────────────────────────────────────────────────────────────────

interface SportGame {
  id: string;
  sport: "nba" | "nhl" | "mlb" | "nfl" | "mls";
  status: "pre" | "in" | "post";
  statusDetail: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: string;
  awayScore?: string;
  homeAbbr: string;
  awayAbbr: string;
  homeLogo?: string;
  awayLogo?: string;
  homeColor?: string;
  awayColor?: string;
  gameTime?: string;
  broadcasts?: string[];
  isLocalTeam: boolean;
  localTeamHome: boolean;
  record?: { home: string; away: string };
}

interface WeatherData {
  temp: number;
  tempHigh: number;
  tempLow: number;
  code: number;
  description: string;
  emoji: string;
  humidity: number;
  windSpeed: number;
}

interface GovernmentItem {
  city: string;
  body: string;
  date: string;
  type: "council" | "planning" | "committee";
  title: string;
  highlight?: string;
  link?: string;
}

// ── ESPN API response types ────────────────────────────────────────────────

interface EspnCompetitor {
  homeAway: "home" | "away";
  score?: string;
  team?: {
    displayName?: string;
    abbreviation?: string;
    logo?: string;
    color?: string;
  };
  records?: Array<{ summary?: string }>;
}

interface EspnBroadcast {
  media?: { shortName?: string };
}

// ── South Bay teams we care about ──────────────────────────────────────────

const SB_TEAMS: Record<string, { sport: SportGame["sport"]; abbr: string; color: string }> = {
  "Golden State Warriors": { sport: "nba", abbr: "GSW", color: "#1D428A" },
  "San Jose Sharks":       { sport: "nhl", abbr: "SJS", color: "#006D75" },
  "San Francisco Giants":  { sport: "mlb", abbr: "SF",  color: "#FD5A1E" },
  "San Francisco 49ers":   { sport: "nfl", abbr: "SF",  color: "#AA0000" },
  "San Jose Earthquakes":  { sport: "mls", abbr: "SJ",  color: "#0D4C92" },
  "Stanford Cardinal":     { sport: "nba", abbr: "STAN", color: "#8C1515" },
};

const ESPN_ENDPOINTS: Record<string, string> = {
  nba: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
  nhl: "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard",
  mlb: "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard",
  nfl: "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
};

// ── WMO weather code map ───────────────────────────────────────────────────

function wmoInfo(code: number): [string, string] {
  if (code === 0) return ["☀️", "Clear"];
  if (code <= 2) return ["⛅", "Partly cloudy"];
  if (code === 3) return ["☁️", "Overcast"];
  if (code <= 9) return ["🌫️", "Foggy"];
  if (code <= 19) return ["🌦️", "Drizzle"];
  if (code <= 29) return ["⛈️", "Thunderstorm"];
  if (code <= 39) return ["🌫️", "Foggy"];
  if (code <= 49) return ["🌫️", "Freezing fog"];
  if (code <= 59) return ["🌧️", "Drizzle"];
  if (code <= 69) return ["🌧️", "Rain"];
  if (code <= 79) return ["🌨️", "Snow"];
  if (code <= 84) return ["🌧️", "Rain showers"];
  if (code <= 94) return ["⛈️", "Thunderstorm"];
  return ["⛈️", "Heavy thunderstorm"];
}

// ── Upcoming government meetings (static, structured) ─────────────────────

const GOV_ITEMS: GovernmentItem[] = [
  {
    city: "San Jose",
    body: "City Council",
    date: "Tue Apr 1",
    type: "council",
    title: "Regular Council Meeting",
    highlight: "Housing element update, Downtown West EIR review",
    link: "https://sanjose.granicus.com/",
  },
  {
    city: "Campbell",
    body: "City Council",
    date: "Tue Apr 1",
    type: "council",
    title: "Regular Council Meeting",
    highlight: "Budget discussion, Hamilton Ave corridor",
    link: "https://www.ci.campbell.ca.us/",
  },
  {
    city: "Mountain View",
    body: "City Council",
    date: "Tue Apr 1",
    type: "council",
    title: "Regular Council Meeting",
    highlight: "Residences at Shoreline, El Camino Real corridor",
    link: "https://mountainview.legistar.com/",
  },
  {
    city: "Santa Clara",
    body: "City Council",
    date: "Tue Apr 1",
    type: "council",
    title: "Regular Council Meeting",
    highlight: "49ers stadium authority report",
    link: "https://www.santaclaraca.gov/",
  },
  {
    city: "Sunnyvale",
    body: "City Council",
    date: "Tue Apr 1",
    type: "council",
    title: "Regular Council Meeting",
    highlight: "Lawrence Station area plan update",
    link: "https://sunnyvale.ca.gov/",
  },
];

// ── South Bay tech companies ───────────────────────────────────────────────

const TECH_COMPANIES = [
  { name: "Apple",        city: "Cupertino",    ticker: "AAPL", employees: "172k" },
  { name: "NVIDIA",       city: "Santa Clara",  ticker: "NVDA", employees: "36k" },
  { name: "Google",       city: "Mountain View",ticker: "GOOGL", employees: "180k" },
  { name: "Intel",        city: "Santa Clara",  ticker: "INTC", employees: "124k" },
  { name: "Cisco",        city: "San Jose",     ticker: "CSCO", employees: "85k" },
  { name: "ServiceNow",   city: "Santa Clara",  ticker: "NOW",  employees: "22k" },
  { name: "Adobe",        city: "San Jose",     ticker: "ADBE", employees: "30k" },
  { name: "PayPal",       city: "San Jose",     ticker: "PYPL", employees: "22k" },
  { name: "Zoom",         city: "San Jose",     ticker: "ZM",   employees: "7.7k" },
  { name: "LinkedIn",     city: "Sunnyvale",    ticker: "MSFT", employees: "20k" },
  { name: "eBay",         city: "San Jose",     ticker: "EBAY", employees: "11k" },
  { name: "Palo Alto Ntwks", city: "Santa Clara", ticker: "PANW", employees: "15k" },
];

// ── Cities ─────────────────────────────────────────────────────────────────

const CITIES = [
  "All Cities",
  "San Jose",
  "Santa Clara",
  "Sunnyvale",
  "Mountain View",
  "Palo Alto",
  "Cupertino",
  "Campbell",
  "Los Gatos",
  "Saratoga",
  "Los Altos",
  "Milpitas",
];

// ── Fetch helpers ──────────────────────────────────────────────────────────

async function fetchSportGames(sport: "nba" | "nhl" | "mlb" | "nfl"): Promise<SportGame[]> {
  try {
    const res = await fetchWithTimeout(ESPN_ENDPOINTS[sport], {}, 6000);
    if (!res.ok) return [];
    const data = await res.json();
    const events = data.events || [];
    const games: SportGame[] = [];

    for (const event of events) {
      const comp = event.competitions?.[0];
      if (!comp) continue;
      const competitors = comp.competitors || [];
      if (competitors.length < 2) continue;

      const home = competitors.find((c: EspnCompetitor) => c.homeAway === "home");
      const away = competitors.find((c: EspnCompetitor) => c.homeAway === "away");
      if (!home || !away) continue;

      const homeTeamName = home.team?.displayName || "";
      const awayTeamName = away.team?.displayName || "";
      const isHome = !!SB_TEAMS[homeTeamName];
      const isAway = !!SB_TEAMS[awayTeamName];
      if (!isHome && !isAway) continue;

      const statusType = comp.status?.type?.state || "pre";
      const statusDetail = comp.status?.type?.shortDetail || comp.status?.type?.detail || "";
      const gameDate = new Date(event.date);
      const timeStr = gameDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Los_Angeles",
      });

      games.push({
        id: event.id,
        sport,
        status: statusType === "in" ? "in" : statusType === "post" ? "post" : "pre",
        statusDetail,
        homeTeam: homeTeamName,
        awayTeam: awayTeamName,
        homeAbbr: home.team?.abbreviation || homeTeamName.slice(0, 3).toUpperCase(),
        awayAbbr: away.team?.abbreviation || awayTeamName.slice(0, 3).toUpperCase(),
        homeScore: home.score,
        awayScore: away.score,
        homeLogo: home.team?.logo,
        awayLogo: away.team?.logo,
        homeColor: home.team?.color ? `#${home.team.color}` : undefined,
        awayColor: away.team?.color ? `#${away.team.color}` : undefined,
        gameTime: timeStr,
        broadcasts: (comp.geoBroadcasts || [])
          .map((b: EspnBroadcast) => b.media?.shortName)
          .filter(Boolean),
        isLocalTeam: true,
        localTeamHome: isHome,
        record: {
          home: home.records?.[0]?.summary || "",
          away: away.records?.[0]?.summary || "",
        },
      });
    }
    return games;
  } catch {
    return [];
  }
}

async function fetchWeather(): Promise<WeatherData | null> {
  try {
    // San Jose, CA
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=37.3387&longitude=-121.8853" +
      "&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m" +
      "&daily=temperature_2m_max,temperature_2m_min" +
      "&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America/Los_Angeles&forecast_days=1";
    const res = await fetchWithTimeout(url, {}, 5000);
    if (!res.ok) return null;
    const weather = await res.json();
    const code = weather.current.weather_code as number;
    const [emoji, description] = wmoInfo(code);
    return {
      temp: Math.round(weather.current.temperature_2m),
      tempHigh: Math.round(weather.daily.temperature_2m_max[0]),
      tempLow: Math.round(weather.daily.temperature_2m_min[0]),
      code,
      description,
      emoji,
      humidity: Math.round(weather.current.relative_humidity_2m),
      windSpeed: Math.round(weather.current.wind_speed_10m),
    };
  } catch {
    return null;
  }
}

// ── Sub-components ────────────────────────────────────────────────────────

function SportBadge({ sport }: { sport: SportGame["sport"] }) {
  const labels: Record<string, string> = {
    nba: "NBA", nhl: "NHL", mlb: "MLB", nfl: "NFL", mls: "MLS",
  };
  const colors: Record<string, string> = {
    nba: "#C8102E", nhl: "#000", mlb: "#002D72", nfl: "#013369", mls: "#003087",
  };
  return (
    <span
      style={{
        background: colors[sport] || "#333",
        color: "#fff",
        fontSize: "9px",
        fontWeight: 700,
        fontFamily: "'Space Mono', monospace",
        letterSpacing: "0.08em",
        padding: "2px 5px",
        borderRadius: "3px",
      }}
    >
      {labels[sport] || sport.toUpperCase()}
    </span>
  );
}

function LiveDot() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: "#22C55E",
          display: "inline-block",
          animation: "sbsPulse 1.5s ease-in-out infinite",
        }}
      />
      <span style={{ fontSize: "9px", color: "#22C55E", fontWeight: 700, fontFamily: "'Space Mono', monospace", letterSpacing: "0.06em" }}>
        LIVE
      </span>
    </span>
  );
}

function GameCard({ game }: { game: SportGame }) {
  const localAbbr = game.localTeamHome ? game.homeAbbr : game.awayAbbr;
  const localScore = game.localTeamHome ? game.homeScore : game.awayScore;
  const oppAbbr = game.localTeamHome ? game.awayAbbr : game.homeAbbr;
  const oppScore = game.localTeamHome ? game.awayScore : game.homeScore;
  const atSymbol = game.localTeamHome ? "vs" : "@";

  const isWinning =
    game.status !== "pre" &&
    localScore != null &&
    oppScore != null &&
    parseInt(localScore, 10) > parseInt(oppScore, 10);

  return (
    <div
      style={{
        background: "#fff",
        border: "1.5px solid #E2E8F0",
        borderRadius: "10px",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <SportBadge sport={game.sport} />
        {game.status === "in" ? (
          <LiveDot />
        ) : game.status === "post" ? (
          <span style={{ fontSize: "9px", color: "#94A3B8", fontFamily: "'Space Mono', monospace" }}>FINAL</span>
        ) : (
          <span style={{ fontSize: "9px", color: "#64748B", fontFamily: "'Space Mono', monospace" }}>{game.gameTime}</span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", lineHeight: 1.2 }}>
            {localAbbr}
          </div>
          <div style={{ fontSize: "10px", color: "#64748B", marginTop: "1px" }}>
            {atSymbol} {oppAbbr}
          </div>
        </div>

        {game.status !== "pre" && (
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 800,
                fontFamily: "'Space Mono', monospace",
                color: isWinning ? "#16803C" : "#0F172A",
                lineHeight: 1,
              }}
            >
              {localScore}
              <span style={{ color: "#94A3B8", margin: "0 2px" }}>–</span>
              {oppScore}
            </div>
          </div>
        )}
      </div>

      {game.status === "in" && game.statusDetail && (
        <div style={{ fontSize: "10px", color: "#64748B", fontFamily: "'Space Mono', monospace" }}>
          {game.statusDetail}
        </div>
      )}

      {game.broadcasts && game.broadcasts.length > 0 && game.status === "pre" && (
        <div style={{ fontSize: "10px", color: "#94A3B8" }}>
          📺 {game.broadcasts.slice(0, 2).join(", ")}
        </div>
      )}
    </div>
  );
}

function GovCard({ item }: { item: GovernmentItem }) {
  const typeColors: Record<string, string> = {
    council: "#1E3A5F",
    planning: "#0F766E",
    committee: "#7C3AED",
  };
  const typeLabels: Record<string, string> = {
    council: "City Council",
    planning: "Planning",
    committee: "Committee",
  };
  return (
    <a
      href={item.link || "#"}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        background: "#fff",
        border: "1.5px solid #E2E8F0",
        borderRadius: "10px",
        padding: "12px 14px",
        textDecoration: "none",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "#1E3A5F";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(30,58,95,0.1)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "#E2E8F0";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
        <span
          style={{
            fontSize: "9px",
            fontWeight: 700,
            fontFamily: "'Space Mono', monospace",
            letterSpacing: "0.06em",
            color: typeColors[item.type] || "#333",
            background: `${typeColors[item.type]}15`,
            padding: "2px 6px",
            borderRadius: "3px",
          }}
        >
          {typeLabels[item.type]}
        </span>
        <span style={{ fontSize: "9px", color: "#94A3B8", fontFamily: "'Space Mono', monospace" }}>{item.date}</span>
      </div>
      <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", marginBottom: "2px" }}>
        {item.city}
      </div>
      {item.highlight && (
        <div style={{ fontSize: "11px", color: "#64748B", lineHeight: 1.4 }}>
          {item.highlight}
        </div>
      )}
    </a>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function SouthBaySignal() {
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [games, setGames] = useState<SportGame[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [sportsLoading, setSportsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"sports" | "gov" | "tech" | "events">("sports");

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });

  useEffect(() => {
    fetchWeather().then(setWeather);
  }, []);

  useEffect(() => {
    setSportsLoading(true);
    Promise.all([
      fetchSportGames("nba"),
      fetchSportGames("nhl"),
      fetchSportGames("mlb"),
      fetchSportGames("nfl"),
    ]).then(([nba, nhl, mlb, nfl]) => {
      const all = [...nba, ...nhl, ...mlb, ...nfl];
      // Sort: live first, then pre (soonest), then post
      all.sort((a, b) => {
        const order = { in: 0, pre: 1, post: 2 };
        return order[a.status] - order[b.status];
      });
      setGames(all);
      setSportsLoading(false);
    });
  }, []);

  const filteredGov =
    selectedCity === "All Cities"
      ? GOV_ITEMS
      : GOV_ITEMS.filter(i => i.city === selectedCity);

  const filteredTech =
    selectedCity === "All Cities"
      ? TECH_COMPANIES
      : TECH_COMPANIES.filter(c => c.city === selectedCity);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F7F8FA",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#0F172A",
      }}
    >
      <style>{`
        @keyframes sbsPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes sbsFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sbs-tab { cursor: pointer; transition: all 0.15s; }
        .sbs-tab:hover { color: #1E3A5F !important; }
        .sbs-city-select {
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394A3B8'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          padding-right: 28px !important;
        }
        .sbs-game-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .sbs-tech-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        @media (max-width: 600px) {
          .sbs-game-grid { grid-template-columns: 1fr; }
          .sbs-tech-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── Header ── */}
      <header
        style={{
          background: "#1E3A5F",
          color: "#fff",
          padding: "0",
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>
                SOUTH BAY SIGNAL
              </span>
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  fontFamily: "'Space Mono', monospace",
                  letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.45)",
                  background: "rgba(255,255,255,0.1)",
                  padding: "2px 7px",
                  borderRadius: "3px",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                BETA
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginTop: "3px", fontFamily: "'Space Mono', monospace" }}>
              Local signal. No noise.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.6)",
                fontFamily: "'Space Mono', monospace",
              }}
            >
              {dateStr}
            </div>
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="sbs-city-select"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "12px",
                fontFamily: "'Inter', sans-serif",
                padding: "6px 10px",
                cursor: "pointer",
              }}
            >
              {CITIES.map(c => (
                <option key={c} value={c} style={{ background: "#1E3A5F" }}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Nav tabs */}
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "0 20px",
            display: "flex",
            gap: "0",
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {(["sports", "gov", "tech", "events"] as const).map(section => {
            const labels: Record<string, string> = {
              sports: "Sports",
              gov: "Government",
              tech: "Tech",
              events: "Events",
            };
            const active = activeSection === section;
            return (
              <button
                key={section}
                className="sbs-tab"
                onClick={() => setActiveSection(section)}
                style={{
                  background: "transparent",
                  border: "none",
                  borderBottom: active ? "2px solid #60A5FA" : "2px solid transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.5)",
                  fontSize: "12px",
                  fontWeight: active ? 700 : 500,
                  fontFamily: "'Inter', sans-serif",
                  padding: "10px 16px",
                  cursor: "pointer",
                  marginBottom: "-1px",
                  transition: "all 0.15s",
                }}
              >
                {labels[section]}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Body ── */}
      <main
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "20px",
        }}
      >
        {/* Weather strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "20px",
            padding: "10px 14px",
            background: "#fff",
            border: "1.5px solid #E2E8F0",
            borderRadius: "8px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "10px", fontWeight: 700, fontFamily: "'Space Mono', monospace", color: "#94A3B8", letterSpacing: "0.08em" }}>
            SAN JOSE
          </span>
          {weather ? (
            <>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>
                {weather.emoji} {weather.temp}°F
              </span>
              <span style={{ fontSize: "12px", color: "#64748B" }}>
                {weather.description} · H:{weather.tempHigh}° L:{weather.tempLow}°
              </span>
              <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                {weather.humidity}% humidity · {weather.windSpeed} mph wind
              </span>
            </>
          ) : (
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>Loading weather…</span>
          )}
        </div>

        {/* ── Sports section ── */}
        {activeSection === "sports" && (
          <div style={{ animation: "sbsFadeIn 0.25s ease-out" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0F172A" }}>
                  South Bay Sports
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748B" }}>
                  Warriors · Sharks · Giants · 49ers · Earthquakes
                </p>
              </div>
              <a
                href="https://www.espn.com/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "10px", color: "#94A3B8", textDecoration: "none", fontFamily: "'Space Mono', monospace" }}
              >
                via ESPN ↗
              </a>
            </div>

            {sportsLoading ? (
              <div
                style={{
                  background: "#fff",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: "10px",
                  padding: "32px",
                  textAlign: "center",
                  color: "#94A3B8",
                  fontSize: "13px",
                  fontFamily: "'Space Mono', monospace",
                }}
              >
                Loading scores…
              </div>
            ) : games.length === 0 ? (
              <div
                style={{
                  background: "#fff",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: "10px",
                  padding: "32px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>🏟️</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A", marginBottom: "4px" }}>
                  No games today
                </div>
                <div style={{ fontSize: "12px", color: "#94A3B8" }}>
                  Check back when the Warriors, Sharks, or Giants are playing.
                </div>
              </div>
            ) : (
              <div className="sbs-game-grid">
                {games.map(g => (
                  <GameCard key={g.id} game={g} />
                ))}
              </div>
            )}

            {/* Team roster */}
            <div
              style={{
                marginTop: "16px",
                padding: "12px 14px",
                background: "#fff",
                border: "1.5px solid #E2E8F0",
                borderRadius: "10px",
              }}
            >
              <div style={{ fontSize: "10px", fontWeight: 700, fontFamily: "'Space Mono', monospace", color: "#94A3B8", letterSpacing: "0.08em", marginBottom: "10px" }}>
                SOUTH BAY TEAMS
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {[
                  { name: "Warriors", league: "NBA", emoji: "🏀", link: "https://www.nba.com/warriors" },
                  { name: "Sharks", league: "NHL", emoji: "🦈", link: "https://www.nhl.com/sharks" },
                  { name: "Giants", league: "MLB", emoji: "⚾", link: "https://www.mlb.com/giants" },
                  { name: "49ers", league: "NFL", emoji: "🏈", link: "https://www.49ers.com" },
                  { name: "Earthquakes", league: "MLS", emoji: "⚽", link: "https://www.sjearthquakes.com" },
                  { name: "Valkyries", league: "WNBA", emoji: "🏀", link: "https://valkyries.wnba.com" },
                ].map(t => (
                  <a
                    key={t.name}
                    href={t.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: "12px",
                      color: "#475569",
                      textDecoration: "none",
                      padding: "4px 10px",
                      background: "#F1F5F9",
                      borderRadius: "20px",
                      fontWeight: 500,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#E2E8F0")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#F1F5F9")}
                  >
                    <span>{t.emoji}</span>
                    <span>{t.name}</span>
                    <span style={{ fontSize: "10px", color: "#94A3B8", fontFamily: "'Space Mono', monospace" }}>{t.league}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Government section ── */}
        {activeSection === "gov" && (
          <div style={{ animation: "sbsFadeIn 0.25s ease-out" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0F172A" }}>
                  City Government
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748B" }}>
                  Upcoming meetings across 11 South Bay cities
                </p>
              </div>
            </div>

            {filteredGov.length === 0 ? (
              <div
                style={{
                  background: "#fff",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: "10px",
                  padding: "32px",
                  textAlign: "center",
                  color: "#94A3B8",
                  fontSize: "13px",
                }}
              >
                No meetings found for {selectedCity}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {filteredGov.map((item, i) => (
                  <GovCard key={i} item={item} />
                ))}
              </div>
            )}

            <div
              style={{
                marginTop: "16px",
                padding: "12px 14px",
                background: "#EFF6FF",
                border: "1.5px solid #BFDBFE",
                borderRadius: "10px",
              }}
            >
              <div style={{ fontSize: "12px", color: "#1D4ED8", fontWeight: 600, marginBottom: "4px" }}>
                🏛️ Campbell Portal
              </div>
              <div style={{ fontSize: "12px", color: "#3B82F6" }}>
                Full AI-powered council digests, activity finder, and city services for Campbell →{" "}
                <a href="/campbell" style={{ color: "#1D4ED8", fontWeight: 600, textDecoration: "none" }}>
                  Open Campbell Portal
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── Tech section ── */}
        {activeSection === "tech" && (
          <div style={{ animation: "sbsFadeIn 0.25s ease-out" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0F172A" }}>
                  South Bay Tech
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748B" }}>
                  Major employers and tech presence in your backyard
                </p>
              </div>
            </div>

            {filteredTech.length === 0 ? (
              <div
                style={{
                  background: "#fff",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: "10px",
                  padding: "32px",
                  textAlign: "center",
                  color: "#94A3B8",
                  fontSize: "13px",
                }}
              >
                No tech companies listed for {selectedCity} yet
              </div>
            ) : (
              <div className="sbs-tech-grid">
                {filteredTech.map(c => (
                  <div
                    key={c.name}
                    style={{
                      background: "#fff",
                      border: "1.5px solid #E2E8F0",
                      borderRadius: "10px",
                      padding: "12px 14px",
                    }}
                  >
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", marginBottom: "2px" }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748B", marginBottom: "6px" }}>
                      📍 {c.city}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 700,
                          fontFamily: "'Space Mono', monospace",
                          letterSpacing: "0.06em",
                          color: "#0F172A",
                          background: "#F1F5F9",
                          padding: "2px 6px",
                          borderRadius: "3px",
                        }}
                      >
                        {c.ticker}
                      </span>
                      <span style={{ fontSize: "11px", color: "#94A3B8", fontFamily: "'Space Mono', monospace" }}>
                        ~{c.employees} employees
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                marginTop: "16px",
                padding: "12px 14px",
                background: "#F0FDF4",
                border: "1.5px solid #BBF7D0",
                borderRadius: "10px",
              }}
            >
              <div style={{ fontSize: "12px", color: "#166534", fontWeight: 600, marginBottom: "4px" }}>
                📈 Coming soon: real-time hiring signals, funding rounds, and South Bay tech news
              </div>
              <div style={{ fontSize: "11px", color: "#4ADE80" }}>
                Live tech pulse dashboard — track who's growing, who's hiring, what's happening in your backyard
              </div>
            </div>
          </div>
        )}

        {/* ── Events section ── */}
        {activeSection === "events" && (
          <div style={{ animation: "sbsFadeIn 0.25s ease-out" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0F172A" }}>
                  Events
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748B" }}>
                  What's happening across the South Bay
                </p>
              </div>
            </div>

            {/* Placeholder events — structured to show what's coming */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { title: "Campbell Farmers Market", date: "Every Sunday", time: "9am–1pm", city: "Campbell", type: "Market", free: true, emoji: "🥦" },
                { title: "Downtown San Jose Farmers Market", date: "Every Friday", time: "10am–2pm", city: "San Jose", type: "Market", free: true, emoji: "🌽" },
                { title: "Los Gatos Farmers Market", date: "Every Sunday", time: "8am–12pm", city: "Los Gatos", type: "Market", free: true, emoji: "🍅" },
                { title: "Mountain View Farmers Market", date: "Every Sunday", time: "9am–1pm", city: "Mountain View", type: "Market", free: true, emoji: "🧄" },
                { title: "SAP Center: Sharks Home Games", date: "Check schedule", time: "Various", city: "San Jose", type: "Sports", free: false, emoji: "🦈" },
                { title: "San Jose Public Library Events", date: "Various", time: "Various", city: "San Jose", type: "Community", free: true, emoji: "📚" },
              ]
                .filter(e => selectedCity === "All Cities" || e.city === selectedCity)
                .map((e, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#fff",
                      border: "1.5px solid #E2E8F0",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span style={{ fontSize: "24px", flexShrink: 0 }}>{e.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>{e.title}</div>
                      <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
                        📍 {e.city} · {e.date} · {e.time}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 700,
                          fontFamily: "'Space Mono', monospace",
                          letterSpacing: "0.06em",
                          color: "#7C3AED",
                          background: "#F5F3FF",
                          padding: "2px 6px",
                          borderRadius: "3px",
                        }}
                      >
                        {e.type}
                      </span>
                      {e.free && (
                        <span
                          style={{
                            fontSize: "9px",
                            fontWeight: 700,
                            fontFamily: "'Space Mono', monospace",
                            color: "#16803C",
                            background: "#F0FDF4",
                            padding: "2px 6px",
                            borderRadius: "3px",
                          }}
                        >
                          FREE
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            <div
              style={{
                marginTop: "16px",
                padding: "12px 14px",
                background: "#FFFBEB",
                border: "1.5px solid #FDE68A",
                borderRadius: "10px",
              }}
            >
              <div style={{ fontSize: "12px", color: "#92400E", fontWeight: 600, marginBottom: "4px" }}>
                📅 Full events calendar coming soon
              </div>
              <div style={{ fontSize: "11px", color: "#B45309" }}>
                Cross-city events with date, time, cost, and kid-friendly filters. The best South Bay calendar on the internet.
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "20px",
          borderTop: "1px solid #E2E8F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ fontSize: "11px", color: "#94A3B8", fontFamily: "'Space Mono', monospace" }}>
          SOUTH BAY SIGNAL — local signal. no noise.
        </div>
        <div style={{ display: "flex", gap: "16px" }}>
          <a href="/campbell" style={{ fontSize: "11px", color: "#94A3B8", textDecoration: "none" }}>
            Campbell Portal
          </a>
          <a href="/south-bay-aesthetic-weather" style={{ fontSize: "11px", color: "#94A3B8", textDecoration: "none" }}>
            Aesthetic Weather
          </a>
          <a href="/" style={{ fontSize: "11px", color: "#94A3B8", textDecoration: "none" }}>
            stanwood.dev
          </a>
        </div>
      </footer>
    </div>
  );
}
