import { useState } from "react";
import { shipStatus } from "../lib/shipClockStatus";
import { MS_PER_DAY } from "../lib/time";

interface CommitData {
  days: number;
  message: string | null;
  sha: string;
  author: string | null;
  date: string;
  repo: string;
}

function parseRepo(raw: string): string | null {
  const cleaned = raw.trim()
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/\.git$/, "")
    .replace(/\/$/, "");
  if (!cleaned || !cleaned.includes("/")) return null;
  const parts = cleaned.split("/");
  if (parts.length < 2 || !parts[0] || !parts[1]) return null;
  return `${parts[0]}/${parts[1]}`;
}

export default function RepoTracker() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CommitData | null>(null);

  async function handleCheck() {
    const repo = parseRepo(input);
    if (!repo) {
      setError("enter a repo like owner/repo or paste a github url");
      return;
    }
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(
        `https://api.github.com/repos/${repo}/commits?per_page=1`,
        { headers: { Accept: "application/vnd.github.v3+json" } }
      );
      if (res.status === 403) throw new Error("rate limited — try again in a minute");
      if (res.status === 404) throw new Error("repo not found or is private");
      if (!res.ok) throw new Error("couldn't reach github");
      const commits = await res.json();
      if (!Array.isArray(commits) || !commits.length) throw new Error("no commits found");
      const commit = commits[0];
      const dateStr = commit.commit?.author?.date ?? commit.commit?.committer?.date;
      if (!dateStr) throw new Error("no commit date found");
      const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / MS_PER_DAY);
      setData({
        days,
        message: commit.commit?.message?.split("\n")[0].slice(0, 72) ?? null,
        sha: commit.sha?.slice(0, 7) ?? "unknown",
        author: commit.commit?.author?.name ?? null,
        date: dateStr,
        repo,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const status = data ? shipStatus(data.days) : null;

  return (
    <div className="sc-rt-wrap">
      <div className="sc-section-label" style={{ marginBottom: "12px" }}>
        check any public github repo
      </div>
      <div className="sc-rt-row">
        <input
          className="sc-rt-input"
          type="text"
          placeholder="owner/repo or github.com/owner/repo"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && handleCheck()}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="none"
        />
        <button className="sc-rt-btn" onClick={handleCheck} disabled={loading}>
          {loading ? "..." : "check"}
        </button>
      </div>
      {error && <p className="sc-rt-error">{error}</p>}
      {data && status && (
        <div className="sc-rt-result">
          <div className="sc-card" style={{ textAlign: "center", padding: "32px 48px" }}>
            {data.days === 0 ? (
              <>
                <div className="sc-number sc-today">today 🚀</div>
                <div className="sc-label">days since last commit</div>
              </>
            ) : (
              <>
                <div className="sc-number">{data.days}</div>
                <div className="sc-label">
                  {data.days === 1 ? "day" : "days"} since last commit
                </div>
              </>
            )}
            <div className={`sc-status sc-status--${status.tone}`}>
              {status.label}
            </div>
          </div>
          <div className="sc-rt-meta-card">
            <div className="sc-section-label" style={{ marginBottom: "8px" }}>
              latest commit · {data.repo}
            </div>
            <div className="sc-shipped-row">
              <span className="sc-project-badge">{data.repo.split("/")[1]}</span>
              {data.message && (
                <span className="sc-shipped-summary">{data.message}</span>
              )}
            </div>
            <div className="sc-shipped-meta">
              <a
                className="sc-meta-link sc-history-sha"
                href={`https://github.com/${data.repo}/commit/${data.sha}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {data.sha}
              </a>
              {data.author && <span>by {data.author}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
