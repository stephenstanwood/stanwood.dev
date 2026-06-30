import {
  CalendarDays,
  CircleDollarSign,
  Dumbbell,
  FileText,
  Hammer,
  Landmark,
  Map,
  Megaphone,
  Search,
  ShieldAlert,
  Store,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { SOURCE_URLS } from "../../data/campbell";

type QuickLink = {
  title: string;
  desc: string;
  href: string;
  Icon: LucideIcon;
  owner: string;
  tone?: "gold" | "green" | "red";
};

const linkGroups: { title: string; kicker: string; links: QuickLink[] }[] = [
  {
    title: "Handle something today",
    kicker: "Start here",
    links: [
      {
        title: "Report a Concern",
        desc: "Potholes, streetlights, graffiti, code issues",
        href: "https://www.campbellca.gov/1049/Report-A-Concern",
        Icon: Wrench,
        owner: "City service request",
      },
      {
        title: "Building Permits",
        desc: "Apply, track, and manage permits online",
        href: SOURCE_URLS.permitPortal,
        Icon: Hammer,
        owner: "Building counter",
        tone: "gold",
      },
      {
        title: "Recreation & Classes",
        desc: "Sports, camps, swim lessons, and activities",
        href: "https://www.campbellca.gov/230/Activity-Guide",
        Icon: Dumbbell,
        owner: "Recreation",
        tone: "green",
      },
      {
        title: "City Events",
        desc: "Official calendar, public meetings, recreation dates",
        href: SOURCE_URLS.cityCalendar,
        Icon: CalendarDays,
        owner: "City calendar",
      },
    ],
  },
  {
    title: "Open City Hall records",
    kicker: "Meetings + notices",
    links: [
      {
        title: "Council Records",
        desc: "Agendas, minutes, and meeting video",
        href: SOURCE_URLS.escribeMeetings,
        Icon: Landmark,
        owner: "City meeting portal",
      },
      {
        title: "Public Hearings",
        desc: "Planning hearings, legal notices, public decisions",
        href: SOURCE_URLS.publicNotices,
        Icon: Megaphone,
        owner: "Public notices",
        tone: "gold",
      },
      {
        title: "Budget",
        desc: "Annual budget, services, fees, and finance",
        href: SOURCE_URLS.cityBudget,
        Icon: CircleDollarSign,
        owner: "Finance",
        tone: "green",
      },
      {
        title: "GIS & Maps",
        desc: "Zoning, parcels, business licenses, city layers",
        href: SOURCE_URLS.cityGisPublic,
        Icon: Map,
        owner: "City maps",
      },
    ],
  },
  {
    title: "Check a place or record",
    kicker: "Local lookups",
    links: [
      {
        title: "Downtown Directory",
        desc: "Shops, restaurants, services, and venues",
        href: SOURCE_URLS.downtownDirectory,
        Icon: Store,
        owner: "Downtown Campbell",
        tone: "green",
      },
      {
        title: "Crime Map & Reports",
        desc: "CPD stats, CityProtect, online reporting",
        href: SOURCE_URLS.cpdStats,
        Icon: ShieldAlert,
        owner: "Police",
        tone: "red",
      },
      {
        title: "Property Search",
        desc: "Assessor parcel and assessment lookup",
        href: SOURCE_URLS.assessorSearch,
        Icon: Search,
        owner: "County Assessor",
        tone: "gold",
      },
      {
        title: "Official Records",
        desc: "Recorded real estate documents and maps",
        href: SOURCE_URLS.clerkRecorder,
        Icon: FileText,
        owner: "Clerk-Recorder",
      },
    ],
  },
];

function linkGroupId(title: string) {
  return `campbell-link-group-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;
}

export default function QuickLinks() {
  return (
    <div className="cb-links">
      {linkGroups.map((group) => {
        const groupId = linkGroupId(group.title);

        return (
          <section
            key={group.title}
            className="cb-link-group"
            aria-labelledby={groupId}
          >
            <div className="cb-link-group-head">
              <span>{group.kicker}</span>
              <h3 id={groupId}>{group.title}</h3>
            </div>

            <div className="cb-links-grid">
              {group.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cb-link-card"
                >
                  <span
                    className={`cb-link-icon${link.tone ? ` cb-link-icon--${link.tone}` : ""}`}
                    aria-hidden="true"
                  >
                    <link.Icon size={19} strokeWidth={2.2} />
                  </span>
                  <div className="cb-link-text">
                    <span className="cb-link-title">{link.title}</span>
                    <span className="cb-link-desc">{link.desc}</span>
                    <span className="cb-link-owner">{link.owner}</span>
                  </div>
                  <span className="cb-link-arrow" aria-hidden="true">→</span>
                </a>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
