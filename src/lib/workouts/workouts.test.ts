import { describe, expect, it } from "vitest";
import { cleanClubLgName, cleanCourtsideTitle, displayName, isAdultGroupClass, isCalledOff } from "./clean";
import { pacificClock, parseInstant } from "./clock";
import { extractFlightPayload, parseFlightRows, resolveRefs } from "./flight";
import { clockLabel, countWord, daySummary, endLabel, windowWords } from "./labels";
import { modalityOf } from "./modality";
import { WEEKDAY_WINDOW, WEEKEND_WINDOW, buildDays, inWindow, mergeVirtualTwins, upcomingDates } from "./schedule";
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
    modality: "pilates",
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
    // Stephen has done Elements, so that prerequisite gets no tag; any other one still does.
    expect(cleanClubLgName("Barbell WOD *Elements Required*", "Training Ground")).toEqual({
      title: "Barbell WOD",
      tags: [],
    });
    expect(cleanClubLgName("Olympic Lifting *Coach Approval Required*", "Training Ground")).toEqual({
      title: "Olympic Lifting",
      tags: [{ kind: "prereq", label: "Coach approval required" }],
    });
    expect(cleanClubLgName("Hot 26 (heated 75 min) 🔥🔥", "Heated Studio")).toEqual({
      title: "Hot 26",
      tags: [{ kind: "heated", label: "Heated" }],
    });
    expect(cleanClubLgName("Toned (non-heated)", "Heated Studio")).toEqual({ title: "Toned", tags: [] });
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

  it("keeps kids' programs, private sessions and parties out", () => {
    expect(isAdultGroupClass("$ Panthers Swim Team - Cubs $", "Aquatics")).toBe(false);
    expect(isAdultGroupClass("Youth Pilates Reformer")).toBe(false);
    expect(isAdultGroupClass("CPR Certification", "Safety")).toBe(false);
    expect(isAdultGroupClass("Annual Harvest Party")).toBe(false);
    expect(isAdultGroupClass("Beginner Pickleball Mixer", "Pickleball")).toBe(true);
    expect(isAdultGroupClass("Santa Clara Masters Swim", "Aquatics")).toBe(true);
  });

  it("reads a called-off session from its name", () => {
    expect(isCalledOff("POSTPONED: Annual Harvest Party🍎🍂")).toBe(true);
    expect(isCalledOff("Cancelled - Yin Yoga")).toBe(true);
    expect(isCalledOff("Pilates Mega Classic")).toBe(false);
  });
});

describe("clock and labels", () => {
  it("reads Pacific wall-clock time from UTC instants", () => {
    const start = parseInstant("2026-11-13T00:30:00.0000000Z");
    expect(start && pacificClock(start)).toEqual({ date: "2026-11-12", minutes: 16 * 60 + 30 });
  });

  it("labels times without AM/PM, and noon as noon", () => {
    expect(clockLabel(990)).toBe("4:30");
    expect(clockLabel(480)).toBe("8:00");
    expect(endLabel(1050)).toBe("5:30");
    expect(endLabel(12 * 60)).toBe("noon");
    expect(windowWords(WEEKDAY_WINDOW.startMin, WEEKDAY_WINDOW.endMin)).toBe("3 and 5:30");
    expect(windowWords(WEEKEND_WINDOW.startMin, WEEKEND_WINDOW.endMin)).toBe("8 and noon");
  });

  it("spells out counts that open a sentence", () => {
    expect(countWord(0)).toBe("No");
    expect(countWord(4)).toBe("Four");
    expect(countWord(19)).toBe("Nineteen");
    expect(countWord(20)).toBe("Twenty");
    expect(countWord(23)).toBe("Twenty-three");
    expect(countWord(75)).toBe("75");
  });

  it("summarizes what's left today", () => {
    const at = (start: number, name = "Barre") => ({ start, name });
    expect(daySummary([at(990), at(990)], 0)).toBe("Two classes, all at 4:30.");
    expect(daySummary([at(480), at(510), ...Array(21).fill(at(600))], 0)).toBe(
      "Twenty-three classes, the first at 8:00.",
    );
    expect(daySummary([at(600, "Sweat60")], 2)).toBe("One more: Sweat60 at 10:00.");
    expect(daySummary([], 3)).toBe("Nothing else starts today.");
  });

  it("lists a week of dates from today", () => {
    expect(upcomingDates("2026-11-13", 4)).toEqual(["2026-11-13", "2026-11-14", "2026-11-15", "2026-11-16"]);
    expect(upcomingDates("2026-12-30", 3)).toEqual(["2026-12-30", "2026-12-31", "2027-01-01"]);
  });
});

