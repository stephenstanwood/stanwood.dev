import { SOURCE_URLS } from "../../data/campbell";

const links = [
  {
    title: "Report a Concern",
    desc: "Potholes, streetlights, graffiti, code violations",
    href: "https://www.campbellca.gov/1049/Report-A-Concern",
    icon: "🚧",
  },
  {
    title: "Building Permits",
    desc: "Apply, track, and manage permits online",
    href: "https://campbellca.portal.iworq.net",
    icon: "🏗️",
  },
  {
    title: "Recreation & Classes",
    desc: "Sports, camps, swim lessons, and more",
    href: "https://www.campbellca.gov/230/Activity-Guide",
    icon: "🏊",
  },
  {
    title: "Council Records",
    desc: "Agendas, minutes, media, boards, and commissions",
    href: SOURCE_URLS.agendaCenter,
    icon: "📋",
  },
  {
    title: "Public Hearings",
    desc: "Official public notices, planning hearings, legal notices",
    href: SOURCE_URLS.publicNotices,
    icon: "📣",
  },
  {
    title: "City Events",
    desc: "Official calendar, public meetings, recreation dates",
    href: SOURCE_URLS.cityCalendar,
    icon: "📅",
  },
  {
    title: "Downtown Directory",
    desc: "Shops, restaurants, services, and venues",
    href: SOURCE_URLS.downtownDirectory,
    icon: "🛍️",
  },
  {
    title: "Police Department",
    desc: "Non-emergency reports, alerts, crime maps",
    href: "https://www.campbellca.gov/162/Police",
    icon: "🚔",
  },
  {
    title: "GIS & Maps",
    desc: "Zoning, parcels, business licenses",
    href: SOURCE_URLS.cityGisPublic,
    icon: "🗺️",
  },
  {
    title: "Property Search",
    desc: "Assessor parcel and assessment lookup",
    href: SOURCE_URLS.assessorSearch,
    icon: "🏠",
  },
  {
    title: "Official Records",
    desc: "Recorded real estate documents and maps",
    href: SOURCE_URLS.clerkRecorder,
    icon: "📄",
  },
  {
    title: "Budget",
    desc: "Annual budget, services, fees, and finance",
    href: SOURCE_URLS.cityBudget,
    icon: "💳",
  },
];

export default function QuickLinks() {
  return (
    <div className="cb-links-grid">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="cb-link-card"
        >
          <span className="cb-link-icon">{link.icon}</span>
          <div className="cb-link-text">
            <span className="cb-link-title">{link.title}</span>
            <span className="cb-link-desc">{link.desc}</span>
          </div>
          <span className="cb-link-arrow">→</span>
        </a>
      ))}
    </div>
  );
}
