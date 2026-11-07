/** Official schedule endpoint shared by the WNBA proxy and TV replay feed. */
export function wnbaScheduleUrl(season = new Date().getUTCFullYear()): string {
  return `https://www.wnba.com/api/schedule?season=${season}&regionId=1`;
}
