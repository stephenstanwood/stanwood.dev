import { describe, expect, it } from "vitest";
import {
  parseClubLgChildcare,
  parseCourtsideChildcare,
  parseDaySpec,
  parseRanges,
  rangeLabel,
} from "./childcare";
import { cleanClubLgName, cleanCourtsideTitle, displayName, isAdultGroupClass } from "./clean";
import { clockLabel, pacificClock, parseInstant } from "./clock";
import { extractFlightPayload, parseFlightRows, resolveRefs } from "./flight";
import { buildDays, inWindow, mergeVirtualTwins, upcomingWeekdays } from "./schedule";
import { extractClubLgClasses, normalizeClubLg, normalizeCourtside } from "./sources";
import type { WorkoutClass } from "./types";

function workout(overrides: Partial<WorkoutClass>): WorkoutClass {
  return {
    club: "courtside",
    id: "x",
    date: "2026-11-16",
    startMin: 990,
    endMin: 1040,
    title: "Barre",
    instructor: "Michelle Roberts",
    substitute: false,
    room: "Studio A",
    tags: [],
    cancelled: false,
    virtual: false,
    url: "https://example.com",
    ...overrides,
  };
}

describe("names and titles", () => {
  it("title-cases all-caps instructor names, keeping Mc", () => {
    expect(displayName("SARAH MCGRATH")).toBe("Sarah McGrath");
    expect(displayName("JOE GOMES")).toBe("Joe Gomes");
    expect(displayName("Madi McBride")).toBe("Madi McBride");
    expect(displayName("  ")).toBeNull();
  });

  it("turns Courtside markers into tags", () => {
    expect(cleanCourtsideTitle("Pilates Reformer | Mixed Level $")).toEqual({
      title: "Pilates Reformer: Mixed Level",
      tags: [{ kind: "fee", label: "Extra fee" }],
    });
    expect(cleanCourtsideTitle("Cycle: BOOKING REQUIRED ")).toEqual({
      title: "Cycle",
      tags: [{ kind: "booking", label: "Booking required" }],
    });
    expect(cleanCourtsideTitle("Les Mills CORE™").title).toBe("Les Mills CORE");
  });

  it("pulls heat, prerequisites and pop-ups out of Club LG names", () => {
    expect(cleanClubLgName("Hot Barre Fusion (heated) 🔥🔥", "Heated Studio")).toEqual({
      title: "Hot Barre Fusion",
      tags: [{ kind: "heated", label: "Heated" }],
    });
    expect(cleanClubLgName("Barbell WOD *Elements Required*", "Training Ground")).toEqual({
      title: "Barbell WOD",
      tags: [{ kind: "prereq", label: "Elements required" }],
    });
    const popUp = cleanClubLgName(
      "Community Class Intro to Mega Powerhouse Pop Up- A COMPLIMENTARY Trial!",
      "Pilates Reformer Studio",
    );
    expect(popUp.title).toBe("Community Class Intro to Mega Powerhouse Pop Up");
    expect(popUp.tags.map((tag) => tag.kind)).toEqual(["popup", "free"]);
    expect(cleanClubLgName("Body Shop- Total Body Burner", "Body Shop").title).toBe(
      "Body Shop: Total Body Burner",
    );
  });

  it("keeps kids' programs and private sessions out", () => {
    expect(isAdultGroupClass("$ Panthers Swim Team - Cubs $", "Aquatics")).toBe(false);
    expect(isAdultGroupClass("Youth Pilates Reformer")).toBe(false);
    expect(isAdultGroupClass("CPR Certification", "Safety")).toBe(false);
    expect(isAdultGroupClass("Beginner Pickleball Mixer", "Pickleball")).toBe(true);
    expect(isAdultGroupClass("Santa Clara Masters Swim", "Aquatics")).toBe(true);
  });
});

describe("clock", () => {
  it("reads Pacific wall-clock time from UTC instants", () => {
    const start = parseInstant("2026-11-13T00:30:00.0000000Z");
    expect(start && pacificClock(start)).toEqual({ date: "2026-11-12", minutes: 16 * 60 + 30 });
    expect(clockLabel(990)).toBe("4:30");
    expect(clockLabel(1050)).toBe("5:30");
  });

  it("lists five weekdays from today, skipping weekends", () => {
    expect(upcomingWeekdays("2026-11-13", 5)).toEqual([
      "2026-11-13",
      "2026-11-16",
      "2026-11-17",
      "2026-11-18",
      "2026-11-19",
    ]);
    expect(upcomingWeekdays("2026-11-14", 2)).toEqual(["2026-11-16", "2026-11-17"]);
  });
});