describe("window and grouping", () => {
  it("weekdays: allows a 5:30 finish but not a later one, and nothing before 3", () => {
    const monday = "2026-11-16";
    expect(inWindow({ date: monday, startMin: 990, endMin: 1050 })).toBe(true);
    expect(inWindow({ date: monday, startMin: 1005, endMin: 1080 })).toBe(false);
    expect(inWindow({ date: monday, startMin: 885, endMin: 935 })).toBe(false);
    expect(inWindow({ date: monday, startMin: 900, endMin: 950 })).toBe(true);
    expect(inWindow({ date: monday, startMin: 540, endMin: 590 })).toBe(false);
  });

  it("weekends: 8 AM to noon, with a noon finish but no noon start", () => {
    for (const date of ["2026-11-14", "2026-11-15"]) {
      expect(inWindow({ date, startMin: 480, endMin: 530 })).toBe(true);
      expect(inWindow({ date, startMin: 660, endMin: 720 })).toBe(true);
      expect(inWindow({ date, startMin: 470, endMin: 520 })).toBe(false);
      expect(inWindow({ date, startMin: 690, endMin: 750 })).toBe(false);
      expect(inWindow({ date, startMin: 720, endMin: 770 })).toBe(false);
      expect(inWindow({ date, startMin: 990, endMin: 1040 })).toBe(false);
    }
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

  it("covers the week from today, weekends included, with a reserve day and no cancellations", () => {
    const days = buildDays("2026-11-13", [
      workout({ id: "late", date: "2026-11-13", startMin: 1005, endMin: 1080 }),
      workout({ id: "b", date: "2026-11-13", startMin: 990, endMin: 1040 }),
      workout({ id: "a", date: "2026-11-13", startMin: 930, endMin: 980 }),
      workout({ id: "sat-am", date: "2026-11-14", startMin: 540, endMin: 590 }),
      workout({ id: "sat-pm", date: "2026-11-14", startMin: 990, endMin: 1040 }),
      workout({ id: "sun-noon", date: "2026-11-15", startMin: 660, endMin: 720 }),
      workout({ id: "gone", date: "2026-11-18", cancelled: true }),
    ]);
    expect(days.map((day) => [day.heading, day.dateLabel, day.extra])).toEqual([
      ["Today", "Fri, Nov 13", false],
      ["Tomorrow", "Sat, Nov 14", false],
      ["Sunday", "Nov 15", false],
      ["Monday", "Nov 16", false],
      ["Tuesday", "Nov 17", false],
      ["Wednesday", "Nov 18", false],
      ["Thursday", "Nov 19", false],
      ["Friday", "Nov 20", true],
    ]);
    expect(days[0].classes.map((item) => item.id)).toEqual(["a", "b"]);
    expect(days[1].classes.map((item) => item.id)).toEqual(["sat-am"]);
    expect(days[1].window).toEqual(WEEKEND_WINDOW);
    expect(days[2].classes.map((item) => item.id)).toEqual(["sun-noon"]);
    expect(days[3].window).toEqual(WEEKDAY_WINDOW);
    expect(days[5].classes).toEqual([]);
  });

  it("starts with today's morning on a Saturday", () => {
    const days = buildDays("2026-11-14", []);
    expect(days.map((day) => day.heading)).toEqual([
      "Today",
      "Tomorrow",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ]);
    expect(days.map((day) => day.extra)).toEqual([false, false, false, false, false, false, false, true]);
    expect(days[0].window).toEqual(WEEKEND_WINDOW);
  });

  it("keeps a stream whose in-person twin was cancelled", () => {
    const [day] = buildDays("2026-11-16", [
      workout({ club: "clublg", id: "room", title: "Vinyasa", instructor: "Iris Gu", cancelled: true }),
      workout({ club: "clublg", id: "stream", title: "Vinyasa Yoga", instructor: "Iris Gu", virtual: true }),
    ]);
    expect(day.classes.map((item) => item.id)).toEqual(["stream"]);
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
    expect(barbell.tags).toEqual([{ kind: "spots", label: "3 spots left" }]);
    expect(stream).toMatchObject({ title: "Vinyasa Yoga", virtual: true, room: null });
  });
});

describe("modality colors", () => {
  it("sorts this week's classes into plate colors", () => {
    expect(modalityOf("Boxing + Strength")).toBe("strength");
    expect(modalityOf("Barbell WOD")).toBe("strength");
    expect(modalityOf("STRONG HIIT")).toBe("strength");
    expect(modalityOf("Hot Barre Fusion")).toBe("pilates");
    expect(modalityOf("Pilates Reformer: Mixed Level")).toBe("pilates");
    expect(modalityOf("Yoga Sculpt")).toBe("yoga");
    expect(modalityOf("Deep Stretch & Meditation")).toBe("yoga");
    expect(modalityOf("MixxedFit Dance")).toBe("cardio");
    expect(modalityOf("Beginner Pickleball Mixer", "Pickleball")).toBe("court");
    expect(modalityOf("Santa Clara Masters Swim", "Aquatics")).toBe("swim");
    expect(modalityOf("Mystery Hour")).toBe("other");
  });

  it("sorts weekend-morning classes too", () => {
    expect(modalityOf("BODYPUMP")).toBe("strength");
    expect(modalityOf("KnockOut")).toBe("strength");
    expect(modalityOf("Toned")).toBe("strength");
    expect(modalityOf("BODYCOMBAT")).toBe("cardio");
    expect(modalityOf("RPM")).toBe("cardio");
    expect(modalityOf("Latin Fusion")).toBe("cardio");
    expect(modalityOf("Walking Club")).toBe("cardio");
    expect(modalityOf("Hot 26")).toBe("yoga");
    expect(modalityOf("Hot26")).toBe("yoga");
    expect(modalityOf("Hot Power Fusion")).toBe("yoga");
    expect(modalityOf("Candle Lit Warm Flow")).toBe("yoga");
    expect(modalityOf("Mat Unwind")).toBe("yoga");
    expect(modalityOf("Rolling")).toBe("yoga");
    expect(modalityOf("Pilates Advanced Flow")).toBe("pilates");
    expect(modalityOf("Power Yoga 75")).toBe("yoga");
  });
});
