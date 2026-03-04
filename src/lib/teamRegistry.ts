// ---------------------------------------------------------------------------
// Static catalog of sports teams organised by league.
// Colours use the official primary colour (`color`) and a brighter variant
// (`textColor`) that stays readable on dark backgrounds.
// ESPN abbreviations verified against site.api.espn.com paths.
// ---------------------------------------------------------------------------

export interface TeamEntry {
  key: string; // unique id like "nba-warriors"
  label: string; // short display name like "Warriors"
  fullName: string; // "Golden State Warriors"
  abbreviation: string; // ESPN abbreviation like "GS"
  league: string; // ESPN API path like "basketball/nba"
  color: string; // primary team colour hex
  textColor: string; // lighter/brighter hex for dark-bg readability
}

export interface LeagueInfo {
  key: string; // e.g. "nfl"
  label: string; // e.g. "NFL"
  path: string; // ESPN API path e.g. "football/nfl"
}

export const LEAGUES: LeagueInfo[] = [
  { key: "nfl", label: "NFL", path: "football/nfl" },
  { key: "nba", label: "NBA", path: "basketball/nba" },
  { key: "wnba", label: "WNBA", path: "basketball/wnba" },
  { key: "mlb", label: "MLB", path: "baseball/mlb" },
  { key: "ncaam", label: "College BBall", path: "basketball/mens-college-basketball" },
];