describe("window and grouping", () => {
  it("allows a 5:30 finish but not a later one, and nothing before 3", () => {
    expect(inWindow({ startMin: 990, endMin: 1050 })).toBe(true);
    expect(inWindow({ startMin: 1005, endMin: 1080 })).toBe(false);
    expect(inWindow({ startMin: 885, endMin: 935 })).toBe(false);
    expect(inWindow({ startMin: 900, endMin: 950 })).toBe(true);
  });

  it("folds a stream into its in-person twin", () => {
    const merged = mergeVirtualTwins([
      workout({ club: "clublg", id: "a", title: "Vinyasa", instructor: "Iris Gu" }),
      workout({ club: "clublg", id: "b", title: "Vinyasa Yoga", instructor: "Iris Gu", virtual: true }),
      workout({ club: "clublg", id: "c", title: "Yin Yoga", instructor: "Liliya Goldie", virtual: true }),
    ]);
    expect(merged.map((item) => item.id)).toEqual(["a", "c"]);
    expect(merged[0].tags).toContainEqual({ kind: "virtual", label: "Also virtual" });
  });

  it("puts today first, keeps a reserve day, and splits out cancellations", () => {
    const days = buildDays("2026-11-13", [
      workout({ id: "late", date: "2026-11-13", startMin: 1005, endMin: 1080 }),
      workout({ id: "b", date: "2026-11-13", startMin: 990, endMin: 1040 }),
      workout({ id: "a", date: "2026-11-13", startMin: 930, endMin: 980 }),
      workout({ id: "gone", date: "2026-11-18", cancelled: true }),
    ]);
    expect(days.map((day) => [day.heading, day.extra])).toEqual([
      ["Today", false],
      ["Monday", false],
      ["Tuesday", false],
      ["Wednesday", false],
      ["Thursday", false],
      ["Friday", true],
    ]);
    expect(days[0].classes.map((item) => item.id)).toEqual(["a", "b"]);
    expect(days[3].classes).toEqual([]);
    expect(days[3].cancelled.map((item) => item.id)).toEqual(["gone"]);
  });

  it("starts on Monday at the weekend, with no reserve day", () => {
    const days = buildDays("2026-11-15", []);
    expect(days.map((day) => day.heading)).toEqual(["Tomorrow", "Tuesday", "Wednesday", "Thursday", "Friday"]);
    expect(days.some((day) => day.extra)).toBe(false);
  });
});

describe("Courtside feed", () => {
  it("normalizes the Bay Club JSON", () => {
    const [item] = normalizeCourtside(
      [
        {
          title: "Boxing + Strength",
          id: "abc",
          category: "Group Fitness",
          location: "Studio A",
          instructor: "KAROLINE GINSBERG",
          status: "active",
          timeFromInMinutes: 990,
          timeToInMinutes: 1040,
          classDate: "2026-11-20",
          substitute: true,
        },
        { title: "$ Panthers Swim Team - Cubs $", category: "Aquatics", timeFromInMinutes: 990, timeToInMinutes: 1040 },
      ],
      "2026-11-20",
    );
    expect(item).toMatchObject({
      club: "courtside",
      date: "2026-11-20",
      title: "Boxing + Strength",
      instructor: "Karoline Ginsberg",
      substitute: true,
      url: "https://www.bayclubs.com/classes?c2=courtside&d=2026-11-20",
    });
  });
});

describe("Club LG feed", () => {
  const payload = [
    '0:["$","div",null,{"initialClasses":"$5"}]',
    '5:{"classes":[{"id":"cinst_1","name":"Barbell WOD *Elements Required*","staff":["$7"],"startDateTime":"2026-11-17T00:30:00.0000000Z","endDateTime":"2026-11-17T01:30:00.0000000Z","duration":60,"roomName":"Training Ground","location":"$6","description":"$8","cancelled":false,"bookable":true,"waitlistable":false,"availableOnlineBookings":3,"bookingWindowStart":"2026-09-17T07:00:00Z","isTbd":false},{"id":"cinst_2","name":"Virtual Vinyasa Yoga","staff":[{"displayLabel":"Iris Gu"}],"startDateTime":"2026-11-17T00:15:00.0000000Z","endDateTime":"2026-11-17T01:15:00.0000000Z","roomName":"VIRTUAL","cancelled":false,"bookable":true,"availableOnlineBookings":100,"isTbd":false}]}',
    '6:{"id":"loc_1","name":"The Club at Los Gatos"}',
    '7:{"id":"sspec_1","displayLabel":"Coral Lloyd"}',
  ].join("\n");
  const text = "Elements prerequisite. Costs $$0.";
  const flight = `${payload}\n8:T${new TextEncoder().encode(text).length.toString(16)},${text}`;
  const html = `<script>self.__next_f.push([1,${JSON.stringify(flight)}])</script>`;

  it("parses rows, text rows and references", () => {
    const rows = parseFlightRows(extractFlightPayload(html));
    expect(rows.get("8")).toBe(text);
    expect(resolveRefs("$6", rows)).toEqual({ id: "loc_1", name: "The Club at Los Gatos" });
    expect(resolveRefs("$$5", rows)).toBe("$5");
  });

  it("normalizes Mindbody classes in Pacific time", () => {
    const [barbell, stream] = normalizeClubLg(extractClubLgClasses(html), new Date("2026-11-13T18:00:00Z"));
    expect(barbell).toMatchObject({
      club: "clublg",
      date: "2026-11-16",
      startMin: 990,
      endMin: 1050,
      title: "Barbell WOD",
      instructor: "Coral Lloyd",
      room: "Training Ground",
      virtual: false,
    });
    expect(barbell.tags).toEqual([
      { kind: "prereq", label: "Elements required" },
      { kind: "spots", label: "3 spots left" },
    ]);
    expect(stream).toMatchObject({ title: "Vinyasa Yoga", virtual: true, room: null });
  });
});

