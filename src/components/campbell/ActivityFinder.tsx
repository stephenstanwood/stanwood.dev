import { useState, useMemo } from "react";
import type { Activity } from "../../lib/campbell/types";

const CATEGORIES = ["All", "Sports", "Aquatics", "Arts", "Camps", "Fitness", "Youth", "Seniors"];
const AGE_GROUPS = ["All Ages", "Toddler (0-3)", "Youth (4-12)", "Teen (13-17)", "Adult (18+)", "Senior (55+)"];

// Curated sample data — replace with API/PDF-parsed data later
const ACTIVITIES: Activity[] = [
  { id: "1", name: "Youth Basketball League", category: "Sports", ageGroup: "Youth (4-12)", days: "Sat", time: "9:00 AM - 12:00 PM", location: "Campbell Community Center", fee: "$85", registrationUrl: "https://www.campbellca.gov/Facilities", description: "Recreational basketball for grades 1-6" },
  { id: "2", name: "Lap Swim", category: "Aquatics", ageGroup: "All Ages", days: "Mon-Fri", time: "6:00 AM - 8:00 AM", location: "Campbell Pool", fee: "$5/visit", registrationUrl: null, description: "Open lap swim for all skill levels" },
  { id: "3", name: "Teen Art Studio", category: "Arts", ageGroup: "Teen (13-17)", days: "Wed", time: "4:00 PM - 5:30 PM", location: "Campbell Community Center", fee: "$65", registrationUrl: "https://www.campbellca.gov/Facilities", description: "Drawing, painting, and mixed media for teens" },
  { id: "4", name: "Summer Day Camp", category: "Camps", ageGroup: "Youth (4-12)", days: "Mon-Fri", time: "8:00 AM - 5:00 PM", location: "John D. Morgan Park", fee: "$195/week", registrationUrl: "https://www.campbellca.gov/Facilities", description: "Outdoor games, crafts, field trips, and swimming" },
  { id: "5", name: "Senior Fitness", category: "Fitness", ageGroup: "Senior (55+)", days: "Tue, Thu", time: "10:00 AM - 11:00 AM", location: "Campbell Community Center", fee: "$40/month", registrationUrl: "https://www.campbellca.gov/Facilities", description: "Low-impact cardio and strength training" },
  { id: "6", name: "Toddler Tumbling", category: "Youth", ageGroup: "Toddler (0-3)", days: "Mon, Wed", time: "10:00 AM - 10:45 AM", location: "Campbell Community Center", fee: "$55", registrationUrl: "https://www.campbellca.gov/Facilities", description: "Movement and coordination for little ones" },
  { id: "7", name: "Adult Volleyball", category: "Sports", ageGroup: "Adult (18+)", days: "Thu", time: "7:00 PM - 9:00 PM", location: "Campbell Community Center Gym", fee: "Free", registrationUrl: null, description: "Drop-in recreational volleyball" },
  { id: "8", name: "Yoga in the Park", category: "Fitness", ageGroup: "Adult (18+)", days: "Sat", time: "9:00 AM - 10:00 AM", location: "Pruneyard Park", fee: "Free", registrationUrl: null, description: "Free outdoor yoga for all levels" },
];

export default function ActivityFinder() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [ageGroup, setAgeGroup] = useState("All Ages");

  const filtered = useMemo(() => {
    return ACTIVITIES.filter((a) => {
      if (category !== "All" && a.category !== category) return false;
      if (ageGroup !== "All Ages" && a.ageGroup !== ageGroup) return false;
      if (search && !a.name.toLowerCase().includes(search.toLowerCase()) &&
          !a.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, category, ageGroup]);

  return (
    <div className="cb-activities">
      <p className="cb-activities-note">
        Sample data shown below. Full activity listing coming soon from Campbell's seasonal guide.
      </p>

      <div className="cb-activities-filters">
        <input
          type="text"
          className="cb-activities-search"
          placeholder="Search activities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="cb-activities-selects">
          <select
            className="cb-activities-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select
            className="cb-activities-select"
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
          >
            {AGE_GROUPS.map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="cb-activities-empty">No activities match your filters.</p>
      ) : (
        <div className="cb-activities-list">
          {filtered.map((a) => (
            <div key={a.id} className="cb-activity-card">
              <div className="cb-activity-header">
                <h4 className="cb-activity-name">{a.name}</h4>
                <span className="cb-activity-fee">{a.fee}</span>
              </div>
              <p className="cb-activity-desc">{a.description}</p>
              <div className="cb-activity-details">
                <span>📅 {a.days}</span>
                <span>🕐 {a.time}</span>
                <span>📍 {a.location}</span>
              </div>
              <div className="cb-activity-tags">
                <span className="cb-tag cb-tag-cat">{a.category}</span>
                <span className="cb-tag cb-tag-age">{a.ageGroup}</span>
              </div>
              {a.registrationUrl && (
                <a
                  href={a.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cb-activity-register"
                >
                  Register →
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="cb-activities-footer">
        <a
          href="https://www.campbellca.gov/230/Activity-Guide"
          target="_blank"
          rel="noopener noreferrer"
          className="cb-activities-pdf"
        >
          View full activity guide (PDF) →
        </a>
      </div>
    </div>
  );
}