// ---------------------------------------------------------------------------
// NFL (32 teams)
// ---------------------------------------------------------------------------
const NFL_TEAMS: TeamEntry[] = [
  // AFC East
  { key: "nfl-bills", label: "Bills", fullName: "Buffalo Bills", abbreviation: "BUF", league: "football/nfl", color: "#00338D", textColor: "#3366CC" },
  { key: "nfl-dolphins", label: "Dolphins", fullName: "Miami Dolphins", abbreviation: "MIA", league: "football/nfl", color: "#008E97", textColor: "#00BCC6" },
  { key: "nfl-patriots", label: "Patriots", fullName: "New England Patriots", abbreviation: "NE", league: "football/nfl", color: "#002244", textColor: "#2266AA" },
  { key: "nfl-jets", label: "Jets", fullName: "New York Jets", abbreviation: "NYJ", league: "football/nfl", color: "#125740", textColor: "#2B8A6B" },

  // AFC North
  { key: "nfl-ravens", label: "Ravens", fullName: "Baltimore Ravens", abbreviation: "BAL", league: "football/nfl", color: "#241773", textColor: "#5544BB" },
  { key: "nfl-bengals", label: "Bengals", fullName: "Cincinnati Bengals", abbreviation: "CIN", league: "football/nfl", color: "#FB4F14", textColor: "#FF7744" },
  { key: "nfl-browns", label: "Browns", fullName: "Cleveland Browns", abbreviation: "CLE", league: "football/nfl", color: "#311D00", textColor: "#885522" },
  { key: "nfl-steelers", label: "Steelers", fullName: "Pittsburgh Steelers", abbreviation: "PIT", league: "football/nfl", color: "#FFB612", textColor: "#FFCC44" },

  // AFC South
  { key: "nfl-texans", label: "Texans", fullName: "Houston Texans", abbreviation: "HOU", league: "football/nfl", color: "#03202F", textColor: "#2266AA" },
  { key: "nfl-colts", label: "Colts", fullName: "Indianapolis Colts", abbreviation: "IND", league: "football/nfl", color: "#002C5F", textColor: "#3366BB" },
  { key: "nfl-jaguars", label: "Jaguars", fullName: "Jacksonville Jaguars", abbreviation: "JAX", league: "football/nfl", color: "#006778", textColor: "#0099AA" },
  { key: "nfl-titans", label: "Titans", fullName: "Tennessee Titans", abbreviation: "TEN", league: "football/nfl", color: "#0C2340", textColor: "#4488CC" },

  // AFC West
  { key: "nfl-broncos", label: "Broncos", fullName: "Denver Broncos", abbreviation: "DEN", league: "football/nfl", color: "#FB4F14", textColor: "#FF7744" },
  { key: "nfl-chiefs", label: "Chiefs", fullName: "Kansas City Chiefs", abbreviation: "KC", league: "football/nfl", color: "#E31837", textColor: "#FF4466" },
  { key: "nfl-raiders", label: "Raiders", fullName: "Las Vegas Raiders", abbreviation: "LV", league: "football/nfl", color: "#000000", textColor: "#A5ACAF" },
  { key: "nfl-chargers", label: "Chargers", fullName: "Los Angeles Chargers", abbreviation: "LAC", league: "football/nfl", color: "#0080C6", textColor: "#33AAEE" },

  // NFC East
  { key: "nfl-cowboys", label: "Cowboys", fullName: "Dallas Cowboys", abbreviation: "DAL", league: "football/nfl", color: "#003594", textColor: "#4488CC" },
  { key: "nfl-giants", label: "Giants", fullName: "New York Giants", abbreviation: "NYG", league: "football/nfl", color: "#0B2265", textColor: "#3366BB" },
  { key: "nfl-eagles", label: "Eagles", fullName: "Philadelphia Eagles", abbreviation: "PHI", league: "football/nfl", color: "#004C54", textColor: "#00AA88" },
  { key: "nfl-commanders", label: "Commanders", fullName: "Washington Commanders", abbreviation: "WSH", league: "football/nfl", color: "#5A1414", textColor: "#CC3333" },

  // NFC North
  { key: "nfl-bears", label: "Bears", fullName: "Chicago Bears", abbreviation: "CHI", league: "football/nfl", color: "#0B162A", textColor: "#4477BB" },
  { key: "nfl-lions", label: "Lions", fullName: "Detroit Lions", abbreviation: "DET", league: "football/nfl", color: "#0076B6", textColor: "#33AAEE" },
  { key: "nfl-packers", label: "Packers", fullName: "Green Bay Packers", abbreviation: "GB", league: "football/nfl", color: "#203731", textColor: "#44AA66" },
  { key: "nfl-vikings", label: "Vikings", fullName: "Minnesota Vikings", abbreviation: "MIN", league: "football/nfl", color: "#4F2683", textColor: "#8855CC" },

  // NFC South
  { key: "nfl-falcons", label: "Falcons", fullName: "Atlanta Falcons", abbreviation: "ATL", league: "football/nfl", color: "#A71930", textColor: "#DD4455" },
  { key: "nfl-panthers", label: "Panthers", fullName: "Carolina Panthers", abbreviation: "CAR", league: "football/nfl", color: "#0085CA", textColor: "#33AAEE" },
  { key: "nfl-saints", label: "Saints", fullName: "New Orleans Saints", abbreviation: "NO", league: "football/nfl", color: "#D3BC8D", textColor: "#E8D5AA" },
  { key: "nfl-buccaneers", label: "Buccaneers", fullName: "Tampa Bay Buccaneers", abbreviation: "TB", league: "football/nfl", color: "#D50A0A", textColor: "#FF4444" },

  // NFC West
  { key: "nfl-cardinals", label: "Cardinals", fullName: "Arizona Cardinals", abbreviation: "ARI", league: "football/nfl", color: "#97233F", textColor: "#FF4466" },
  { key: "nfl-rams", label: "Rams", fullName: "Los Angeles Rams", abbreviation: "LAR", league: "football/nfl", color: "#003594", textColor: "#5588DD" },
  { key: "nfl-49ers", label: "49ers", fullName: "San Francisco 49ers", abbreviation: "SF", league: "football/nfl", color: "#AA0000", textColor: "#EE3333" },
  { key: "nfl-seahawks", label: "Seahawks", fullName: "Seattle Seahawks", abbreviation: "SEA", league: "football/nfl", color: "#002244", textColor: "#44BBAA" },
];