describe("childcare hours", () => {
  it("reads day specs and time ranges", () => {
    expect(parseDaySpec("Monday-Friday: 8:00 am -1:00 pm")?.days).toEqual([1, 2, 3, 4, 5]);
    expect(parseDaySpec("Saturday & Sunday: 8:00 am – 1:00 pm")?.days).toEqual([6, 0]);
    expect(parseDaySpec("Monthly fees")).toBeNull();
    expect(parseRanges("7:45 AM - 1:30 PM & 3 PM - 7:45 PM")).toEqual([
      { start: 465, end: 810 },
      { start: 900, end: 1185 },
    ]);
    expect(rangeLabel({ start: 900, end: 1140 })).toBe("3–7 PM");
    expect(rangeLabel({ start: 465, end: 810 })).toBe("7:45 AM–1:30 PM");
  });

  it("reads the Courtside tab of the Bay Club childcare page", () => {
    const html = `
      <div data-w-tab="Courtside" class="childcare_tabs_link">Courtside</div>
      <div data-w-tab="Redwood Shores" class="childcare_tabs_content w-tab-pane"><p>Monday-Friday: 9:00 am -1:00 pm</p></div>
      <div data-w-tab="Courtside" class="childcare_tabs_content w-tab-pane"><div class="w-richtext">
        <h2>Courtside</h2><p><strong>Weekly Childcare Schedule<br/></strong>Single-day booking now available*</p>
        <p><strong><em>Age range: 6 months – 12 years.</em></strong></p>
        <p>Monday-Friday: 8:00 am -1:00 pm and 3:00 pm-7:00 pm</p>
        <p>Saturday &amp; Sunday: 8:00 am – 1:00 pm</p>
        <p>*<em>Only available reservation times will be visible.</em></p></div></div>
      <div data-w-tab="Carmel Valley" class="childcare_tabs_content w-tab-pane"><p>Monday-Friday: 8:30 am -1:00 pm</p></div>`;
    const hours = parseCourtsideChildcare(html);
    expect(hours?.[3]).toEqual([
      { start: 480, end: 780 },
      { start: 900, end: 1140 },
    ]);
    expect(hours?.[0]).toEqual([{ start: 480, end: 780 }]);
  });

  it("reads Club LG's Kid's Club hours, one line per day", () => {
    const html = `<p><strong>Kid’s Club Hours</strong></p>
      <p>Monday </p><ul><li><p>7:45 AM - 1:30 PM &amp; 3 PM - 7:45 PM</p></li></ul>
      <p>Tuesday</p><ul><li><p>8 AM - 1 PM &amp; 3 PM - 7:15 PM</p></li></ul>
      <p>Wednesday</p><ul><li><p>8 AM - 1 PM &amp; 3 PM - 7:45 PM</p></li></ul>
      <p>Thursday</p><ul><li><p>8 AM - 1 PM &amp; 3 PM - 7:15 PM </p></li></ul>
      <p>Friday</p><ul><li><p>8 AM - 1 PM &amp; 3 PM - 7 PM </p></li></ul>
      <p>Saturday: 7:45 AM - 1:30 PM </p><p>Sunday: 8 AM - 1 PM</p>
      <p>Included Planned daily crafts</p><p>Monday: 1 AM - 2 AM</p>`;
    const hours = parseClubLgChildcare(html);
    expect(hours?.[2]).toEqual([
      { start: 480, end: 780 },
      { start: 900, end: 1155 },
    ]);
    expect(hours?.[1]).toHaveLength(2);
    expect(hours?.[6]).toEqual([{ start: 465, end: 810 }]);
  });

  it("refuses a page without a full weekday schedule", () => {
    expect(parseClubLgChildcare("<p>Kid’s Club Hours</p><p>Monday</p><p>8 AM - 1 PM</p>")).toBeNull();
  });
});
