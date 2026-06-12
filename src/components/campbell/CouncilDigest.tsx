import { useState, useCallback } from "react";
import {
  COUNCIL_SOURCE_STALE_AFTER_DAYS,
  DAY_MS,
  parseCampbellDate,
  startOfDay,
} from "../../lib/campbell/dateHelpers";
import {
  preferredCouncilRecord,
  type CampbellCouncilRecord,
  type DigestSummary,
} from "../../lib/campbell/types";
import councilFeed from "../../data/campbellCouncilRecords.json";

const LATEST_COUNCIL_RECORD = preferredCouncilRecord(councilFeed.items as CampbellCouncilRecord[]);

function councilSourceLooksStale() {
  const latestDate = parseCampbellDate(LATEST_COUNCIL_RECORD?.date ?? "");
  if (!latestDate) return false;

  const ageDays = Math.floor(
    (startOfDay(new Date()).getTime() - startOfDay(latestDate).getTime()) / DAY_MS,
  );
  return ageDays > COUNCIL_SOURCE_STALE_AFTER_DAYS;
}

export default function CouncilDigest() {
  const [digest, setDigest] = useState<DigestSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDigest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/campbell/digest", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load digest");
        return;
      }
      setDigest(data);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  if (!digest && !loading && !error) {
    const sourceLooksStale = councilSourceLooksStale();

    return (
      <div className="cb-digest-empty">
        <p className="cb-digest-info">
          Get a plain-English summary of the newest Campbell City Council agenda posted on the city's meeting portal.
          {sourceLooksStale && LATEST_COUNCIL_RECORD
            ? ` That source currently lists ${LATEST_COUNCIL_RECORD.date} as newest.`
            : " Meetings happen the 1st and 3rd Tuesday of each month."}
        </p>
        <button className="cb-digest-btn" onClick={loadDigest}>
          {sourceLooksStale ? "Summarize listed packet" : "Load latest digest"}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="cb-digest-loading">
        <div className="cb-spinner" />
        <p>Reading the listed council agenda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cb-digest-error">
        <p>{error}</p>
        <button className="cb-digest-btn" onClick={loadDigest}>
          Try again
        </button>
      </div>
    );
  }

  if (!digest) return null;

  return (
    <div className="cb-digest">
      <div className="cb-digest-header">
        <h3 className="cb-digest-date">{digest.title}</h3>
        <span className="cb-digest-meta">{digest.meetingDate}</span>
      </div>

      <div className="cb-digest-body">
        <p className="cb-digest-summary">{digest.summary}</p>

        {digest.keyTopics.length > 0 && (
          <div className="cb-digest-topics">
            <h4>Key topics</h4>
            <ul>
              {digest.keyTopics.map((topic, i) => (
                <li key={i}>{topic}</li>
              ))}
            </ul>
          </div>
        )}

        {digest.nextMeeting && (
          <p className="cb-digest-next">
            Next meeting: <strong>{digest.nextMeeting}</strong>
          </p>
        )}
      </div>

      <div className="cb-digest-footer">
        <a
          href={digest.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cb-digest-source"
        >
          View full agenda →
        </a>
        <span className="cb-digest-gen">
          AI-generated summary &middot; {new Date(digest.generatedAt).toLocaleDateString("en-US")}
        </span>
      </div>
    </div>
  );
}
