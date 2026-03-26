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
    title: "City Council Agendas",
    desc: "Meeting schedules, agendas, and minutes",
    href: "https://www.campbellca.gov/AgendaCenter",
    icon: "📋",
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
    href: "https://gis.campbellca.gov/public",
    icon: "🗺️",
  },
  {
    title: "Pay a Bill",
    desc: "Utilities, permits, and business taxes",
    href: "https://www.campbellca.gov/1140/Online-Services",
    icon: "💳",
  },
  {
    title: "Downtown Campbell",
    desc: "Events, parking, shops, and restaurants",
    href: "https://www.downtowncampbell.com",
    icon: "🛍️",
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
