import { describe, expect, it } from "vitest";
import { applyDowntownDetailTimes, eventRejectionReason, normalizeBusinessAddress } from "./sync-campbell-data.mjs";

describe("Downtown Campbell event detail enrichment", () => {
  it("adds detail-page times to a date-only single-day event", () => {
    const event = {
      title: "San Jose Rocks",
      date: "8/28/26",
      url: "https://www.downtowncampbell.com/event/example",
      startDate: "2026-08-28T00:00:00",
    };
    const detailHtml = `
      <div id="eventdetails">
        <div class="time-start">
          <div><strong>Starts at:</strong></div>
          <div class="time">5:30pm</div>
        </div>
        <div class="time-end">
          <div><strong>Ends at:</strong></div>
          <div class="time">7:30pm</div>
        </div>
      </div>
    `;

    expect(applyDowntownDetailTimes(event, detailHtml)).toMatchObject({
      date: "8/28/26, 5:30pm - 7:30pm",
      startDate: "2026-08-28T17:30:00",
      endDate: "2026-08-28T19:30:00",
    });
  });

  it("leaves multi-day all-day events unchanged", () => {
    const event = {
      title: "Sidewalk sale",
      date: "9/12 - 9/13",
      startDate: "2026-09-12T00:00:00",
      endDate: "2026-09-13T23:59:59",
    };

    expect(applyDowntownDetailTimes(event, "<div class=\"time\">10am</div>")).toEqual(event);
  });

  it("leaves date-only events unchanged when no detail time is present", () => {
    const event = {
      title: "Farmers' Market",
      date: "9/6/26",
      startDate: "2026-09-06T00:00:00",
    };

    expect(applyDowntownDetailTimes(event, "<div>No event time listed</div>")).toEqual(event);
  });
});

describe("Campbell business address cleanup", () => {
  it("normalizes the Chamber's Campbell Avenue typo", () => {
    expect(normalizeBusinessAddress("365 E Campell Ave, Campbell CA 95008")).toBe(
      "365 E Campbell Ave, Campbell CA 95008",
    );
  });
});

describe("Campbell public event filtering", () => {
  it("filters exact private-event placeholders from public calendar output", () => {
    expect(eventRejectionReason({ title: "Private Event" })).toBe("private event");
  });

  it("keeps named public meetings available for residents", () => {
    expect(eventRejectionReason({ title: "City Council Regular Meeting", category: "City Council" })).toBe("");
    expect(eventRejectionReason({ title: "Planning Commission Regular Meeting", category: "Planning Commission" })).toBe(
      "",
    );
  });
});