// ---------------------------------------------------------------------------
// NBA (30 teams)
// ---------------------------------------------------------------------------
const NBA_TEAMS: TeamEntry[] = [
  // Atlantic Division
  { key: "nba-celtics", label: "Celtics", fullName: "Boston Celtics", abbreviation: "BOS", league: "basketball/nba", color: "#007A33", textColor: "#33BB66" },
  { key: "nba-nets", label: "Nets", fullName: "Brooklyn Nets", abbreviation: "BKN", league: "basketball/nba", color: "#000000", textColor: "#AAAAAA" },
  { key: "nba-knicks", label: "Knicks", fullName: "New York Knicks", abbreviation: "NY", league: "basketball/nba", color: "#006BB6", textColor: "#3399DD" },
  { key: "nba-76ers", label: "76ers", fullName: "Philadelphia 76ers", abbreviation: "PHI", league: "basketball/nba", color: "#006BB6", textColor: "#3399DD" },
  { key: "nba-raptors", label: "Raptors", fullName: "Toronto Raptors", abbreviation: "TOR", league: "basketball/nba", color: "#CE1141", textColor: "#EE4466" },

  // Central Division
  { key: "nba-bulls", label: "Bulls", fullName: "Chicago Bulls", abbreviation: "CHI", league: "basketball/nba", color: "#CE1141", textColor: "#EE4466" },
  { key: "nba-cavaliers", label: "Cavaliers", fullName: "Cleveland Cavaliers", abbreviation: "CLE", league: "basketball/nba", color: "#6F263D", textColor: "#AA4466" },
  { key: "nba-pistons", label: "Pistons", fullName: "Detroit Pistons", abbreviation: "DET", league: "basketball/nba", color: "#C8102E", textColor: "#EE4455" },
  { key: "nba-pacers", label: "Pacers", fullName: "Indiana Pacers", abbreviation: "IND", league: "basketball/nba", color: "#002D62", textColor: "#3366BB" },
  { key: "nba-bucks", label: "Bucks", fullName: "Milwaukee Bucks", abbreviation: "MIL", league: "basketball/nba", color: "#00471B", textColor: "#33AA55" },

  // Southeast Division
  { key: "nba-hawks", label: "Hawks", fullName: "Atlanta Hawks", abbreviation: "ATL", league: "basketball/nba", color: "#E03A3E", textColor: "#FF6666" },
  { key: "nba-hornets", label: "Hornets", fullName: "Charlotte Hornets", abbreviation: "CHA", league: "basketball/nba", color: "#1D1160", textColor: "#6655CC" },
  { key: "nba-heat", label: "Heat", fullName: "Miami Heat", abbreviation: "MIA", league: "basketball/nba", color: "#98002E", textColor: "#DD3355" },
  { key: "nba-magic", label: "Magic", fullName: "Orlando Magic", abbreviation: "ORL", league: "basketball/nba", color: "#0077C0", textColor: "#33AAEE" },
  { key: "nba-wizards", label: "Wizards", fullName: "Washington Wizards", abbreviation: "WSH", league: "basketball/nba", color: "#002B5C", textColor: "#3366BB" },

  // Northwest Division
  { key: "nba-nuggets", label: "Nuggets", fullName: "Denver Nuggets", abbreviation: "DEN", league: "basketball/nba", color: "#0E2240", textColor: "#4488CC" },
  { key: "nba-timberwolves", label: "Timberwolves", fullName: "Minnesota Timberwolves", abbreviation: "MIN", league: "basketball/nba", color: "#0C2340", textColor: "#3366BB" },
  { key: "nba-thunder", label: "Thunder", fullName: "Oklahoma City Thunder", abbreviation: "OKC", league: "basketball/nba", color: "#007AC1", textColor: "#33AAEE" },
  { key: "nba-blazers", label: "Trail Blazers", fullName: "Portland Trail Blazers", abbreviation: "POR", league: "basketball/nba", color: "#E03A3E", textColor: "#FF6666" },
  { key: "nba-jazz", label: "Jazz", fullName: "Utah Jazz", abbreviation: "UTAH", league: "basketball/nba", color: "#002B5C", textColor: "#3366BB" },

  // Pacific Division
  { key: "nba-warriors", label: "Warriors", fullName: "Golden State Warriors", abbreviation: "GS", league: "basketball/nba", color: "#1D428A", textColor: "#4477CC" },
  { key: "nba-clippers", label: "Clippers", fullName: "Los Angeles Clippers", abbreviation: "LAC", league: "basketball/nba", color: "#C8102E", textColor: "#EE4455" },
  { key: "nba-lakers", label: "Lakers", fullName: "Los Angeles Lakers", abbreviation: "LAL", league: "basketball/nba", color: "#552583", textColor: "#8855CC" },
  { key: "nba-suns", label: "Suns", fullName: "Phoenix Suns", abbreviation: "PHX", league: "basketball/nba", color: "#1D1160", textColor: "#6655CC" },
  { key: "nba-kings", label: "Kings", fullName: "Sacramento Kings", abbreviation: "SAC", league: "basketball/nba", color: "#5A2D81", textColor: "#8855CC" },

  // Southwest Division
  { key: "nba-mavericks", label: "Mavericks", fullName: "Dallas Mavericks", abbreviation: "DAL", league: "basketball/nba", color: "#00538C", textColor: "#3388CC" },
  { key: "nba-rockets", label: "Rockets", fullName: "Houston Rockets", abbreviation: "HOU", league: "basketball/nba", color: "#CE1141", textColor: "#EE4466" },
  { key: "nba-grizzlies", label: "Grizzlies", fullName: "Memphis Grizzlies", abbreviation: "MEM", league: "basketball/nba", color: "#5D76A9", textColor: "#8899CC" },
  { key: "nba-pelicans", label: "Pelicans", fullName: "New Orleans Pelicans", abbreviation: "NO", league: "basketball/nba", color: "#0C2340", textColor: "#3366BB" },
  { key: "nba-spurs", label: "Spurs", fullName: "San Antonio Spurs", abbreviation: "SA", league: "basketball/nba", color: "#C4CED4", textColor: "#DDE5E8" },
];

