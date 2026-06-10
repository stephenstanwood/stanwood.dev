import digestSource from "../../data/campbellCouncilDigestSource.json";

// The nightly sync (scripts/sync-campbell-data.mjs) pulls the newest council
// agenda from the city's eScribe portal and bundles its text here, so the
// digest API never fetches eScribe at request time (its TLS chain is not in
// Node's CA store, and bundled text keeps the endpoint fast and reliable).

export interface AgendaInfo {
  date: string;
  title: string;
  url: string;
  content: string;
}

export function getLatestAgenda(): AgendaInfo | null {
  const { meetingDate, title, url, agendaText } = digestSource;
  if (!agendaText || agendaText.length < 200) return null;

  return {
    date: meetingDate,
    title,
    url,
    content: agendaText,
  };
}
