import { describe, expect, it } from "vitest";
import {
  applyDowntownDetailTimes,
  eventRejectionReason,
  normalizeBusinessAddress,
  parseNoticeDetails,
} from "./sync-campbell-data.mjs";

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

describe("Campbell public notice parsing", () => {
  it("extracts details from two-column Planning Commission notices", () => {
    const text = `
      Notice of Public Hearing
      The Planning Commission of the City of Campbell will hold a Public Hearing at 7:00 p.m., or shortly thereafter, on Tuesday September
      22, 2026,in the Police Department Emergency Operations Center, 100 N First Street, Campbell, CA , to consider the following item:
      PROJECT INFO                                                                       PROJECT DESCRIPTION
      Project Address: 1581 W Campbell Avenue                                            Request to allow the establishment of an approximately 26,000-
      Zoning | Area Plan: NC | N/A                                                       square-foot grocery store (Apni Mandi Farmer's Market) with off-site
      Neighborhood Association(s): Moreland West                                         alcohol sales and 24-hour operation, including construction of an
      Neighborhood Assoc.                                                                approximately 920-square-foot mezzanine, tenant-related building
      Council District: 4                                                                facade alterations, and associated parking lot modifications
      File No.: PLN-2025-167
      APN: 307-16-015
      Application Type: Conditional Use Permit with Site and
      Architectural Review
      Project Planner: Daniel Fama, Senior Planner                                         \u2751 Watch YouTube live-stream:
      Contact: danielf@campbellca.gov | (408) 866-2193
    `;

    expect(parseNoticeDetails(text)).toMatchObject({
      hearingAt: "September 22, 2026 at 7:00 p.m.",
      address: "1581 W Campbell Avenue",
      fileNo: "PLN-2025-167",
      planner: "Daniel Fama, Senior Planner",
      summary:
        "Request to allow the establishment of an approximately 26,000-square-foot grocery store (Apni Mandi Farmer's Market) with off-site alcohol sales and 24-hour operation, including construction of an approximately 920-square-foot mezzanine, tenant-related building facade alterations, and associated parking lot modifications",
    });
  });
});