// ---------------------------------------------------------------------------
// WNBA (13 teams - 2025-2026 season)
// ---------------------------------------------------------------------------
const WNBA_TEAMS: TeamEntry[] = [
  { key: "wnba-dream", label: "Dream", fullName: "Atlanta Dream", abbreviation: "ATL", league: "basketball/wnba", color: "#E31837", textColor: "#FF4466" },
  { key: "wnba-sky", label: "Sky", fullName: "Chicago Sky", abbreviation: "CHI", league: "basketball/wnba", color: "#418FDE", textColor: "#66AAEE" },
  { key: "wnba-sun", label: "Sun", fullName: "Connecticut Sun", abbreviation: "CONN", league: "basketball/wnba", color: "#F05023", textColor: "#FF7744" },
  { key: "wnba-wings", label: "Wings", fullName: "Dallas Wings", abbreviation: "DAL", league: "basketball/wnba", color: "#C4D600", textColor: "#DDEE33" },
  { key: "wnba-valkyries", label: "Valkyries", fullName: "Golden State Valkyries", abbreviation: "GS", league: "basketball/wnba", color: "#584E9B", textColor: "#8877CC" },
  { key: "wnba-fever", label: "Fever", fullName: "Indiana Fever", abbreviation: "IND", league: "basketball/wnba", color: "#002D62", textColor: "#3366BB" },
  { key: "wnba-aces", label: "Aces", fullName: "Las Vegas Aces", abbreviation: "LV", league: "basketball/wnba", color: "#000000", textColor: "#BF953F" },
  { key: "wnba-sparks", label: "Sparks", fullName: "Los Angeles Sparks", abbreviation: "LA", league: "basketball/wnba", color: "#552583", textColor: "#8855CC" },
  { key: "wnba-lynx", label: "Lynx", fullName: "Minnesota Lynx", abbreviation: "MIN", league: "basketball/wnba", color: "#0C2340", textColor: "#3366BB" },
  { key: "wnba-liberty", label: "Liberty", fullName: "New York Liberty", abbreviation: "NY", league: "basketball/wnba", color: "#6ECEB2", textColor: "#88EECC" },
  { key: "wnba-mercury", label: "Mercury", fullName: "Phoenix Mercury", abbreviation: "PHX", league: "basketball/wnba", color: "#CB6015", textColor: "#EE8833" },
  { key: "wnba-storm", label: "Storm", fullName: "Seattle Storm", abbreviation: "SEA", league: "basketball/wnba", color: "#2C5234", textColor: "#44AA66" },
  { key: "wnba-mystics", label: "Mystics", fullName: "Washington Mystics", abbreviation: "WSH", league: "basketball/wnba", color: "#C8102E", textColor: "#EE4455" },
];

