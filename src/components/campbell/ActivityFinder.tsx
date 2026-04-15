import { useState, useMemo } from "react";
import type { Activity } from "../../lib/campbell/types";

const CATEGORIES = ["All", "Sports", "Aquatics", "Arts", "Camps", "Fitness", "Youth", "Seniors"];
const AGE_GROUPS = ["All Ages", "Toddler (0-3)", "Youth (4-12)", "Teen (13-17)", "Adult (18+)", "Senior (55+)"];

const REG_URL = "https://www.campbellca.gov/Facilities";

const ACTIVITIES: Activity[] = [
  // Sports
  { id: "1",  name: "Youth Basketball League",        category: "Sports",   ageGroup: "Youth (4-12)",   days: "Sat",           time: "9:00–12:00 PM",  location: "Community Center Gym",    fee: "$85/session",   registrationUrl: REG_URL, description: "Recreational basketball for grades 1–6. Teams formed at registration." },
  { id: "2",  name: "Adult Basketball Drop-In",       category: "Sports",   ageGroup: "Adult (18+)",    days: "Mon, Wed",      time: "7:00–9:00 PM",   location: "Community Center Gym",    fee: "$5/visit",      registrationUrl: null,    description: "Open-court pickup basketball for adults 18+." },
  { id: "3",  name: "Youth Flag Football",            category: "Sports",   ageGroup: "Youth (4-12)",   days: "Sat",           time: "10:00 AM–12:00 PM", location: "John D. Morgan Park",  fee: "$75/session",   registrationUrl: REG_URL, description: "Non-contact flag football for ages 5–10. No experience needed." },
  { id: "4",  name: "Adult Volleyball Drop-In",       category: "Sports",   ageGroup: "Adult (18+)",    days: "Thu",           time: "7:00–9:00 PM",   location: "Community Center Gym",    fee: "Free",          registrationUrl: null,    description: "Free weekly drop-in volleyball for adults of all skill levels." },
  { id: "5",  name: "Youth Tennis Clinics",           category: "Sports",   ageGroup: "Youth (4-12)",   days: "Tue, Thu",      time: "4:00–5:00 PM",   location: "Pruneyard Tennis Courts", fee: "$110/session",  registrationUrl: REG_URL, description: "Skills-based clinics grouped by age and level. Racket rental available." },
  { id: "6",  name: "Pickleball Open Play",           category: "Sports",   ageGroup: "Adult (18+)",    days: "Mon–Fri",       time: "9:00–11:00 AM",  location: "Community Center Gym",    fee: "$5/visit",      registrationUrl: null,    description: "Drop-in pickleball on indoor courts. Paddles available to borrow." },
  { id: "7",  name: "Adult Softball League",          category: "Sports",   ageGroup: "Adult (18+)",    days: "Sat",           time: "Various",        location: "John D. Morgan Park",     fee: "$350/team",     registrationUrl: REG_URL, description: "Co-ed and men's leagues. Games run spring and fall seasons." },
  // Aquatics
  { id: "8",  name: "Lap Swim",                       category: "Aquatics", ageGroup: "All Ages",       days: "Mon–Fri",       time: "6:00–8:00 AM",   location: "Campbell Pool",           fee: "$5/visit",      registrationUrl: null,    description: "Open lap lanes for solo workouts. Multiple lanes available, skill-sorted." },
  { id: "9",  name: "Family Swim",                    category: "Aquatics", ageGroup: "All Ages",       days: "Sat, Sun",      time: "1:00–4:00 PM",   location: "Campbell Pool",           fee: "$4/person",     registrationUrl: null,    description: "Drop-in family swim time. Children under 7 must have an adult in the water." },
  { id: "10", name: "Swim Lessons — Levels 1 & 2",   category: "Aquatics", ageGroup: "Youth (4-12)",   days: "Varies",        time: "Various",        location: "Campbell Pool",           fee: "$95/session",   registrationUrl: REG_URL, description: "Beginner swim lessons teaching water safety and basic strokes." },
  { id: "11", name: "Swim Lessons — Levels 3–5",     category: "Aquatics", ageGroup: "Youth (4-12)",   days: "Varies",        time: "Various",        location: "Campbell Pool",           fee: "$95/session",   registrationUrl: REG_URL, description: "Intermediate to advanced stroke technique. Competitive readiness at Level 5." },
  { id: "12", name: "Adult Swim Lessons",             category: "Aquatics", ageGroup: "Adult (18+)",    days: "Varies",        time: "Various",        location: "Campbell Pool",           fee: "$95/session",   registrationUrl: REG_URL, description: "Learn-to-swim classes for adults of all experience levels. Small groups." },
  { id: "13", name: "Water Aerobics",                 category: "Aquatics", ageGroup: "Adult (18+)",    days: "Tue, Thu",      time: "9:30–10:30 AM",  location: "Campbell Pool",           fee: "$8/class",      registrationUrl: null,    description: "Low-impact cardio in the water. Great for joints. Instructor-led." },
  // Arts
  { id: "14", name: "Teen Art Studio",                category: "Arts",     ageGroup: "Teen (13-17)",   days: "Wed",           time: "4:00–5:30 PM",   location: "Community Center",        fee: "$65/session",   registrationUrl: REG_URL, description: "Drawing, painting, and mixed media for teens. All supplies provided." },
  { id: "15", name: "Adult Painting Workshop",        category: "Arts",     ageGroup: "Adult (18+)",    days: "Tue",           time: "6:00–8:00 PM",   location: "Community Center",        fee: "$80/session",   registrationUrl: REG_URL, description: "Guided acrylic and watercolor painting for beginners and improvers." },
  { id: "16", name: "Youth Drawing & Cartooning",     category: "Arts",     ageGroup: "Youth (4-12)",   days: "Sat",           time: "10:00–11:30 AM", location: "Community Center",        fee: "$55/session",   registrationUrl: REG_URL, description: "Introduction to drawing with a focus on characters and storytelling." },
  { id: "17", name: "Ceramics & Pottery",             category: "Arts",     ageGroup: "Adult (18+)",    days: "Wed",           time: "6:30–8:30 PM",   location: "Community Center",        fee: "$110/session",  registrationUrl: REG_URL, description: "Hand-building and wheel-throwing techniques. Kiln firings included." },
  // Camps
  { id: "18", name: "Summer Day Camp",                category: "Camps",    ageGroup: "Youth (4-12)",   days: "Mon–Fri",       time: "8:00 AM–5:00 PM", location: "John D. Morgan Park",    fee: "$195/week",     registrationUrl: REG_URL, description: "Outdoor games, crafts, field trips, and swimming. Extended care available." },
  { id: "19", name: "Teen Leadership Camp",           category: "Camps",    ageGroup: "Teen (13-17)",   days: "Mon–Fri",       time: "9:00 AM–4:00 PM", location: "Community Center",       fee: "$120/week",     registrationUrl: REG_URL, description: "Teambuilding, service projects, and career exploration for teens 13–17." },
  { id: "20", name: "Spring Break Camp",              category: "Camps",    ageGroup: "Youth (4-12)",   days: "Mon–Fri",       time: "8:00 AM–5:00 PM", location: "Community Center",       fee: "$200/week",     registrationUrl: REG_URL, description: "One-week camp during spring break with themed activities and field trips." },
  // Youth
  { id: "21", name: "Toddler Tumbling",               category: "Youth",    ageGroup: "Toddler (0-3)", days: "Mon, Wed",      time: "10:00–10:45 AM", location: "Community Center",        fee: "$55/session",   registrationUrl: REG_URL, description: "Structured movement and coordination for ages 18 months–3 years." },
  { id: "22", name: "Preschool Movement & Music",     category: "Youth",    ageGroup: "Toddler (0-3)", days: "Tue, Thu",      time: "9:30–10:15 AM",  location: "Community Center",        fee: "$50/session",   registrationUrl: REG_URL, description: "Songs, simple instruments, and movement for ages 2–4. Parent participation welcome." },
  { id: "23", name: "After School Sports Club",       category: "Youth",    ageGroup: "Youth (4-12)",   days: "Mon–Fri",       time: "3:00–5:30 PM",   location: "Community Center Gym",    fee: "$150/month",    registrationUrl: REG_URL, description: "Supervised sports and recreation for kids ages 6–12 after school." },
  // Fitness
  { id: "24", name: "Senior Fitness Class",           category: "Fitness",  ageGroup: "Senior (55+)",   days: "Tue, Thu",      time: "10:00–11:00 AM", location: "Community Center",        fee: "$40/month",     registrationUrl: REG_URL, description: "Low-impact cardio and strength training designed for older adults." },
  { id: "25", name: "Yoga in the Park",               category: "Fitness",  ageGroup: "Adult (18+)",    days: "Sat",           time: "9:00–10:00 AM",  location: "Pruneyard Park",          fee: "Free",          registrationUrl: null,    description: "Free outdoor all-levels yoga. Bring your own mat. No registration needed." },
  { id: "26", name: "Zumba",                          category: "Fitness",  ageGroup: "Adult (18+)",    days: "Mon, Wed",      time: "6:00–7:00 PM",   location: "Community Center",        fee: "$6/class",      registrationUrl: null,    description: "Latin-inspired dance fitness class. All levels welcome — just show up." },
  { id: "27", name: "Pilates",                        category: "Fitness",  ageGroup: "Adult (18+)",    days: "Tue, Thu",      time: "7:00–8:00 AM",   location: "Community Center",        fee: "$12/class",     registrationUrl: REG_URL, description: "Mat Pilates focused on core strength and flexibility. Beginner-friendly." },
  // Seniors
  { id: "28", name: "Tai Chi for Seniors",            category: "Seniors",  ageGroup: "Senior (55+)",   days: "Mon, Wed, Fri", time: "8:00–9:00 AM",   location: "Community Center",        fee: "Free",          registrationUrl: null,    description: "Gentle morning tai chi to improve balance and reduce stress. All welcome." },
  { id: "29", name: "Senior Day Trips",               category: "Seniors",  ageGroup: "Senior (55+)",   days: "Varies",        time: "Varies",         location: "Meets at Community Center", fee: "Varies",      registrationUrl: REG_URL, description: "Organized day trips to theaters, museums, and Bay Area attractions." },
  { id: "30", name: "Senior Line Dancing",            category: "Seniors",  ageGroup: "Senior (55+)",   days: "Fri",           time: "1:00–2:30 PM",   location: "Community Center",        fee: "$3/class",      registrationUrl: null,    description: "Fun, social line dancing for beginners and experienced dancers alike." },
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
        Based on Campbell Parks &amp; Recreation offerings. Fees and schedules vary by season —
        verify current sessions at{" "}
        <a href="https://www.campbellca.gov/Facilities" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", fontWeight: 600 }}>
          campbellca.gov/Facilities
        </a>{" "}
        before registering.
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