// ---------------------------------------------------------------------------
// MLB (30 teams)
// ---------------------------------------------------------------------------
const MLB_TEAMS: TeamEntry[] = [
  // AL East
  { key: "mlb-orioles", label: "Orioles", fullName: "Baltimore Orioles", abbreviation: "BAL", league: "baseball/mlb", color: "#DF4601", textColor: "#FF7733" },
  { key: "mlb-red-sox", label: "Red Sox", fullName: "Boston Red Sox", abbreviation: "BOS", league: "baseball/mlb", color: "#BD3039", textColor: "#EE5566" },
  { key: "mlb-yankees", label: "Yankees", fullName: "New York Yankees", abbreviation: "NYY", league: "baseball/mlb", color: "#003087", textColor: "#4466CC" },
  { key: "mlb-rays", label: "Rays", fullName: "Tampa Bay Rays", abbreviation: "TB", league: "baseball/mlb", color: "#092C5C", textColor: "#3366BB" },
  { key: "mlb-blue-jays", label: "Blue Jays", fullName: "Toronto Blue Jays", abbreviation: "TOR", league: "baseball/mlb", color: "#134A8E", textColor: "#4477CC" },

  // AL Central
  { key: "mlb-white-sox", label: "White Sox", fullName: "Chicago White Sox", abbreviation: "CHW", league: "baseball/mlb", color: "#27251F", textColor: "#888888" },
  { key: "mlb-guardians", label: "Guardians", fullName: "Cleveland Guardians", abbreviation: "CLE", league: "baseball/mlb", color: "#00385D", textColor: "#3366BB" },
  { key: "mlb-tigers", label: "Tigers", fullName: "Detroit Tigers", abbreviation: "DET", league: "baseball/mlb", color: "#0C2340", textColor: "#3366BB" },
  { key: "mlb-royals", label: "Royals", fullName: "Kansas City Royals", abbreviation: "KC", league: "baseball/mlb", color: "#004687", textColor: "#3377CC" },
  { key: "mlb-twins", label: "Twins", fullName: "Minnesota Twins", abbreviation: "MIN", league: "baseball/mlb", color: "#002B5C", textColor: "#3366BB" },

  // AL West
  { key: "mlb-astros", label: "Astros", fullName: "Houston Astros", abbreviation: "HOU", league: "baseball/mlb", color: "#002D62", textColor: "#3366BB" },
  { key: "mlb-angels", label: "Angels", fullName: "Los Angeles Angels", abbreviation: "LAA", league: "baseball/mlb", color: "#BA0021", textColor: "#EE3344" },
  { key: "mlb-athletics", label: "Athletics", fullName: "Oakland Athletics", abbreviation: "OAK", league: "baseball/mlb", color: "#003831", textColor: "#33AA55" },
  { key: "mlb-mariners", label: "Mariners", fullName: "Seattle Mariners", abbreviation: "SEA", league: "baseball/mlb", color: "#0C2C56", textColor: "#3366BB" },
  { key: "mlb-rangers", label: "Rangers", fullName: "Texas Rangers", abbreviation: "TEX", league: "baseball/mlb", color: "#003278", textColor: "#4466CC" },

  // NL East
  { key: "mlb-braves", label: "Braves", fullName: "Atlanta Braves", abbreviation: "ATL", league: "baseball/mlb", color: "#CE1141", textColor: "#EE4466" },
  { key: "mlb-marlins", label: "Marlins", fullName: "Miami Marlins", abbreviation: "MIA", league: "baseball/mlb", color: "#00A3E0", textColor: "#33CCFF" },
  { key: "mlb-mets", label: "Mets", fullName: "New York Mets", abbreviation: "NYM", league: "baseball/mlb", color: "#002D72", textColor: "#3366CC" },
  { key: "mlb-phillies", label: "Phillies", fullName: "Philadelphia Phillies", abbreviation: "PHI", league: "baseball/mlb", color: "#E81828", textColor: "#FF4455" },
  { key: "mlb-nationals", label: "Nationals", fullName: "Washington Nationals", abbreviation: "WSH", league: "baseball/mlb", color: "#AB0003", textColor: "#DD3333" },

  // NL Central
  { key: "mlb-cubs", label: "Cubs", fullName: "Chicago Cubs", abbreviation: "CHC", league: "baseball/mlb", color: "#0E3386", textColor: "#4466CC" },
  { key: "mlb-reds", label: "Reds", fullName: "Cincinnati Reds", abbreviation: "CIN", league: "baseball/mlb", color: "#C6011F", textColor: "#EE3344" },
  { key: "mlb-brewers", label: "Brewers", fullName: "Milwaukee Brewers", abbreviation: "MIL", league: "baseball/mlb", color: "#12284B", textColor: "#3366BB" },
  { key: "mlb-pirates", label: "Pirates", fullName: "Pittsburgh Pirates", abbreviation: "PIT", league: "baseball/mlb", color: "#27251F", textColor: "#FDB827" },
  { key: "mlb-cardinals", label: "Cardinals", fullName: "St. Louis Cardinals", abbreviation: "STL", league: "baseball/mlb", color: "#C41E3A", textColor: "#EE4466" },

  // NL West
  { key: "mlb-diamondbacks", label: "D-backs", fullName: "Arizona Diamondbacks", abbreviation: "ARI", league: "baseball/mlb", color: "#A71930", textColor: "#DD4455" },
  { key: "mlb-rockies", label: "Rockies", fullName: "Colorado Rockies", abbreviation: "COL", league: "baseball/mlb", color: "#33006F", textColor: "#7744CC" },
  { key: "mlb-dodgers", label: "Dodgers", fullName: "Los Angeles Dodgers", abbreviation: "LAD", league: "baseball/mlb", color: "#005A9C", textColor: "#3388DD" },
  { key: "mlb-padres", label: "Padres", fullName: "San Diego Padres", abbreviation: "SD", league: "baseball/mlb", color: "#2F241D", textColor: "#FFC425" },
  { key: "mlb-giants", label: "Giants", fullName: "San Francisco Giants", abbreviation: "SF", league: "baseball/mlb", color: "#FD5A1E", textColor: "#FF8844" },
];

// ---------------------------------------------------------------------------
// College Basketball (~25 major programs)
// ---------------------------------------------------------------------------
const NCAAM_TEAMS: TeamEntry[] = [
  { key: "ncaam-duke", label: "Duke", fullName: "Duke Blue Devils", abbreviation: "DUKE", league: "basketball/mens-college-basketball", color: "#003087", textColor: "#4466CC" },
  { key: "ncaam-unc", label: "North Carolina", fullName: "North Carolina Tar Heels", abbreviation: "UNC", league: "basketball/mens-college-basketball", color: "#7BAFD4", textColor: "#99CCEE" },
  { key: "ncaam-kansas", label: "Kansas", fullName: "Kansas Jayhawks", abbreviation: "KU", league: "basketball/mens-college-basketball", color: "#0051BA", textColor: "#3377DD" },
  { key: "ncaam-kentucky", label: "Kentucky", fullName: "Kentucky Wildcats", abbreviation: "UK", league: "basketball/mens-college-basketball", color: "#0033A0", textColor: "#4466CC" },
  { key: "ncaam-ucla", label: "UCLA", fullName: "UCLA Bruins", abbreviation: "UCLA", league: "basketball/mens-college-basketball", color: "#2D68C4", textColor: "#5588DD" },
  { key: "ncaam-michigan", label: "Michigan", fullName: "Michigan Wolverines", abbreviation: "MICH", league: "basketball/mens-college-basketball", color: "#00274C", textColor: "#FFCB05" },
  { key: "ncaam-michigan-st", label: "Michigan State", fullName: "Michigan State Spartans", abbreviation: "MSU", league: "basketball/mens-college-basketball", color: "#18453B", textColor: "#44AA66" },
  { key: "ncaam-gonzaga", label: "Gonzaga", fullName: "Gonzaga Bulldogs", abbreviation: "GONZ", league: "basketball/mens-college-basketball", color: "#002967", textColor: "#3366BB" },
  { key: "ncaam-villanova", label: "Villanova", fullName: "Villanova Wildcats", abbreviation: "VILL", league: "basketball/mens-college-basketball", color: "#00205B", textColor: "#3355BB" },
  { key: "ncaam-uconn", label: "UConn", fullName: "UConn Huskies", abbreviation: "CONN", league: "basketball/mens-college-basketball", color: "#000E2F", textColor: "#3366BB" },
  { key: "ncaam-arizona", label: "Arizona", fullName: "Arizona Wildcats", abbreviation: "ARIZ", league: "basketball/mens-college-basketball", color: "#CC0033", textColor: "#EE3355" },
  { key: "ncaam-indiana", label: "Indiana", fullName: "Indiana Hoosiers", abbreviation: "IND", league: "basketball/mens-college-basketball", color: "#990000", textColor: "#DD3333" },
  { key: "ncaam-syracuse", label: "Syracuse", fullName: "Syracuse Orange", abbreviation: "SYR", league: "basketball/mens-college-basketball", color: "#D44500", textColor: "#FF7733" },
  { key: "ncaam-louisville", label: "Louisville", fullName: "Louisville Cardinals", abbreviation: "LOU", league: "basketball/mens-college-basketball", color: "#AD0000", textColor: "#EE3333" },
  { key: "ncaam-wisconsin", label: "Wisconsin", fullName: "Wisconsin Badgers", abbreviation: "WIS", league: "basketball/mens-college-basketball", color: "#C5050C", textColor: "#EE3344" },
  { key: "ncaam-iowa", label: "Iowa", fullName: "Iowa Hawkeyes", abbreviation: "IOWA", league: "basketball/mens-college-basketball", color: "#FFCD00", textColor: "#FFDD44" },
  { key: "ncaam-purdue", label: "Purdue", fullName: "Purdue Boilermakers", abbreviation: "PUR", league: "basketball/mens-college-basketball", color: "#CFB991", textColor: "#E0CCAA" },
  { key: "ncaam-tennessee", label: "Tennessee", fullName: "Tennessee Volunteers", abbreviation: "TENN", league: "basketball/mens-college-basketball", color: "#FF8200", textColor: "#FFAA44" },
  { key: "ncaam-auburn", label: "Auburn", fullName: "Auburn Tigers", abbreviation: "AUB", league: "basketball/mens-college-basketball", color: "#0C2340", textColor: "#3366BB" },
  { key: "ncaam-alabama", label: "Alabama", fullName: "Alabama Crimson Tide", abbreviation: "ALA", league: "basketball/mens-college-basketball", color: "#9E1B32", textColor: "#DD4455" },
  { key: "ncaam-houston", label: "Houston", fullName: "Houston Cougars", abbreviation: "HOU", league: "basketball/mens-college-basketball", color: "#C8102E", textColor: "#EE4455" },
  { key: "ncaam-creighton", label: "Creighton", fullName: "Creighton Bluejays", abbreviation: "CREI", league: "basketball/mens-college-basketball", color: "#005CA9", textColor: "#3388DD" },
  { key: "ncaam-marquette", label: "Marquette", fullName: "Marquette Golden Eagles", abbreviation: "MARQ", league: "basketball/mens-college-basketball", color: "#003366", textColor: "#3377BB" },
  { key: "ncaam-stjohns", label: "St. John's", fullName: "St. John's Red Storm", abbreviation: "SJU", league: "basketball/mens-college-basketball", color: "#CC0000", textColor: "#EE3333" },
  { key: "ncaam-texas", label: "Texas", fullName: "Texas Longhorns", abbreviation: "TEX", league: "basketball/mens-college-basketball", color: "#BF5700", textColor: "#EE7733" },
];

// ---------------------------------------------------------------------------
// Build the unified registry keyed by `key`
// ---------------------------------------------------------------------------
const ALL_TEAMS: TeamEntry[] = [
  ...NFL_TEAMS,
  ...NBA_TEAMS,
  ...WNBA_TEAMS,
  ...MLB_TEAMS,
  ...NCAAM_TEAMS,
];

export const TEAM_REGISTRY: Record<string, TeamEntry> = ALL_TEAMS.reduce(
  (acc, t) => {
    acc[t.key] = t;
    return acc;
  },
  {} as Record<string, TeamEntry>,
);

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/** Return every team whose `league` field matches the given ESPN league path. */
export function getTeamsByLeague(leaguePath: string): TeamEntry[] {
  return ALL_TEAMS.filter((t) => t.league === leaguePath);
}

/** Look up a single team by its unique key (e.g. "nba-warriors"). */
export function getTeam(key: string): TeamEntry | undefined {
  return TEAM_REGISTRY[key];
}
